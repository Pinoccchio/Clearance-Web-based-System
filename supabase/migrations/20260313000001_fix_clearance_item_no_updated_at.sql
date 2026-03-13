-- Fix: fulfill_clearance_on_attendance tried to SET updated_at on clearance_items,
-- but that column does not exist. Remove it to prevent transaction rollback on every scan.
CREATE OR REPLACE FUNCTION fulfill_clearance_on_attendance()
RETURNS TRIGGER AS $$
DECLARE
  v_office_id       uuid;
  v_clearance_item_id uuid;
BEGIN
  -- Get the office linked to the event
  SELECT office_id INTO v_office_id
  FROM events
  WHERE id = NEW.event_id;

  IF v_office_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the student's pending/submitted clearance_item for that office
  SELECT id INTO v_clearance_item_id
  FROM clearance_items
  WHERE student_id = NEW.student_id
    AND office_id  = v_office_id
    AND status IN ('pending', 'submitted')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_clearance_item_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Update status to submitted (no updated_at column on clearance_items)
  UPDATE clearance_items
  SET status      = 'submitted',
      reviewed_by = NEW.scanned_by
  WHERE id = v_clearance_item_id;

  -- Insert audit history row
  INSERT INTO clearance_item_history
    (clearance_item_id, from_status, to_status, actor_id, actor_role)
  VALUES
    (v_clearance_item_id, 'pending', 'submitted', NEW.scanned_by, 'office');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
