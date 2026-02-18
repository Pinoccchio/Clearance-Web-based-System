-- Migration C: Add first_published_at column to requirements
-- Tracks the timestamp of the very first publish so re-publish does not
-- re-trigger the clearance reset. NULL means never published.

ALTER TABLE requirements
  ADD COLUMN first_published_at timestamptz NULL;

-- Back-fill: rows that are already published get a placeholder first_published_at
-- (they were published before this column existed, so we use now() as a stand-in)
UPDATE requirements
  SET first_published_at = now()
  WHERE is_published = true;
