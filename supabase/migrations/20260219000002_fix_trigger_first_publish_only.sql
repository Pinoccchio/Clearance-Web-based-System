-- Migration D: Replace clearance-reset trigger so it only fires on FIRST publish
-- (not on every unpublish → re-publish cycle).

-- ─────────────────────────────────────────────────────────────────────────────
-- Step A: BEFORE trigger — auto-set first_published_at exactly once
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_first_published_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Set first_published_at exactly once: when is_published first becomes true
  IF NEW.is_published = true AND OLD.first_published_at IS NULL THEN
    NEW.first_published_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_first_published_at ON requirements;
CREATE TRIGGER trg_set_first_published_at
  BEFORE UPDATE OF is_published ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION set_first_published_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Step B: Replace the AFTER trigger — only reset clearance items on first publish
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reset_clearance_items_on_new_published_requirement()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  affected_item RECORD;
BEGIN
  -- Only fire when this is the FIRST TIME the requirement is published:
  --   INSERT path: is_published = true at creation
  --   UPDATE path: first_published_at transitions NULL → non-null
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

DROP TRIGGER IF EXISTS trg_reset_on_published_requirement ON requirements;
CREATE TRIGGER trg_reset_on_published_requirement
  AFTER INSERT OR UPDATE OF is_published, first_published_at ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION reset_clearance_items_on_new_published_requirement();
