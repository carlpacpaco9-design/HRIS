-- Migration: Leave Management Module
-- Description: Creating tables for leave balances and applications with RLS.

-- 1. LEAVE BALANCES
CREATE TABLE IF NOT EXISTS leave_balances (
    employee_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    vacation_balance DECIMAL(10, 3) DEFAULT 0,
    sick_balance DECIMAL(10, 3) DEFAULT 0,
    spl_balance INT DEFAULT 3,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LEAVE APPLICATIONS
CREATE TABLE IF NOT EXISTS leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date_filed DATE DEFAULT CURRENT_DATE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('Vacation', 'Sick', 'Maternity', 'Paternity', 'SPL', 'Forced', 'Others')),
    details_of_leave TEXT NOT NULL,
    number_of_days DECIMAL(5, 2) NOT NULL,
    inclusive_dates TEXT NOT NULL,
    commutation VARCHAR(20) DEFAULT 'Not Requested' CHECK (commutation IN ('Requested', 'Not Requested')),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Disapproved')),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR leave_balances

-- Users can view their own balance
DROP POLICY IF EXISTS "Users can view own leave balance" ON leave_balances;
CREATE POLICY "Users can view own leave balance"
ON leave_balances FOR SELECT TO authenticated
USING (auth.uid() = employee_id);

-- Admins full access
DROP POLICY IF EXISTS "Admins have full access to leave balances" ON leave_balances;
CREATE POLICY "Admins have full access to leave balances"
ON leave_balances FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin_staff', 'head_of_office')
  )
);

-- 5. RLS POLICIES FOR leave_applications

-- Users can view and insert own applications
DROP POLICY IF EXISTS "Users can view own leave applications" ON leave_applications;
CREATE POLICY "Users can view own leave applications"
ON leave_applications FOR SELECT TO authenticated
USING (auth.uid() = employee_id);

DROP POLICY IF EXISTS "Users can insert own leave applications" ON leave_applications;
CREATE POLICY "Users can insert own leave applications"
ON leave_applications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = employee_id);

-- Admins full access
DROP POLICY IF EXISTS "Admins have full access to leave applications" ON leave_applications;
CREATE POLICY "Admins have full access to leave applications"
ON leave_applications FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin_staff', 'head_of_office')
  )
);

-- 6. TRIGGERS FOR UPDATED_AT (Assuming handle_updated_at exists from previous migration)
DROP TRIGGER IF EXISTS tr_leave_balances_updated_at ON leave_balances;
CREATE TRIGGER tr_leave_balances_updated_at
    BEFORE UPDATE ON leave_balances
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

DROP TRIGGER IF EXISTS tr_leave_applications_updated_at ON leave_applications;
CREATE TRIGGER tr_leave_applications_updated_at
    BEFORE UPDATE ON leave_applications
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
