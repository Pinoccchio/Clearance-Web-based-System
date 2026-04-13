-- =============================================================================
-- Migration: Fix cspsg_division RLS policies and create_clearance_items trigger
-- =============================================================================
--
-- Root causes fixed:
-- 1. Division heads have no RLS SELECT on clearance_items → queue/history empty
-- 2. Division heads have no RLS UPDATE on clearance_items → can't approve/reject
-- 3. Division heads have no RLS SELECT on clearance_requests → dashboard broken
-- 4. Division heads have no RLS SELECT on profiles for their students → wrong count
-- 5. Division heads have no RLS SELECT on clearance_item_history → timeline broken
-- 6. Division heads have no RLS SELECT on requirement_submissions → review broken
-- 7. create_clearance_items_for_request() ignores cspsg_division source type
-- 8. reset_clearance_items_on_new_published_requirement() ignores cspsg_division
-- 9. Backfill missing clearance_items for existing active requests
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. clearance_items: SELECT for division heads
--
-- NOTE: "Students can view their own clearance items" (from 20260305000003) and
-- "staff_view_all_student_clearance_items" (from 20260313000005) already exist.
-- This policy is additive — division heads can see items where source_type is
-- 'cspsg_division' and the division's head_id matches the current user.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Division heads can view their division clearance items" ON clearance_items;
CREATE POLICY "Division heads can view their division clearance items"
ON clearance_items
FOR SELECT
TO authenticated
USING (
  source_type = 'cspsg_division'
  AND EXISTS (
    SELECT 1 FROM cspsg_divisions d
    WHERE d.id = source_id
      AND d.head_id = (SELECT auth.uid())
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. clearance_items: UPDATE for division heads (approve / reject)
--
-- Both USING and WITH CHECK guard must match so a head cannot move an item to
-- a different source or elevate privileges.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Division heads can update their division clearance items" ON clearance_items;
CREATE POLICY "Division heads can update their division clearance items"
ON clearance_items
FOR UPDATE
TO authenticated
USING (
  source_type = 'cspsg_division'
  AND EXISTS (
    SELECT 1 FROM cspsg_divisions d
    WHERE d.id = source_id
      AND d.head_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  source_type = 'cspsg_division'
  AND EXISTS (
    SELECT 1 FROM cspsg_divisions d
    WHERE d.id = source_id
      AND d.head_id = (SELECT auth.uid())
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. clearance_requests: SELECT for division heads
--
-- Allows a division head to see clearance requests for students whose
-- profiles.cspsg_division column matches the head's division code.
-- The AND p.department = 'CSP' guard enforces the business rule that
-- cspsg_division membership is exclusive to CSP students only.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Division heads can view clearance requests for their students" ON clearance_requests;
CREATE POLICY "Division heads can view clearance requests for their students"
ON clearance_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    JOIN cspsg_divisions d ON d.code = p.cspsg_division
    WHERE p.id = clearance_requests.student_id
      AND p.department = 'CSP'
      AND d.head_id = (SELECT auth.uid())
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. profiles: SELECT for division heads (see students in their division)
--
-- Strictly limited to CSP student profiles who have chosen the head's division.
-- department = 'CSP' enforces the business rule that only CSP students belong
-- to a division — prevents a stray cspsg_division value on a non-CSP student
-- from leaking their profile to a division head.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Division heads can view student profiles in their division" ON profiles;
CREATE POLICY "Division heads can view student profiles in their division"
ON profiles
FOR SELECT
TO authenticated
USING (
  role = 'student'
  AND department = 'CSP'
  AND cspsg_division IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM cspsg_divisions d
    WHERE d.code = cspsg_division
      AND d.head_id = (SELECT auth.uid())
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. clearance_item_history: SELECT for division heads (status timeline)
--
-- NOTE: Migration 20260401000001 added a broad USING (true) policy that grants
-- all authenticated users access to history. That policy remains in effect and
-- is more permissive. This policy is redundant but harmless — it is kept to be
-- explicit about the intended access model and is idempotent via DROP IF EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Division heads can view history for their division items" ON clearance_item_history;
CREATE POLICY "Division heads can view history for their division items"
ON clearance_item_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM clearance_items ci
    JOIN cspsg_divisions d ON d.id = ci.source_id
    WHERE ci.id = clearance_item_id
      AND ci.source_type = 'cspsg_division'
      AND d.head_id = (SELECT auth.uid())
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. requirement_submissions: SELECT for division heads (submission review)
--
-- Allows a division head to view requirement submissions tied to clearance items
-- that belong to their division. Carefully scoped to avoid leaking submissions
-- from other sources (department, office, club, etc.).
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Division heads can view submissions for their division items" ON requirement_submissions;
CREATE POLICY "Division heads can view submissions for their division items"
ON requirement_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM clearance_items ci
    JOIN cspsg_divisions d ON d.id = ci.source_id
    WHERE ci.id = clearance_item_id
      AND ci.source_type = 'cspsg_division'
      AND d.head_id = (SELECT auth.uid())
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Fix create_clearance_items_for_request() to include cspsg_division
--
-- Previous version (20260305000001) only handled 'department' and 'office'.
-- Now extended to handle: cspsg, csg, cspsg_division, csg_department_lgu.
-- SECURITY DEFINER is required so the trigger can read profiles and requirements
-- regardless of the RLS policies of the user who created the clearance request.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_clearance_items_for_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  src              RECORD;
  v_enrolled_clubs TEXT;
  v_cspsg_division TEXT;
  v_department     TEXT;
BEGIN
  -- Get the student's key attributes
  SELECT enrolled_clubs, cspsg_division, department
  INTO   v_enrolled_clubs, v_cspsg_division, v_department
  FROM   profiles
  WHERE  id = NEW.student_id;

  FOR src IN
    SELECT DISTINCT source_type, source_id
    FROM requirements
    WHERE is_published = true
      AND (
        -- Always include school-wide department and office sources
        source_type IN ('department', 'office', 'cspsg', 'csg')

        -- Club: only if student is enrolled in that specific club
        OR (
          source_type = 'club'
          AND v_enrolled_clubs IS NOT NULL
          AND source_id::text = ANY(string_to_array(v_enrolled_clubs, ','))
        )

        -- CSPSG Division: only CSP students who belong to that specific division.
        -- v_department = 'CSP' enforces the business rule that only CSP students
        -- can be in a division — guards against stray cspsg_division data.
        OR (
          source_type = 'cspsg_division'
          AND v_department = 'CSP'
          AND v_cspsg_division IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM cspsg_divisions d
            WHERE d.id = source_id
              AND d.code = v_cspsg_division
          )
        )

        -- CSG Department LGU: only if student's department matches
        OR (
          source_type = 'csg_department_lgu'
          AND v_department IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM csg_department_lgus lgu
            WHERE lgu.id = source_id
              AND lgu.department_code = v_department
          )
        )
      )
  LOOP
    INSERT INTO clearance_items (request_id, source_type, source_id, status)
    VALUES (NEW.id, src.source_type, src.source_id, 'pending')
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Fix reset_clearance_items_on_new_published_requirement() for cspsg_division
--
-- Previous version (20260313000004) only created missing items for
-- 'department', 'office', and 'club' source types. Now extended to also handle
-- 'cspsg_division' and 'csg_department_lgu'.
--
-- SECURITY DEFINER is added because:
--   - The trigger fires when an admin/head publishes a requirement.
--   - It must INSERT into clearance_items for ALL students matching the source,
--     not just students the triggering user can see via RLS.
--   - Without SECURITY DEFINER, the INSERT could silently skip rows when the
--     triggering user's RLS does not grant access to those clearance_items.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reset_clearance_items_on_new_published_requirement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_item RECORD;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.is_published = true)
     OR (TG_OP = 'UPDATE' AND OLD.first_published_at IS NULL AND NEW.first_published_at IS NOT NULL)
  THEN
    -- Reset existing submitted/approved items to on_hold
    FOR affected_item IN
      SELECT id, status
      FROM clearance_items
      WHERE source_type = NEW.source_type
        AND source_id   = NEW.source_id
        AND status IN ('submitted', 'approved')
    LOOP
      UPDATE clearance_items
      SET status      = 'on_hold',
          remarks     = 'A new requirement was added after your submission. Please review and re-submit.',
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
        'Automatically reset: new requirement "' || NEW.name || '" was published for this source.'
      );
    END LOOP;

    -- Create missing clearance_items for all active requests that don't yet have one
    INSERT INTO clearance_items (request_id, source_type, source_id, status)
    SELECT DISTINCT cr.id, NEW.source_type, NEW.source_id, 'pending'
    FROM clearance_requests cr
    JOIN profiles p ON p.id = cr.student_id
    WHERE cr.status != 'completed'
      AND NOT EXISTS (
        SELECT 1 FROM clearance_items ci
        WHERE ci.request_id = cr.id
          AND ci.source_type = NEW.source_type
          AND ci.source_id   = NEW.source_id
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
            SELECT 1 FROM cspsg_divisions d
            WHERE d.id = NEW.source_id
              AND d.code = p.cspsg_division
          )
        )
        OR (
          NEW.source_type = 'csg_department_lgu'
          AND p.department IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM csg_department_lgus lgu
            WHERE lgu.id = NEW.source_id
              AND lgu.department_code = p.department
          )
        )
      );
  END IF;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Backfill: create missing clearance_items for cspsg_division sources
