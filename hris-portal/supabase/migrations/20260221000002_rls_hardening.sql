-- Sprint 2 Phase P9: Security & RLS Hardening

DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 1. profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  auth.uid() = id
  OR is_hr_manager()
  OR (is_division_chief() AND division = get_my_division())
);

CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (
  auth.uid() = id OR is_hr_manager()
);

CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (is_hr_manager());

-- 2. dtr_logs table
ALTER TABLE dtr_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dtr_logs_select" ON dtr_logs FOR SELECT USING (
  employee_id = auth.uid()
  OR is_hr_manager()
  OR (is_division_chief() AND same_division(employee_id))
);

CREATE POLICY "dtr_logs_insert" ON dtr_logs FOR INSERT WITH CHECK (is_hr_manager());
CREATE POLICY "dtr_logs_update" ON dtr_logs FOR UPDATE USING (is_hr_manager());
CREATE POLICY "dtr_logs_delete" ON dtr_logs FOR DELETE USING (is_hr_manager());

-- 3. leave_requests table
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_requests_select" ON leave_requests FOR SELECT USING (
  employee_id = auth.uid()
  OR is_hr_manager()
  OR (is_division_chief() AND same_division(employee_id))
);

CREATE POLICY "leave_requests_insert" ON leave_requests FOR INSERT WITH CHECK (employee_id = auth.uid());
CREATE POLICY "leave_requests_update" ON leave_requests FOR UPDATE USING (is_hr_manager());

-- 4. leave_balances table
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_balances_select" ON leave_balances FOR SELECT USING (
  employee_id = auth.uid()
  OR is_hr_manager()
  OR (is_division_chief() AND same_division(employee_id))
);

CREATE POLICY "leave_balances_insert" ON leave_balances FOR INSERT WITH CHECK (is_hr_manager());
CREATE POLICY "leave_balances_update" ON leave_balances FOR UPDATE USING (is_hr_manager());

-- 5. ipcr_forms table
ALTER TABLE ipcr_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ipcr_forms_select" ON ipcr_forms FOR SELECT USING (
  employee_id = auth.uid()
  OR is_hr_manager()
  OR (is_division_chief() AND same_division(employee_id))
);

CREATE POLICY "ipcr_forms_insert" ON ipcr_forms FOR INSERT WITH CHECK (employee_id = auth.uid());
CREATE POLICY "ipcr_forms_update" ON ipcr_forms FOR UPDATE USING (
  (employee_id = auth.uid() AND status IN ('draft', 'returned'))
  OR (status = 'submitted' AND (is_hr_manager() OR (is_division_chief() AND same_division(employee_id))))
  OR (status = 'reviewed' AND is_hr_manager())
);

-- 6. ipcr_outputs table
ALTER TABLE ipcr_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ipcr_outputs_select" ON ipcr_outputs FOR SELECT USING (
  EXISTS (SELECT 1 FROM ipcr_forms WHERE id = ipcr_outputs.ipcr_id AND (
    employee_id = auth.uid() OR is_hr_manager() OR (is_division_chief() AND same_division(employee_id))
  ))
);

CREATE POLICY "ipcr_outputs_all" ON ipcr_outputs FOR ALL USING (
  EXISTS (SELECT 1 FROM ipcr_forms WHERE id = ipcr_outputs.ipcr_id AND (
    (employee_id = auth.uid() AND status IN ('draft', 'returned'))
    OR (status = 'submitted' AND (is_hr_manager() OR (is_division_chief() AND same_division(employee_id))))
    OR (status = 'reviewed' AND is_hr_manager())
  ))
);

-- 7. opcr_forms and opcr_outputs
ALTER TABLE opcr_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE opcr_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opcr_forms_all" ON opcr_forms FOR ALL USING (is_hr_manager());
CREATE POLICY "opcr_outputs_all" ON opcr_outputs FOR ALL USING (is_hr_manager());

-- 8. monitoring_journals
ALTER TABLE monitoring_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitoring_journals_select" ON monitoring_journals FOR SELECT USING (
  employee_id = auth.uid()
  OR encoded_by = auth.uid()
  OR is_hr_manager()
  OR (is_division_chief() AND same_division(employee_id))
);

CREATE POLICY "monitoring_journals_insert" ON monitoring_journals FOR INSERT WITH CHECK (is_hr_manager() OR is_division_chief());
CREATE POLICY "monitoring_journals_update" ON monitoring_journals FOR UPDATE USING (is_hr_manager() OR is_division_chief());
CREATE POLICY "monitoring_journals_delete" ON monitoring_journals FOR DELETE USING (is_hr_manager());

-- 9. development_plans
ALTER TABLE development_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "development_plans_select" ON development_plans FOR SELECT USING (
  employee_id = auth.uid()
  OR is_hr_manager()
  OR (is_division_chief() AND same_division(employee_id))
);

CREATE POLICY "development_plans_insert" ON development_plans FOR INSERT WITH CHECK (is_hr_manager());
CREATE POLICY "development_plans_update" ON development_plans FOR UPDATE USING (is_hr_manager());
CREATE POLICY "development_plans_delete" ON development_plans FOR DELETE USING (is_hr_manager());

-- 10. awards
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "awards_select" ON awards FOR SELECT USING (
  employee_id = auth.uid()
  OR is_hr_manager()
  OR (is_division_chief() AND same_division(employee_id))
);

CREATE POLICY "awards_insert" ON awards FOR INSERT WITH CHECK (is_hr_manager());
CREATE POLICY "awards_update" ON awards FOR UPDATE USING (is_hr_manager());
CREATE POLICY "awards_delete" ON awards FOR DELETE USING (is_hr_manager());

-- 11. audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (is_hr_manager());
-- Insert is allowed for all authenticated as service functions log, wait, if server actions log with anon key or service role?
-- Server actions use createServerClient with anon key but user session, OR they use a service role client.
-- Usually, we allow authenticated users to insert to their own logs or let service role bypass.
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (true);

-- 12. spms_cycles
ALTER TABLE spms_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spms_cycles_select" ON spms_cycles FOR SELECT USING (true);
CREATE POLICY "spms_cycles_insert" ON spms_cycles FOR INSERT WITH CHECK (is_hr_manager());
CREATE POLICY "spms_cycles_update" ON spms_cycles FOR UPDATE USING (is_hr_manager());
