-- Migration: DTR Module Tables and RLS
-- Description: Creates employees and daily_time_records as per Phase P3 Spec.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. EMPLOYEES TABLE (Extends/Links to Profiles if already exists, but as requested)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position_title TEXT NOT NULL,
    department TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. DAILY TIME RECORDS TABLE
CREATE TABLE IF NOT EXISTS daily_time_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    am_in TIME,
    am_out TIME,
    pm_in TIME,
    pm_out TIME,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- UNIQUE CONSTRAINT: Prevent duplicate logs for the same day/employee
    CONSTRAINT unique_employee_daily_record UNIQUE (employee_id, record_date)
);

-- 5. INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_dtr_employee_date ON daily_time_records(employee_id, record_date);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);

-- 6. TRIGGERS
DROP TRIGGER IF EXISTS tr_employees_updated_at ON employees;
CREATE TRIGGER tr_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

DROP TRIGGER IF EXISTS tr_dtr_updated_at ON daily_time_records;
CREATE TRIGGER tr_dtr_updated_at
    BEFORE UPDATE ON daily_time_records
    FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_time_records ENABLE ROW LEVEL SECURITY;

-- POLICY 1: Admin Full Access (CRUD)
-- We use a check for 'admin_staff' or 'head_of_office' from the profiles table or metadata
DROP POLICY IF EXISTS "Admins have full access to employees" ON employees;
CREATE POLICY "Admins have full access to employees"
ON employees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin_staff', 'head_of_office')
  )
);

DROP POLICY IF EXISTS "Admins have full access to daily_time_records" ON daily_time_records;
CREATE POLICY "Admins have full access to daily_time_records"
ON daily_time_records
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin_staff', 'head_of_office')
  )
);

-- POLICY 2: Employee Read-Only Access (Own Data)
DROP POLICY IF EXISTS "Employees can view own profile" ON employees;
CREATE POLICY "Employees can view own profile"
ON employees
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Employees can view own daily_time_records" ON daily_time_records;
CREATE POLICY "Employees can view own daily_time_records"
ON daily_time_records
FOR SELECT
TO authenticated
USING (auth.uid() = employee_id);
