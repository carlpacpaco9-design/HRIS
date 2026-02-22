# Implementation Plan: Leave Approval Workflow & Ledger

## 1. Database Layer (RPC & Ledger)

### `approve_leave_application` RPC
```sql
CREATE OR REPLACE FUNCTION approve_leave_application(p_application_id UUID)
RETURNS VOID AS $$
DECLARE
    v_employee_id UUID;
    v_type VARCHAR;
    v_days DECIMAL;
    v_status VARCHAR;
BEGIN
    -- 1. Fetch application details
    SELECT employee_id, leave_type, number_of_days, status
    INTO v_employee_id, v_type, v_days, v_status
    FROM leave_applications
    WHERE id = p_application_id;

    -- 2. Guard: Only pending applications
    IF v_status != 'Pending' THEN
        RAISE EXCEPTION 'Application is already processed.';
    END IF;

    -- 3. Deduction logic based on type
    IF v_type = 'Vacation' OR v_type = 'Forced' THEN
        UPDATE leave_balances 
        SET vacation_balance = vacation_balance - v_days
        WHERE employee_id = v_employee_id AND vacation_balance >= v_days;
    ELSIF v_type = 'Sick' THEN
        UPDATE leave_balances 
        SET sick_balance = sick_balance - v_days
        WHERE employee_id = v_employee_id AND sick_balance >= v_days;
    ELSIF v_type = 'SPL' THEN
        UPDATE leave_balances 
        SET spl_balance = spl_balance - v_days
        WHERE employee_id = v_employee_id AND spl_balance >= v_days;
    END IF;

    -- Check if update happened (FOUND is true if rows were affected)
    IF NOT FOUND AND v_type IN ('Vacation', 'Sick', 'SPL', 'Forced') THEN
        RAISE EXCEPTION 'Insufficient leave balance.';
    END IF;

    -- 4. Finalize application
    UPDATE leave_applications SET status = 'Approved' WHERE id = p_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `leave_ledger` Table (CSC Form 1)
- `id`: UUID (PK)
- `employee_id`: UUID (FK)
- `period`: VARCHAR (e.g., "Jan 2026")
- `particulars`: TEXT
- `vl_earned`, `vl_abs_und_w_pay`, `vl_balance`: DECIMAL
- `sl_earned`, `sl_abs_und_w_pay`, `sl_balance`: DECIMAL

## 2. React Components

### `LeaveApprovalDashboard.tsx`
- Fetches applications where `status = 'Pending'`.
- Interactive table with "Approve" (calls RPC) and "Disapprove" (regular update).
- Optimistic UI updates to remove items from list on action.

### `LeaveLedgerView.tsx`
- Responsive CSC Form 1 replica.
- Data-heavy table with narrow columns.
- Grouped by months/years.

## 3. Verification Checklist
- [ ] RPC correctly deducts from `leave_balances`.
- [ ] RPC throws "Insufficient balance" if deduction exceeds available credits.
- [ ] Dashboard shows employee names from `profiles` join.
- [ ] Ledger view renders in a clean, professional grid.
- [ ] TypeScript types cover the RPC response and ledger data.
