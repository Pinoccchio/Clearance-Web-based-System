-- Migration: Fix overly permissive RLS policies on clubs table (Bug 5)
--
-- Problem: Any authenticated user can INSERT/UPDATE/DELETE clubs.
-- Fix: Restrict to admin-only for INSERT/DELETE, admin-or-adviser for UPDATE.

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON clubs;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON clubs;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON clubs;

-- Create proper admin-only INSERT policy
CREATE POLICY "Admins can insert clubs" ON clubs
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) = 'admin'
);

-- Admin or the club's adviser can update
CREATE POLICY "Admin or adviser can update clubs" ON clubs
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) = 'admin'
  OR adviser_id = (SELECT auth.uid())
);

-- Only admins can delete clubs
CREATE POLICY "Admins can delete clubs" ON clubs
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) = 'admin'
);
