-- =============================================================================
-- Migration: Normalize cspsg_division source naming across auth, events, and RLS
-- =============================================================================

-- The canonical internal identifier remains 'cspsg_division'.
-- 'CSP Division' is a UI label only.

-- Recreate the source_type constraint for events to match the rest of the schema.
ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_source_type_check;

ALTER TABLE public.events
ADD CONSTRAINT events_source_type_check
CHECK (
  source_type = ANY (
    ARRAY[
      'department'::text,
      'office'::text,
      'club'::text,
      'csg_department_lgu'::text,
      'csp_division'::text,
      'cspsg_division'::text,
      'csg'::text,
      'cspsg'::text
    ]
  )
) NOT VALID;

-- Repair any drifted role/source_type rows after the constraint accepts the
-- canonical internal value.
UPDATE public.profiles
SET role = 'cspsg_division'
WHERE role = 'csp_division';

UPDATE public.requirements
SET source_type = 'cspsg_division'
WHERE source_type = 'csp_division';

UPDATE public.clearance_items
SET source_type = 'cspsg_division'
WHERE source_type = 'csp_division';

UPDATE public.events
SET source_type = 'cspsg_division'
WHERE source_type = 'csp_division';

ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_source_type_check;

ALTER TABLE public.events
ADD CONSTRAINT events_source_type_check
CHECK (
  source_type = ANY (
    ARRAY[
      'department'::text,
      'office'::text,
      'club'::text,
      'csg_department_lgu'::text,
      'cspsg_division'::text,
      'csg'::text,
      'cspsg'::text
    ]
  )
);

-- Normalize the shared source-head authorization helper used by events and attendance.
CREATE OR REPLACE FUNCTION public.is_source_head(p_source_type text, p_source_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_source_type = 'office' THEN
    RETURN EXISTS (SELECT 1 FROM offices WHERE id = p_source_id AND head_id = auth.uid());
  ELSIF p_source_type = 'department' THEN
    RETURN EXISTS (SELECT 1 FROM departments WHERE id = p_source_id AND head_id = auth.uid());
  ELSIF p_source_type = 'club' THEN
    RETURN EXISTS (SELECT 1 FROM clubs WHERE id = p_source_id AND adviser_id = auth.uid());
  ELSIF p_source_type = 'csg_department_lgu' THEN
    RETURN EXISTS (SELECT 1 FROM csg_department_lgus WHERE id = p_source_id AND head_id = auth.uid());
  ELSIF p_source_type = 'cspsg_division' THEN
    RETURN EXISTS (SELECT 1 FROM cspsg_divisions WHERE id = p_source_id AND head_id = auth.uid());
  ELSIF p_source_type = 'csg' THEN
    RETURN EXISTS (SELECT 1 FROM csg WHERE id = p_source_id AND head_id = auth.uid());
  ELSIF p_source_type = 'cspsg' THEN
    RETURN EXISTS (SELECT 1 FROM cspsg WHERE id = p_source_id AND head_id = auth.uid());
  END IF;

  RETURN FALSE;
END;
$function$;

-- Normalize the revalidation functions back to the canonical source type.
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
    OR (get_auth_user_role() = 'cspsg_division' AND p_source_type = 'cspsg_division')
    OR (get_auth_user_role() = 'csg' AND p_source_type = 'csg')
    OR (get_auth_user_role() = 'cspsg' AND p_source_type = 'cspsg')
  ) THEN
    RAISE EXCEPTION 'You are not allowed to revalidate this source.'
      USING ERRCODE = '42501';
  END IF;

  RETURN public.revalidate_source_clearance_items_internal(p_source_type, p_source_id, p_reason);
END;
$function$;

-- Repair the RLS and source policies that were drifted to csp_division.
DROP POLICY IF EXISTS "source_update_clearance_items" ON public.clearance_items;
CREATE POLICY "source_update_clearance_items" ON public.clearance_items
FOR UPDATE
TO public
USING (
  is_admin()
  OR ((get_auth_user_role() = 'department') AND (source_type = 'department'))
  OR ((get_auth_user_role() = 'office') AND (source_type = 'office'))
  OR ((get_auth_user_role() = 'club') AND (source_type = 'club'))
  OR ((get_auth_user_role() = 'csg_department_lgu') AND (source_type = 'csg_department_lgu'))
  OR ((get_auth_user_role() = 'cspsg_division') AND (source_type = 'cspsg_division'))
  OR ((get_auth_user_role() = 'csg') AND (source_type = 'csg'))
  OR ((get_auth_user_role() = 'cspsg') AND (source_type = 'cspsg'))
)
WITH CHECK (
  is_admin()
  OR ((get_auth_user_role() = 'department') AND (source_type = 'department'))
  OR ((get_auth_user_role() = 'office') AND (source_type = 'office'))
  OR ((get_auth_user_role() = 'club') AND (source_type = 'club'))
  OR ((get_auth_user_role() = 'csg_department_lgu') AND (source_type = 'csg_department_lgu'))
  OR ((get_auth_user_role() = 'cspsg_division') AND (source_type = 'cspsg_division'))
  OR ((get_auth_user_role() = 'csg') AND (source_type = 'csg'))
  OR ((get_auth_user_role() = 'cspsg') AND (source_type = 'cspsg'))
);