--    for all existing active (non-completed) clearance requests.
--
-- Uses ON CONFLICT DO NOTHING — safe because clearance_items has a unique
-- constraint on (request_id, source_type, source_id).
-- Runs as a migration-time statement (service role), so RLS is bypassed.
-- ─────────────────────────────────────────────────────────────────────────────

-- 9a. Backfill for cspsg_division
INSERT INTO clearance_items (request_id, source_type, source_id, status)
SELECT DISTINCT
  cr.id       AS request_id,
  r.source_type,
  r.source_id,
  'pending'   AS status
FROM clearance_requests cr
JOIN profiles p ON p.id = cr.student_id
JOIN requirements r
  ON r.is_published = true
  AND r.source_type = 'cspsg_division'
  AND p.department = 'CSP'
  AND p.cspsg_division IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM cspsg_divisions d
    WHERE d.id = r.source_id
      AND d.code = p.cspsg_division
  )
WHERE cr.status != 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM clearance_items ci
    WHERE ci.request_id = cr.id
      AND ci.source_type = r.source_type
      AND ci.source_id   = r.source_id
  )
ON CONFLICT DO NOTHING;

-- 9b. Backfill for csg_department_lgu (same pattern, often missed)
INSERT INTO clearance_items (request_id, source_type, source_id, status)
SELECT DISTINCT
  cr.id       AS request_id,
  r.source_type,
  r.source_id,
  'pending'   AS status
