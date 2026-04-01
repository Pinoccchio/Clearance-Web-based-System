-- Migration: Rename cspsg_division to csp_division
--
-- This migration updates the role and source_type values from 'cspsg_division' to 'csp_division'
-- for consistency with the UI label change from "CSPSG Division" to "CSP Division".
--
-- Tables affected:
-- 1. profiles.role - user role values
-- 2. clearance_items.source_type - clearance item source types
-- 3. requirements.source_type - requirement source types
-- 4. clearance_item_history - if it stores source_type
-- 5. requirement_submissions - if it stores source_type

-- Update profiles.role
UPDATE profiles
SET role = 'csp_division'
WHERE role = 'cspsg_division';

-- Update clearance_items.source_type
UPDATE clearance_items
SET source_type = 'csp_division'
WHERE source_type = 'cspsg_division';

-- Update requirements.source_type
UPDATE requirements
SET source_type = 'csp_division'
WHERE source_type = 'cspsg_division';

-- Note: The table name 'cspsg_divisions' and column names like 'cspsg_division_id'
-- are NOT changed as they are internal identifiers and changing them would require
-- more extensive schema modifications.
