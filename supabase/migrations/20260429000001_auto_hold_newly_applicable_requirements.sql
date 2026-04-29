-- =============================================================================
-- Migration: Auto-hold newly applicable published requirements
-- =============================================================================
--
-- Fixes:
-- 1. Published requirement edits that expand applicability do not reopen already
--    submitted/approved clearance items.
-- 2. Missing source items created after a request is completed do not reopen the
--    parent clearance request.
-- 3. Client-side submit can force clearance_items.status='submitted' without a
--    server-side completeness check.
-- 4. Existing production rows already affected by this bug need remediation.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.recompute_clearance_request_status(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_items INT;
  v_approved    INT;
  v_rejected    INT;
  v_submitted   INT;
  v_on_hold     INT;
  v_new_status  TEXT;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'rejected'),
    COUNT(*) FILTER (WHERE status = 'submitted'),
    COUNT(*) FILTER (WHERE status = 'on_hold')
  INTO v_total_items, v_approved, v_rejected, v_submitted, v_on_hold
  FROM clearance_items
  WHERE request_id = p_request_id;

  IF v_total_items = 0 THEN
    v_new_status := 'pending';
  ELSIF v_approved = v_total_items THEN
    v_new_status := 'completed';
  ELSIF v_rejected > 0 OR v_approved > 0 OR v_submitted > 0 OR v_on_hold > 0 THEN
    v_new_status := 'in_progress';
  ELSE
    v_new_status := 'pending';
  END IF;

  UPDATE clearance_requests
  SET status = v_new_status,
      updated_at = now()
  WHERE id = p_request_id
    AND status IS DISTINCT FROM v_new_status;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_clearance_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id uuid;
