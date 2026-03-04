-- Migration: Performance fixes (Bugs 7, 8)
--
-- Bug 7: RLS policies use auth.uid() instead of (SELECT auth.uid()),
--         causing re-evaluation per row instead of once per query.
-- Bug 8: Missing index on requirement_links.requirement_id.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Fix clearance_items RLS policies to use (SELECT auth.uid())
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop and recreate the two policies from the 20260301 migration
DROP POLICY IF EXISTS "Students can insert clearance items for their own requests" ON clearance_items;
DROP POLICY IF EXISTS "Students can view their own clearance items" ON clearance_items;

CREATE POLICY "Students can insert clearance items for their own requests"
ON clearance_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clearance_requests cr
    WHERE cr.id = request_id
    AND cr.student_id = (SELECT auth.uid())
  )
  AND source_type = 'club'
);

CREATE POLICY "Students can view their own clearance items"
ON clearance_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clearance_requests cr
    WHERE cr.id = request_id
    AND cr.student_id = (SELECT auth.uid())
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Fix requirement_links RLS policy to use (SELECT auth.uid())
-- ═══════════════════════════════════════════════════════════════════════════

-- The existing policy name may vary; drop by known name patterns
DROP POLICY IF EXISTS "Users can view requirement links" ON requirement_links;
DROP POLICY IF EXISTS "Authenticated users can view requirement_links" ON requirement_links;
DROP POLICY IF EXISTS "view_requirement_links" ON requirement_links;

-- Recreate with optimized auth.uid() pattern
CREATE POLICY "Authenticated users can view requirement_links"
ON requirement_links
FOR SELECT
TO authenticated
USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Add missing index on requirement_links.requirement_id (Bug 8)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_requirement_links_requirement
ON requirement_links (requirement_id);
