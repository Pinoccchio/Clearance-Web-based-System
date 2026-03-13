-- Migration: fix_rls_auth_uid_performance
-- Fixes direct auth.uid() / auth.role() calls (evaluated per-row) with (SELECT auth.uid())
-- Also adds missing indexes on hot-path columns
-- Root cause of statement timeout errors ("Failed to save" / "Load failed")

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_req_submissions_item_student
  ON public.requirement_submissions(clearance_item_id, student_id);

-- ============================================================
-- clearance_items: staff_view_all_student_clearance_items
-- uses auth.uid() not wrapped in SELECT
-- ============================================================
DROP POLICY IF EXISTS "staff_view_all_student_clearance_items" ON public.clearance_items;
CREATE POLICY "staff_view_all_student_clearance_items" ON public.clearance_items
  FOR SELECT TO authenticated
  USING (
    (SELECT profiles.role FROM public.profiles WHERE profiles.id = (SELECT auth.uid()))
    = ANY (ARRAY['department'::text, 'office'::text, 'club'::text])
  );

-- ============================================================
-- attendance_records: fix direct auth.uid() in two SELECT policies
-- ============================================================
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance_records;
CREATE POLICY "Students can view own attendance" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Office staff can view their event attendance" ON public.attendance_records;
CREATE POLICY "Office staff can view their event attendance" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT e.id
      FROM public.events e
      JOIN public.offices o ON o.id = e.office_id
      WHERE o.head_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- events: fix direct auth.uid() in SELECT and UPDATE policies
-- ============================================================
DROP POLICY IF EXISTS "Office staff and admin can view relevant events" ON public.events;
CREATE POLICY "Office staff and admin can view relevant events" ON public.events
  FOR SELECT TO authenticated
  USING (
    (get_auth_user_role() = 'admin'::text)
    OR (office_id IN (
      SELECT offices.id FROM public.offices
      WHERE offices.head_id = (SELECT auth.uid())
    ))
  );

DROP POLICY IF EXISTS "Office head can update their events" ON public.events;
CREATE POLICY "Office head can update their events" ON public.events
  FOR UPDATE TO authenticated
  USING (
    office_id IN (
      SELECT offices.id FROM public.offices
      WHERE offices.head_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- requirement_links: fix auth.role() evaluated per-row
-- ============================================================
DROP POLICY IF EXISTS "Authenticated manage requirement_links" ON public.requirement_links;
CREATE POLICY "Authenticated manage requirement_links" ON public.requirement_links
  FOR ALL TO public
  USING ((SELECT auth.role()) = 'authenticated'::text);