BEGIN
  v_request_id := COALESCE(NEW.request_id, OLD.request_id);

  IF v_request_id IS NOT NULL THEN
    PERFORM public.recompute_clearance_request_status(v_request_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS trg_update_request_status ON public.clearance_items;
CREATE TRIGGER trg_update_request_status
AFTER INSERT OR UPDATE OR DELETE ON public.clearance_items
FOR EACH ROW
EXECUTE FUNCTION public.update_clearance_request_status();

COMMENT ON FUNCTION public.update_clearance_request_status() IS
'Recomputes parent clearance_requests.status after INSERT/UPDATE/DELETE on clearance_items.';

CREATE OR REPLACE FUNCTION public.reset_clearance_items_on_new_published_requirement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_publish_transition  boolean := false;
  v_source_changed      boolean := false;
  v_year_levels_changed boolean := false;
  affected_item         RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_publish_transition := NEW.is_published = true;
  ELSE
    v_publish_transition := OLD.is_published = false AND NEW.is_published = true;
    v_source_changed := OLD.source_type IS DISTINCT FROM NEW.source_type
      OR OLD.source_id IS DISTINCT FROM NEW.source_id;
    v_year_levels_changed := OLD.applicable_year_levels IS DISTINCT FROM NEW.applicable_year_levels;
  END IF;

  IF NOT (
    (TG_OP = 'INSERT' AND NEW.is_published = true)
    OR (TG_OP = 'UPDATE' AND (
      v_publish_transition
      OR (NEW.is_published = true AND (v_source_changed OR v_year_levels_changed))
    ))
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO clearance_items (request_id, source_type, source_id, status)
  SELECT DISTINCT cr.id, NEW.source_type, NEW.source_id, 'pending'
  FROM clearance_requests cr
  JOIN profiles p ON p.id = cr.student_id
  WHERE NOT EXISTS (
      SELECT 1
      FROM clearance_items ci
      WHERE ci.request_id = cr.id
        AND ci.source_type = NEW.source_type
        AND ci.source_id = NEW.source_id
    )
    AND (
      NEW.applicable_year_levels = '{}'::text[]
      OR p.year_level IS NULL
      OR p.year_level = ANY(NEW.applicable_year_levels)
    )
    AND (
      NEW.source_type IN ('department', 'office', 'cspsg', 'csg')
      OR (
        NEW.source_type = 'club'
        AND p.enrolled_clubs IS NOT NULL
        AND NEW.source_id::text = ANY(string_to_array(p.enrolled_clubs, ','))
      )
      OR (
        NEW.source_type = 'cspsg_division'
        AND p.department = 'CSP'
        AND p.cspsg_division IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM cspsg_divisions d
          WHERE d.id = NEW.source_id
            AND d.code = p.cspsg_division
        )
      )
      OR (
        NEW.source_type = 'csg_department_lgu'
        AND p.department IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM csg_department_lgus lgu
          WHERE lgu.id = NEW.source_id
            AND lgu.department_code = p.department
        )
      )
    )
  ON CONFLICT (request_id, source_type, source_id) DO NOTHING;

  FOR affected_item IN
    SELECT ci.id, ci.status
    FROM clearance_items ci
    JOIN clearance_requests cr ON cr.id = ci.request_id
    JOIN profiles p ON p.id = cr.student_id
    WHERE ci.source_type = NEW.source_type
      AND ci.source_id = NEW.source_id
      AND ci.status IN ('submitted', 'approved')
      AND (
        NEW.applicable_year_levels = '{}'::text[]
        OR p.year_level IS NULL
        OR p.year_level = ANY(NEW.applicable_year_levels)
      )
      AND (
        TG_OP = 'INSERT'
        OR v_publish_transition
        OR v_source_changed
        OR (
          v_year_levels_changed
          AND NOT (
            OLD.applicable_year_levels = '{}'::text[]
            OR p.year_level IS NULL
            OR p.year_level = ANY(OLD.applicable_year_levels)
          )
        )
      )
  LOOP
    UPDATE clearance_items
    SET status = 'on_hold',
        remarks = 'A newly applicable requirement was added after your submission. Please review and re-submit.',
        reviewed_by = NULL,
        reviewed_at = NULL
    WHERE id = affected_item.id;

    INSERT INTO clearance_item_history (
      clearance_item_id, from_status, to_status, actor_id, actor_role, remarks
    ) VALUES (
      affected_item.id,
      affected_item.status,
      'on_hold',
      NULL,
      'system',
      'Automatically reset: requirement "' || NEW.name || '" became newly applicable for this source.'
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_clearance_item_if_complete(
  p_item_id uuid,
  p_student_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id    uuid;
  v_owner_id      uuid;
  v_source_type   text;
  v_source_id     uuid;
  v_item_status   text;
  v_student_year  text;
  v_student_dept  text;
  v_student_clubs text;
  v_student_div   text;
  v_missing_count integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_student_id THEN
    RAISE EXCEPTION 'You are not allowed to submit this clearance item.'
      USING ERRCODE = '42501';
  END IF;

  SELECT
    ci.request_id,
    cr.student_id,
    ci.source_type,
    ci.source_id,
    ci.status,
    p.year_level,
    p.department,
    p.enrolled_clubs,
    p.cspsg_division
  INTO
    v_request_id,
    v_owner_id,
    v_source_type,
    v_source_id,
    v_item_status,
    v_student_year,
    v_student_dept,
    v_student_clubs,
    v_student_div
  FROM clearance_items ci
  JOIN clearance_requests cr ON cr.id = ci.request_id
  JOIN profiles p ON p.id = cr.student_id
  WHERE ci.id = p_item_id;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'Clearance item not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_owner_id IS DISTINCT FROM p_student_id THEN
    RAISE EXCEPTION 'You are not allowed to submit this clearance item.'
      USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*)
  INTO v_missing_count
  FROM requirements r
  WHERE r.source_type = v_source_type
    AND r.source_id = v_source_id
    AND r.is_published = true
    AND r.is_required = true
    AND (
      r.applicable_year_levels = '{}'::text[]
      OR v_student_year IS NULL
      OR v_student_year = ANY(r.applicable_year_levels)
    )
    AND (
      r.source_type IN ('department', 'office', 'cspsg', 'csg')
      OR (
        r.source_type = 'club'
        AND v_student_clubs IS NOT NULL
        AND r.source_id::text = ANY(string_to_array(v_student_clubs, ','))
      )
      OR (
        r.source_type = 'cspsg_division'
        AND v_student_dept = 'CSP'
        AND v_student_div IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM cspsg_divisions d
          WHERE d.id = r.source_id
            AND d.code = v_student_div
        )
      )
      OR (
        r.source_type = 'csg_department_lgu'
        AND v_student_dept IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM csg_department_lgus lgu
          WHERE lgu.id = r.source_id
            AND lgu.department_code = v_student_dept
        )
      )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM requirement_submissions rs
      WHERE rs.clearance_item_id = p_item_id
        AND rs.requirement_id = r.id
        AND rs.status IN ('submitted', 'verified')
    );

  IF v_missing_count > 0 THEN
    RAISE EXCEPTION 'Complete all currently applicable required requirements before submitting for review.'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE clearance_items
  SET status = 'submitted',
      remarks = NULL,
      reviewed_at = NULL,
      reviewed_by = NULL
  WHERE id = p_item_id;

  IF v_item_status IS DISTINCT FROM 'submitted' THEN
    INSERT INTO clearance_item_history (
      clearance_item_id, from_status, to_status, actor_id, actor_role, remarks
    ) VALUES (
      p_item_id,
      v_item_status,
      'submitted',
      p_student_id,
      'student',
      NULL
    );
  END IF;

  PERFORM public.recompute_clearance_request_status(v_request_id);
