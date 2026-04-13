-- =============================================================================
-- Fix: Recreate handle_new_user trigger (broken by schema changes)
-- =============================================================================
--
-- Root cause: The handle_new_user trigger function that auto-creates a row in
-- public.profiles when a new auth.users record is created was broken by
-- previous schema migrations (column renames, constraint changes, rebranding).
--
-- Fix strategy:
--   1. Recreate handle_new_user with a MINIMAL, safe insert that only writes
--      columns that are guaranteed to exist and have no risky constraints.
--      ON CONFLICT (id) DO NOTHING prevents any duplicate-key errors.
--   2. The Next.js API route (route.ts) will separately upsert the full profile
--      with all optional fields AFTER the auth user is successfully created.
--      This decouples trigger fragility from user creation success.
--
-- APPLY THIS IN: Supabase Dashboard → SQL Editor → New Query
-- URL: https://supabase.com/dashboard/project/joyrstittieqqfvvuuwb/sql/new
-- =============================================================================

-- Step 1: Recreate the trigger function with safe, minimal logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' IN (
        'student', 'office', 'department', 'club',
        'csg_department_lgu', 'cspsg_division',
        'csg', 'cspsg', 'admin'
      )
      THEN NEW.raw_user_meta_data->>'role'
      ELSE 'student'
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Step 2: Drop and recreate the trigger to ensure it is correctly bound
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Verify (run a quick check to confirm the trigger now exists)
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
