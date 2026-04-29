-- =============================================================================
-- Migration: Do not block student submission on attendance-only requirements
-- =============================================================================

-- Attendance-based requirements are fulfilled by office scan and should not
-- prevent a student from submitting their clearance item for review.

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
    AND r.is_attendance = false
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
            p_source_type = 'cspsg_division'
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
          AND r.is_attendance = false
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