END;
$function$;

WITH mismatched_items AS (
  SELECT DISTINCT
    ci.id,
    ci.request_id,
    ci.status AS from_status
  FROM clearance_items ci
  JOIN clearance_requests cr ON cr.id = ci.request_id
  JOIN profiles p ON p.id = cr.student_id
  JOIN requirements r
    ON r.source_type = ci.source_type
   AND r.source_id = ci.source_id
   AND r.is_published = true
   AND r.is_required = true
  WHERE ci.status IN ('submitted', 'approved')
    AND (
      r.applicable_year_levels = '{}'::text[]
      OR p.year_level IS NULL
      OR p.year_level = ANY(r.applicable_year_levels)
    )
    AND (
      r.source_type IN ('department', 'office', 'cspsg', 'csg')
      OR (
        r.source_type = 'club'
        AND p.enrolled_clubs IS NOT NULL
        AND r.source_id::text = ANY(string_to_array(p.enrolled_clubs, ','))
      )
      OR (
        r.source_type = 'cspsg_division'
        AND p.department = 'CSP'
        AND p.cspsg_division IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM cspsg_divisions d
          WHERE d.id = r.source_id
            AND d.code = p.cspsg_division
        )
      )
      OR (
        r.source_type = 'csg_department_lgu'
        AND p.department IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM csg_department_lgus lgu
          WHERE lgu.id = r.source_id
            AND lgu.department_code = p.department
        )
      )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM requirement_submissions rs
      WHERE rs.clearance_item_id = ci.id
        AND rs.requirement_id = r.id
        AND rs.status IN ('submitted', 'verified')
    )
),
updated_items AS (
  UPDATE clearance_items ci
  SET status = 'on_hold',
      remarks = 'A newly applicable requirement was added after your submission. Please review and re-submit.',
      reviewed_by = NULL,
      reviewed_at = NULL
  FROM mismatched_items mi
  WHERE ci.id = mi.id
  RETURNING ci.id, ci.request_id, mi.from_status
)
INSERT INTO clearance_item_history (
  clearance_item_id, from_status, to_status, actor_id, actor_role, remarks
)
SELECT
  ui.id,
  ui.from_status,
  'on_hold',
  NULL,
  'system',
  'Automatically repaired: one or more currently applicable required requirements were missing.'
FROM updated_items ui;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT DISTINCT request_id
    FROM clearance_items
  LOOP
    PERFORM public.recompute_clearance_request_status(rec.request_id);
  END LOOP;
END $$;
