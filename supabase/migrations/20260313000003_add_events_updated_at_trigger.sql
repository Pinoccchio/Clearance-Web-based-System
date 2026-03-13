-- Fix: events table was missing the updated_at auto-update trigger
-- that every other table already has.
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
