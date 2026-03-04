-- Migration: Fix triggers + cleanup orphan data (Bugs 1, 3, 6)
--
-- Bug 1: create_clearance_items_for_request creates items for ALL clubs,
--         not just the student's enrolled clubs → blocks completion.
-- Bug 3: update_clearance_request_status treats submitted/on_hold as "pending"
--         → student who submitted everything still sees "pending".
-- Bug 6: All 6 DB functions missing SET search_path → security risk.
--
-- Also: delete orphan club items + recalculate request statuses.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Fix create_clearance_items_for_request (Bug 1 + Bug 6 search_path)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_clearance_items_for_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  src RECORD;
  v_enrolled_clubs text;
BEGIN
  -- Get the student's enrolled clubs (comma-separated list of club IDs)
  SELECT enrolled_clubs INTO v_enrolled_clubs
  FROM profiles
  WHERE id = NEW.student_id;

  FOR src IN
    SELECT DISTINCT source_type, source_id
    FROM requirements
    WHERE is_published = true
      AND (
        -- Always include department and office sources
        source_type IN ('department', 'office')
        -- Only include club sources the student is actually enrolled in
        OR (
          source_type = 'club'
          AND v_enrolled_clubs IS NOT NULL
          AND source_id::text = ANY(string_to_array(v_enrolled_clubs, ','))
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Fix update_clearance_request_status (Bug 3 + Bug 6 search_path)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_clearance_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_items   INT;
  v_approved      INT;
  v_rejected      INT;
  v_submitted     INT;
  v_on_hold       INT;
  v_new_status    TEXT;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'rejected'),
    COUNT(*) FILTER (WHERE status = 'submitted'),
    COUNT(*) FILTER (WHERE status = 'on_hold')
  INTO v_total_items, v_approved, v_rejected, v_submitted, v_on_hold
  FROM clearance_items
  WHERE request_id = NEW.request_id;

  -- Nothing to evaluate if no items exist
  IF v_total_items = 0 THEN
    RETURN NEW;
  END IF;

  IF v_approved = v_total_items THEN
    -- Every item approved → student is fully CLEARED
    v_new_status := 'completed';
  ELSIF v_rejected > 0 OR v_approved > 0 OR v_submitted > 0 OR v_on_hold > 0 THEN
    -- At least one item has activity (not just pending)
    v_new_status := 'in_progress';
  ELSE
    -- All still pending
    v_new_status := 'pending';
  END IF;

  -- Only write if status actually changes (avoids infinite trigger loops)
  UPDATE clearance_requests
  SET    status     = v_new_status,
         updated_at = now()
  WHERE  id         = NEW.request_id
    AND  status    != v_new_status;

  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION update_clearance_request_status() IS
'Updates clearance_request status: pending → in_progress → completed.
in_progress = at least one item has been submitted, approved, rejected, or on_hold.
completed = all items approved (student is fully cleared).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Add SET search_path to remaining 4 functions (Bug 6)
-- ═══════════════════════════════════════════════════════════════════════════

-- 3a. set_first_published_at
CREATE OR REPLACE FUNCTION public.set_first_published_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_published = true AND OLD.first_published_at IS NULL THEN
    NEW.first_published_at := now();
  END IF;
  RETURN NEW;
END;
$$;

-- 3b. reset_clearance_items_on_new_published_requirement
CREATE OR REPLACE FUNCTION public.reset_clearance_items_on_new_published_requirement()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  affected_item RECORD;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.is_published = true)
     OR (TG_OP = 'UPDATE' AND OLD.first_published_at IS NULL AND NEW.first_published_at IS NOT NULL)
  THEN
    FOR affected_item IN
      SELECT id, status
      FROM clearance_items
      WHERE source_type = NEW.source_type
        AND source_id   = NEW.source_id
        AND status IN ('submitted', 'approved')
    LOOP
      UPDATE clearance_items
      SET
        status      = 'on_hold',
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
  END IF;
  RETURN NEW;
END;
$$;

-- 3c. is_actor_in_my_clearance_history (keep original param name to avoid CASCADE)
CREATE OR REPLACE FUNCTION public.is_actor_in_my_clearance_history(actor_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM clearance_item_history cih
    JOIN clearance_items ci ON ci.id = cih.clearance_item_id
    JOIN clearance_requests cr ON cr.id = ci.request_id
    WHERE cr.student_id = actor_profile_id
      AND cih.actor_id = (SELECT auth.uid())
  );
END;
$$;

-- 3d. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Delete orphan club clearance items (data cleanup for Bug 1)
--    These are club items where the student is NOT enrolled in that club.
-- ═══════════════════════════════════════════════════════════════════════════

DELETE FROM clearance_items ci
WHERE ci.source_type = 'club'
  AND NOT EXISTS (
    SELECT 1
    FROM clearance_requests cr
    JOIN profiles p ON p.id = cr.student_id
    WHERE cr.id = ci.request_id
      AND p.enrolled_clubs IS NOT NULL
      AND ci.source_id::text = ANY(string_to_array(p.enrolled_clubs, ','))
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Recalculate clearance_requests.status for all existing requests
--    (after orphan deletion, some requests may now qualify as completed)
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE clearance_requests cr
SET status = sub.new_status,
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
  AND cr.status != sub.new_status;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Remove 'approved' and 'rejected' from clearance_requests.status
--    constraint (Bug 2 - DB side). These values are never set by the trigger.
-- ═══════════════════════════════════════════════════════════════════════════

-- First ensure no rows have these values (they shouldn't, but be safe)
UPDATE clearance_requests
SET status = 'in_progress'
WHERE status IN ('approved', 'rejected');

-- Drop old constraint and add new one
ALTER TABLE clearance_requests
  DROP CONSTRAINT IF EXISTS clearance_requests_status_check;

ALTER TABLE clearance_requests
  ADD CONSTRAINT clearance_requests_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed'));
