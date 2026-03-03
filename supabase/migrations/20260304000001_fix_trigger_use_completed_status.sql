-- Fix the trigger to use 'completed' status when all items are approved
-- 'approved' = individual item approved by a source
-- 'completed' = student is fully CLEARED (all sources approved)

CREATE OR REPLACE FUNCTION update_clearance_request_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_items   INT;
  v_approved      INT;
  v_rejected      INT;
  v_new_status    TEXT;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO v_total_items, v_approved, v_rejected
  FROM clearance_items
  WHERE request_id = NEW.request_id;

  -- Nothing to evaluate if no items exist
  IF v_total_items = 0 THEN
    RETURN NEW;
  END IF;

  IF v_approved = v_total_items THEN
    -- Every item approved → student is fully CLEARED
    v_new_status := 'completed';
  ELSIF v_rejected > 0 OR v_approved > 0 THEN
    -- At least one resolved item (approved or rejected) but not all approved
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION update_clearance_request_status() IS
'Updates clearance_request status: pending → in_progress → completed (cleared).
completed means student is fully CLEARED (all sources have approved their items).';