DROP POLICY IF EXISTS "staff_view_all_student_clearance_items" ON public.clearance_items;
CREATE POLICY "staff_view_all_student_clearance_items" ON public.clearance_items
FOR SELECT
TO authenticated
USING (
  get_auth_user_role() = ANY (
    ARRAY[
      'department'::text,
      'office'::text,
      'club'::text,
      'csg_department_lgu'::text,
      'cspsg_division'::text,
      'csg'::text,
      'cspsg'::text
    ]
  )
);

DROP POLICY IF EXISTS "view_clearance_items" ON public.clearance_items;
CREATE POLICY "view_clearance_items" ON public.clearance_items
FOR SELECT
TO authenticated
USING (
  is_admin()
  OR ((get_auth_user_role() = 'department') AND (source_type = 'department'))
  OR ((get_auth_user_role() = 'office') AND (source_type = 'office'))
  OR ((get_auth_user_role() = 'club') AND (source_type = 'club'))
  OR ((get_auth_user_role() = 'csg_department_lgu') AND (source_type = 'csg_department_lgu'))
  OR ((get_auth_user_role() = 'cspsg_division') AND (source_type = 'cspsg_division'))
  OR ((get_auth_user_role() = 'csg') AND (source_type = 'csg'))
  OR ((get_auth_user_role() = 'cspsg') AND (source_type = 'cspsg'))
  OR (
    request_id IN (
      SELECT id
      FROM clearance_requests
      WHERE student_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "view_clearance_requests" ON public.clearance_requests;
CREATE POLICY "view_clearance_requests" ON public.clearance_requests
FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()
  OR get_auth_user_role() = ANY (
    ARRAY[
      'admin'::text,
      'department'::text,
      'office'::text,
      'club'::text,
      'csg_department_lgu'::text,
      'cspsg_division'::text,
      'csg'::text,
      'cspsg'::text
    ]
  )
);

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR is_admin()
  OR (
    role = 'student'
    AND get_auth_user_role() = ANY (
      ARRAY[
        'department'::text,
        'office'::text,
        'club'::text,
        'csg_department_lgu'::text,
        'cspsg_division'::text,
        'csg'::text,
        'cspsg'::text
      ]
    )
  )
  OR is_actor_in_my_clearance_history(id)
);

DROP POLICY IF EXISTS "source_update_submissions" ON public.requirement_submissions;
CREATE POLICY "source_update_submissions" ON public.requirement_submissions
FOR UPDATE
TO public
USING (
  is_admin()
  OR ((get_auth_user_role() = 'department') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'department')))
  OR ((get_auth_user_role() = 'office') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'office')))
  OR ((get_auth_user_role() = 'club') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'club')))
  OR ((get_auth_user_role() = 'csg_department_lgu') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'csg_department_lgu')))
  OR ((get_auth_user_role() = 'cspsg_division') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'cspsg_division')))
  OR ((get_auth_user_role() = 'csg') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'csg')))
  OR ((get_auth_user_role() = 'cspsg') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'cspsg')))
);

DROP POLICY IF EXISTS "source_view_submissions" ON public.requirement_submissions;
CREATE POLICY "source_view_submissions" ON public.requirement_submissions
FOR SELECT
TO authenticated
USING (
  is_admin()
  OR ((get_auth_user_role() = 'department') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'department')))
  OR ((get_auth_user_role() = 'office') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'office')))
  OR ((get_auth_user_role() = 'club') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'club')))
  OR ((get_auth_user_role() = 'csg_department_lgu') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'csg_department_lgu')))
  OR ((get_auth_user_role() = 'cspsg_division') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'cspsg_division')))
  OR ((get_auth_user_role() = 'csg') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'csg')))
  OR ((get_auth_user_role() = 'cspsg') AND (clearance_item_id IN (SELECT id FROM clearance_items WHERE source_type = 'cspsg')))
  OR (student_id = auth.uid())
);

DROP POLICY IF EXISTS "source_manage_requirements" ON public.requirements;
CREATE POLICY "source_manage_requirements" ON public.requirements
FOR ALL
TO authenticated
USING (
  is_admin()
  OR ((get_auth_user_role() = 'department') AND (source_type = 'department'))
  OR ((get_auth_user_role() = 'office') AND (source_type = 'office'))
  OR ((get_auth_user_role() = 'club') AND (source_type = 'club'))
  OR ((get_auth_user_role() = 'csg_department_lgu') AND (source_type = 'csg_department_lgu'))
  OR ((get_auth_user_role() = 'cspsg_division') AND (source_type = 'cspsg_division'))
  OR ((get_auth_user_role() = 'csg') AND (source_type = 'csg'))
  OR ((get_auth_user_role() = 'cspsg') AND (source_type = 'cspsg'))
)
WITH CHECK (
  is_admin()
  OR ((get_auth_user_role() = 'department') AND (source_type = 'department'))
  OR ((get_auth_user_role() = 'office') AND (source_type = 'office'))
  OR ((get_auth_user_role() = 'club') AND (source_type = 'club'))
  OR ((get_auth_user_role() = 'csg_department_lgu') AND (source_type = 'csg_department_lgu'))
  OR ((get_auth_user_role() = 'cspsg_division') AND (source_type = 'cspsg_division'))
  OR ((get_auth_user_role() = 'csg') AND (source_type = 'csg'))
  OR ((get_auth_user_role() = 'cspsg') AND (source_type = 'cspsg'))
);
