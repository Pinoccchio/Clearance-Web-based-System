-- Migration: backfill_clearance_items_on_publish
--
-- Problem: create_clearance_items_for_request() fires only once at clearance request creation.
-- If a new requirement is published for a new/existing source AFTER the student's request
-- was created, no clearance_items row exists for that source → UI actions silently fail.
--
-- Fix in two parts:
-- Part A: One-time backfill of missing clearance_items for all active requests.
-- Part B: Extend reset_clearance_items_on_new_published_requirement() to also CREATE
--         missing clearance_items rows when a requirement is first published.

-- ═══════════════════════════════════════════════════════════════════════════
-- Part A: Backfill missing clearance_items for all active requests
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO clearance_items (request_id, source_type, source_id, status)
SELECT DISTINCT
  cr.id        AS request_id,
  r.source_type,
  r.source_id,
  'pending'    AS status
FROM clearance_requests cr
JOIN profiles p ON p.id = cr.student_id
JOIN requirements r ON r.is_published = true
  AND (
    r.source_type IN ('department', 'office')
    OR (
      r.source_type = 'club'
      AND p.enrolled_clubs IS NOT NULL
      AND r.source_id::text = ANY(string_to_array(p.enrolled_clubs, ','))
    )
  )
WHERE cr.status != 'completed'
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- Part B: Recreate reset_clearance_items_on_new_published_requirement()
--         to also INSERT missing clearance_items when a requirement is first published
-- ═══════════════════════════════════════════════════════════════════════════

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
    -- Reset existing submitted/approved items to on_hold (existing behaviour)
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

    -- Create missing clearance_items for all active requests that don't have one for this source
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
        NEW.source_type IN ('department', 'office')
        OR (
          NEW.source_type = 'club'
          AND p.enrolled_clubs IS NOT NULL
          AND NEW.source_id::text = ANY(string_to_array(p.enrolled_clubs, ','))
        )
      );
  END IF;
  RETURN NEW;
END;
$$;