FROM clearance_requests cr
JOIN profiles p ON p.id = cr.student_id
JOIN requirements r
  ON r.is_published = true
  AND r.source_type = 'csg_department_lgu'
  AND p.department IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM csg_department_lgus lgu
    WHERE lgu.id = r.source_id
      AND lgu.department_code = p.department
  )
WHERE cr.status != 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM clearance_items ci
    WHERE ci.request_id = cr.id
      AND ci.source_type = r.source_type
      AND ci.source_id   = r.source_id
  )
ON CONFLICT DO NOTHING;

-- 9c. Recalculate clearance_requests.status for all affected active requests
--     (after backfill, requests that had no items should now correctly reflect
--      their progress rather than remaining stuck at 'pending')
UPDATE clearance_requests cr
SET status     = sub.new_status,
    updated_at = now()
FROM (
  SELECT
    ci.request_id,
    CASE
      WHEN COUNT(*) = COUNT(*) FILTER (WHERE ci.status = 'approved') THEN 'completed'
      WHEN COUNT(*) FILTER (WHERE ci.status IN ('rejected', 'approved', 'submitted', 'on_hold')) > 0 THEN 'in_progress'
      ELSE 'pending'
    END AS new_status
  FROM clearance_items ci
  GROUP BY ci.request_id
) sub
WHERE cr.id = sub.request_id
  AND cr.status != sub.new_status
  AND cr.status != 'completed';
