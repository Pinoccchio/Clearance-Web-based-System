-- Migration: Replace file_url (text) with file_urls (text[]) on requirement_submissions
-- Run this in the Supabase SQL editor or via supabase db push

-- Step 1: Drop the old single-URL column
ALTER TABLE requirement_submissions
  DROP COLUMN file_url;

-- Step 2: Add the new array column with an empty-array default
ALTER TABLE requirement_submissions
  ADD COLUMN file_urls text[] NOT NULL DEFAULT '{}';

-- Note: The UNIQUE constraint on (clearance_item_id, requirement_id) is kept unchanged.
-- One row per requirement per clearance item; that row now holds an array of signed URLs.
