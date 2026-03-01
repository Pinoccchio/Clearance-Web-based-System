-- Migration: Allow students to create clearance items for clubs
-- The DB trigger only creates clearance items for departments and offices,
-- so students need to be able to create their own club clearance items.

-- Add RLS policy for students to insert clearance items for their own requests
CREATE POLICY "Students can insert clearance items for their own requests"
ON clearance_items
FOR INSERT
TO authenticated
WITH CHECK (
  -- Verify the request belongs to the current user
  EXISTS (
    SELECT 1 FROM clearance_requests cr
    WHERE cr.id = request_id
    AND cr.student_id = auth.uid()
  )
  -- Only allow for club source type (departments/offices are created by trigger)
  AND source_type = 'club'
);

-- Also allow students to read their own clearance items (may already exist)
CREATE POLICY "Students can view their own clearance items"
ON clearance_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clearance_requests cr
    WHERE cr.id = request_id
    AND cr.student_id = auth.uid()
  )
);
