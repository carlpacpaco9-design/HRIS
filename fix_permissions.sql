-- 1. Fix RLS Policies for Profiles
-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if it exists (to start fresh or avoid conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create a policy that allows ANY authenticated user to VIEW all profiles
-- This is necessary for the "Supervisor Picker" to work, so employees can see names of Chiefs.
CREATE POLICY "Authenticated users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 2. Verify and Fix Roles
-- Sometimes users might manually enter "Division Chief" instead of "division_chief".
-- This standardizes them to the enum-like strings used in the code.

UPDATE profiles 
SET role = 'division_chief' 
WHERE role ILIKE 'Division Chief' OR role ILIKE 'Chief';

UPDATE profiles 
SET role = 'head_of_office' 
WHERE role ILIKE 'Head of Office' OR role ILIKE 'Head';

UPDATE profiles 
SET role = 'admin' 
WHERE role ILIKE 'Admin' OR role ILIKE 'Administrator';

-- 3. Ensure the current user (if any) allows updating their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Check if we have any supervisors (for debugging purposes in SQL Editor)
-- Run this part manually if you want to see who is available
SELECT id, full_name, role, email FROM profiles WHERE role IN ('division_chief', 'head_of_office', 'admin');
