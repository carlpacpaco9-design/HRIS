-- 1. Fix RLS Policies for Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 2. Standardize Role Names with Explicit Casting
-- The previous error was because 'role' might be an ENUM type (user_role), and ILIKE operator isn't defined for enums directly.
-- Solution: Cast role to TEXT before comparing.

UPDATE profiles 
SET role = 'division_chief'::user_role
WHERE role::text ILIKE 'Division Chief' OR role::text ILIKE 'Chief';

UPDATE profiles 
SET role = 'head_of_office'::user_role
WHERE role::text ILIKE 'Head of Office' OR role::text ILIKE 'Head';

UPDATE profiles 
SET role = 'admin'::user_role
WHERE role::text ILIKE 'Admin' OR role::text ILIKE 'Administrator';
