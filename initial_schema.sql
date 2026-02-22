-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Create PROFILES table
-- -----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'head_of_office', 'division_chief', 'employee');

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'employee',
    department TEXT,
    position_title TEXT,
    supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Self-reference
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 2. Create SPMS_CYCLES table
-- -----------------------------------------------------------------------------
CREATE TABLE spms_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 3. Create SPMS_COMMITMENTS table
-- -----------------------------------------------------------------------------
CREATE TYPE commitment_status AS ENUM ('draft', 'pending_approval', 'approved', 'rated');

CREATE TABLE spms_commitments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Snapshot of supervisor
    cycle_id UUID REFERENCES spms_cycles(id) ON DELETE CASCADE NOT NULL,
    status commitment_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 4. Create SPMS_TARGETS table
-- -----------------------------------------------------------------------------
CREATE TYPE mfo_category AS ENUM ('strategic', 'core', 'support');

CREATE TABLE spms_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commitment_id UUID REFERENCES spms_commitments(id) ON DELETE CASCADE NOT NULL,
    mfo_category mfo_category NOT NULL,
    output TEXT NOT NULL,
    indicators TEXT NOT NULL,
    rating_q INT CHECK (rating_q BETWEEN 1 AND 5),
    rating_e INT CHECK (rating_e BETWEEN 1 AND 5),
    rating_t INT CHECK (rating_t BETWEEN 1 AND 5),
    average_score NUMERIC(3, 2) GENERATED ALWAYS AS (
        ROUND((COALESCE(rating_q, 0) + COALESCE(rating_e, 0) + COALESCE(rating_t, 0)) / 
        NULLIF(
            (CASE WHEN rating_q IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN rating_e IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN rating_t IS NOT NULL THEN 1 ELSE 0 END), 0
        )::numeric, 2)
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spms_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spms_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE spms_targets ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (prevents recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- POLICIES
-- -----------------------------------------------------------------------------

-- PROFILES
-- 1. Admins have full access
CREATE POLICY "Admins can do everything on profiles" ON profiles
    FOR ALL USING (is_admin());

-- 2. Users can view/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 3. Supervisors can view profiles of their subordinates
CREATE POLICY "Supervisors can view subordinates" ON profiles
    FOR SELECT USING (supervisor_id = auth.uid());
    -- Note: Supervisors viewing *all* profiles might be necessary for selection,
    -- but per strict instructions: "Supervisors... can view/edit data of employees where supervisor_id matches their ID".
    -- I will stick to the strict rule unless they need to search for new employees to add.

-- SPMS CYCLES
-- Everyone can view active cycles, Admins manage them
CREATE POLICY "Everyone can view cycles" ON spms_cycles
    FOR SELECT TO authenticated USING (true); -- Usually public info for authenticated users

CREATE POLICY "Admins manage cycles" ON spms_cycles
    FOR ALL USING (is_admin());

-- SPMS COMMITMENTS
-- 1. Admins full access
CREATE POLICY "Admins manage commitments" ON spms_commitments
    FOR ALL USING (is_admin());

-- 2. Users logic: View/Edit own
CREATE POLICY "Users manage own commitments" ON spms_commitments
    FOR ALL USING (user_id = auth.uid());

-- 3. Supervisors logic: View/Edit where they are the supervisor
CREATE POLICY "Supervisors manage subordinate commitments" ON spms_commitments
    FOR ALL USING (supervisor_id = auth.uid());

-- SPMS TARGETS
-- Targets inherit access from Commitments essentially, but RLS must be explicit.
-- We can use a join or EXISTS to check the parent commitment access.

-- 1. Admins
CREATE POLICY "Admins manage targets" ON spms_targets
    FOR ALL USING (is_admin());

-- 2. Users (via commitment)
CREATE POLICY "Users manage own targets" ON spms_targets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM spms_commitments
            WHERE spms_commitments.id = spms_targets.commitment_id
            AND spms_commitments.user_id = auth.uid()
        )
    );

-- 3. Supervisors (via commitment)
CREATE POLICY "Supervisors manage subordinate targets" ON spms_targets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM spms_commitments
            WHERE spms_commitments.id = spms_targets.commitment_id
            AND spms_commitments.supervisor_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- TRIGGERS (Optional but recommended for user creation)
-- -----------------------------------------------------------------------------
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'employee');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger only if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
