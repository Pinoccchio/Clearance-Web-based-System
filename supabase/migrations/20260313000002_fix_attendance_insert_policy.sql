-- Fix: tighten attendance_records INSERT policy to office/admin roles only.
-- Previous policy allowed any authenticated user to insert.
DROP POLICY IF EXISTS "Office staff can insert attendance" ON attendance_records;

CREATE POLICY "Office staff can insert attendance"
  ON attendance_records FOR INSERT
  WITH CHECK (
    get_auth_user_role() IN ('office', 'admin')
  );
