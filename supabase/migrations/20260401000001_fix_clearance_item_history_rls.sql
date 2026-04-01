-- Migration: Fix clearance_item_history RLS policies
--
-- Problem: The clearance_item_history table has RLS enabled but no INSERT policy
-- for authenticated users. This causes client-side inserts from updateClearanceItem
-- and submitClearanceItem to fail silently, resulting in no status history being
-- recorded for CSG and CSPSG items.
--
-- Fix: Add INSERT and SELECT policies for authenticated users.

-- Enable RLS if not already enabled (idempotent)
ALTER TABLE public.clearance_item_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can insert history" ON public.clearance_item_history;
DROP POLICY IF EXISTS "Authenticated users can view history" ON public.clearance_item_history;

-- Allow authenticated users to INSERT history entries
-- This is needed for client-side history logging from updateClearanceItem and submitClearanceItem
CREATE POLICY "Authenticated users can insert history"
  ON public.clearance_item_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to SELECT history entries
-- This is needed for viewing status history in the clearance queue modals
CREATE POLICY "Authenticated users can view history"
  ON public.clearance_item_history
  FOR SELECT
  TO authenticated
  USING (true);
