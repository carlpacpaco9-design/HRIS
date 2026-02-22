-- Migration: Leave Approval Logic & Ledger Table
-- Description: RPC for atomic leave deduction and Ledger table for CSC Form 1.

-- 1. APPROVE LEAVE RPC
CREATE OR REPLACE FUNCTION approve_leave_application(p_application_id UUID)
RETURNS VOID AS $$
DECLARE
    v_employee_id UUID;
    v_type VARCHAR;
    v_days DECIMAL;
    v_status VARCHAR;
BEGIN
    -- Authorization Check: Ensure the caller is an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin_staff', 'head_of_office')
    ) THEN
        RAISE EXCEPTION 'Access Denied: Only admins can approve leave.';
    END IF;

    -- Fetch application details
    SELECT employee_id, leave_type, number_of_days, status
    INTO v_employee_id, v_type, v_days, v_status
    FROM leave_applications
    WHERE id = p_application_id;

    -- Guard: Only pending applications
    IF v_status != 'Pending' THEN
        RAISE EXCEPTION 'Application is already processed.';
    END IF;

    -- Deduction logic based on type
    -- Forced leave is usually deducted from VL in PH government rules
    IF v_type = 'Vacation' OR v_type = 'Forced' THEN
        UPDATE leave_balances 
        SET vacation_balance = vacation_balance - v_days
        WHERE employee_id = v_employee_id AND vacation_balance >= v_days;
        
        IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient Vacation Leave balance.'; END IF;
        
    ELSIF v_type = 'Sick' THEN
        UPDATE leave_balances 
        SET sick_balance = sick_balance - v_days
        WHERE employee_id = v_employee_id AND sick_balance >= v_days;
        
        IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient Sick Leave balance.'; END IF;
        
    ELSIF v_type = 'SPL' THEN
        UPDATE leave_balances 
        SET spl_balance = spl_balance - v_days
        WHERE employee_id = v_employee_id AND spl_balance >= v_days;
        
        IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient SPL balance.'; END IF;
    END IF;

    -- Update application status
    UPDATE leave_applications 
    SET status = 'Approved', updated_at = NOW() 
    WHERE id = p_application_id;

    -- Log to Ledger (Optional automated entry, but we'll create the table first)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. LEAVE LEDGER TABLE (CSC Form 1)
CREATE TABLE IF NOT EXISTS leave_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    particulars TEXT NOT NULL,
    
    -- Vacation Leave Columns
    vl_earned DECIMAL(10, 3) DEFAULT 0,
    vl_w_pay DECIMAL(10, 3) DEFAULT 0,
    vl_balance DECIMAL(10, 3) NOT NULL,
    vl_wo_pay DECIMAL(10, 3) DEFAULT 0,
    
    -- Sick Leave Columns
    sl_earned DECIMAL(10, 3) DEFAULT 0,
    sl_w_pay DECIMAL(10, 3) DEFAULT 0,
    sl_balance DECIMAL(10, 3) NOT NULL,
    sl_wo_pay DECIMAL(10, 3) DEFAULT 0,
    
    date_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS FOR LEDGER
ALTER TABLE leave_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger"
ON leave_ledger FOR SELECT TO authenticated
USING (auth.uid() = employee_id);

CREATE POLICY "Admins have full access to ledger"
ON leave_ledger FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin_staff', 'head_of_office')
  )
);
