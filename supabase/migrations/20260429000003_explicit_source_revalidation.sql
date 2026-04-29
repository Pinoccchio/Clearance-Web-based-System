-- =============================================================================
-- Migration: Explicit source revalidation after requirement mutations
-- =============================================================================

CREATE OR REPLACE FUNCTION public.revalidate_source_clearance_items_internal(
  p_source_type text,
  p_source_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_changed_count integer := 0;
  v_default_reason text := 'A newly applicable requirement was added after your submission. Please review and re-submit.';
  v_history_reason text := COALESCE(
    p_reason,
    'Automatically reset: one or more required requirements became newly applicable for this source.'
  );
  v_item RECORD;
BEGIN
  INSERT INTO clearance_items (request_id, source_type, source_id, status)
  SELECT DISTINCT cr.id, p_source_type, p_source_id, 'pending'
  FROM clearance_requests cr
  JOIN profiles p ON p.id = cr.student_id
  WHERE cr.status != 'completed'
    AND NOT EXISTS (
      SELECT 1
      FROM clearance_items ci
      WHERE ci.request_id = cr.id
        AND ci.source_type = p_source_type
        AND ci.source_id = p_source_id
    )
    AND EXISTS (
      SELECT 1
      FROM requirements r
      WHERE r.source_type = p_source_type
        AND r.source_id = p_source_id
        AND r.is_published = true
        AND (
          r.applicable_year_levels = '{}'::text[]
          OR p.year_level IS NULL
          OR p.year_level = ANY(r.applicable_year_levels)
        )
        AND (
          p_source_type IN ('department', 'office', 'cspsg', 'csg')
          OR (
            p_source_type = 'club'
            AND p.enrolled_clubs IS NOT NULL
            AND p_source_id::text = ANY(string_to_array(p.enrolled_clubs, ','))
          )
          OR (
            p_source_type IN ('csp_division', 'cspsg_division')
            AND p.department = 'CSP'
            AND p.cspsg_division IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM cspsg_divisions d
              WHERE d.id = p_source_id
                AND d.code = p.cspsg_division
            )
          )
          OR (
            p_source_type = 'csg_department_lgu'
            AND p.department IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM csg_department_lgus lgu
              WHERE lgu.id = p_source_id
                AND lgu.department_code = p.department
            )
          )
        )
    )
  ON CONFLICT (request_id, source_type, source_id) DO NOTHING;

  FOR v_item IN
    SELECT ci.id, ci.request_id, ci.status
    FROM clearance_items ci
    JOIN clearance_requests cr ON cr.id = ci.request_id
    JOIN profiles p ON p.id = cr.student_id
    WHERE ci.source_type = p_source_type
      AND ci.source_id = p_source_id
      AND ci.status IN ('submitted', 'approved')
      AND EXISTS (
        SELECT 1
        FROM requirements r
        WHERE r.source_type = ci.source_type
          AND r.source_id = ci.source_id
          AND r.is_published = true
          AND r.is_required = true
          AND (
            r.applicable_year_levels = '{}'::text[]
            OR p.year_level IS NULL
            OR p.year_level = ANY(r.applicable_year_levels)
          )
          AND NOT EXISTS (
            SELECT 1
            FROM requirement_submissions rs
            WHERE rs.clearance_item_id = ci.id
              AND rs.requirement_id = r.id
              AND rs.status IN ('submitted', 'verified')
          )
      )
  LOOP
    UPDATE clearance_items
    SET status = 'on_hold',
        remarks = COALESCE(p_reason, v_default_reason),
        reviewed_by = NULL,
        reviewed_at = NULL
    WHERE id = v_item.id
      AND status IN ('submitted', 'approved');

    IF FOUND THEN
      INSERT INTO clearance_item_history (
        clearance_item_id, from_status, to_status, actor_id, actor_role, remarks
      ) VALUES (
        v_item.id,
        v_item.status,
        'on_hold',
        NULL,
        'system',
        v_history_reason
      );

      PERFORM public.recompute_clearance_request_status(v_item.request_id);
      v_changed_count := v_changed_count + 1;
    END IF;
  END LOOP;

  RETURN v_changed_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.revalidate_source_clearance_items(
  p_source_type text,
  p_source_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You are not allowed to revalidate this source.'
      USING ERRCODE = '42501';
  END IF;

  IF NOT (
    is_admin()
    OR (get_auth_user_role() = 'department' AND p_source_type = 'department')
    OR (get_auth_user_role() = 'office' AND p_source_type = 'office')
    OR (get_auth_user_role() = 'club' AND p_source_type = 'club')
    OR (get_auth_user_role() = 'csg_department_lgu' AND p_source_type = 'csg_department_lgu')
    OR (get_auth_user_role() = 'csp_division' AND p_source_type IN ('csp_division', 'cspsg_division'))
    OR (get_auth_user_role() = 'csg' AND p_source_type = 'csg')
    OR (get_auth_user_role() = 'cspsg' AND p_source_type = 'cspsg')
  ) THEN
    RAISE EXCEPTION 'You are not allowed to revalidate this source.'
      USING ERRCODE = '42501';
  END IF;

  RETURN public.revalidate_source_clearance_items_internal(p_source_type, p_source_id, p_reason);
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_clearance_items_on_new_published_requirement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_relevant_change boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_relevant_change := NEW.is_published = true;
  ELSE
    v_relevant_change := (
      OLD.is_published IS DISTINCT FROM NEW.is_published
      OR OLD.applicable_year_levels IS DISTINCT FROM NEW.applicable_year_levels
      OR OLD.is_required IS DISTINCT FROM NEW.is_required
      OR OLD.source_type IS DISTINCT FROM NEW.source_type
      OR OLD.source_id IS DISTINCT FROM NEW.source_id
    );
  END IF;

  IF v_relevant_change THEN
    PERFORM public.revalidate_source_clearance_items_internal(
      NEW.source_type,
      NEW.source_id,
      'A requirement was updated after your submission. Please review and re-submit.'
    );
  END IF;

  RETURN NEW;
END;
$function$;

DO $$
DECLARE
  v_source RECORD;
BEGIN
  FOR v_source IN
    SELECT DISTINCT ci.source_type, ci.source_id
    FROM clearance_items ci
    JOIN clearance_requests cr ON cr.id = ci.request_id
    JOIN profiles p ON p.id = cr.student_id
    WHERE ci.status IN ('submitted', 'approved')
      AND EXISTS (
        SELECT 1
        FROM requirements r
        WHERE r.source_type = ci.source_type
          AND r.source_id = ci.source_id
          AND r.is_published = true
          AND r.is_required = true
          AND (
            r.applicable_year_levels = '{}'::text[]
            OR p.year_level IS NULL
            OR p.year_level = ANY(r.applicable_year_levels)
          )
          AND NOT EXISTS (
            SELECT 1
            FROM requirement_submissions rs
            WHERE rs.clearance_item_id = ci.id
              AND rs.requirement_id = r.id
              AND rs.status IN ('submitted', 'verified')
          )
      )
  LOOP
    PERFORM public.revalidate_source_clearance_items_internal(
      v_source.source_type,
      v_source.source_id,
      'A requirement was updated after your submission. Please review and re-submit.'
    );
  END LOOP;
END $$;
