-- =============================================================================
-- Migration: Enforce guarded student submit and auto-hold invalid submitted rows
-- =============================================================================

-- Students must no longer be able to update their own clearance items directly.
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
  OR ((get_auth_user_role() = 'csp_division') AND (source_type = 'csp_division'))
  OR ((get_auth_user_role() = 'csg') AND (source_type = 'csg'))
  OR ((get_auth_user_role() = 'cspsg') AND (source_type = 'cspsg'))
)
WITH CHECK (
  is_admin()
  OR ((get_auth_user_role() = 'department') AND (source_type = 'department'))
  OR ((get_auth_user_role() = 'office') AND (source_type = 'office'))
  OR ((get_auth_user_role() = 'club') AND (source_type = 'club'))
  OR ((get_auth_user_role() = 'csg_department_lgu') AND (source_type = 'csg_department_lgu'))
  OR ((get_auth_user_role() = 'csp_division') AND (source_type = 'csp_division'))
  OR ((get_auth_user_role() = 'csg') AND (source_type = 'csg'))
  OR ((get_auth_user_role() = 'cspsg') AND (source_type = 'cspsg'))
);

-- Any relevant published requirement change should re-check whether currently
-- submitted/approved source items are still complete under the current rules.
CREATE OR REPLACE FUNCTION public.reset_clearance_items_on_new_published_requirement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_relevant_change boolean := false;
  affected_item RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_relevant_change := NEW.is_published = true;
  ELSE
    v_relevant_change := NEW.is_published = true AND (
      (OLD.is_published = false AND NEW.is_published = true)
      OR OLD.applicable_year_levels IS DISTINCT FROM NEW.applicable_year_levels
      OR OLD.is_required IS DISTINCT FROM NEW.is_required
      OR OLD.source_type IS DISTINCT FROM NEW.source_type
      OR OLD.source_id IS DISTINCT FROM NEW.source_id
    );
  END IF;

  IF NOT v_relevant_change THEN
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
      'Automatically reset: one or more required requirements became newly applicable for this source.'
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Repair any currently invalid submitted/approved source items.
WITH invalid_items AS (
  SELECT DISTINCT
    ci.id,
    ci.status AS from_status
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
),
updated_items AS (
  UPDATE clearance_items ci
  SET status = 'on_hold',
      remarks = 'A newly applicable requirement was added after your submission. Please review and re-submit.',
      reviewed_by = NULL,
      reviewed_at = NULL
  FROM invalid_items ii
  WHERE ci.id = ii.id
  RETURNING ci.id, ii.from_status
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
  'Automatically repaired: submitted item was missing a required applicable requirement.'
FROM updated_items ui;
