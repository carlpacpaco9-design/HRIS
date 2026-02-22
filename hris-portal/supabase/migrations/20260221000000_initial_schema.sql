-- ═══════════════════════════════════
-- PAO HRMS — Initial Schema
-- Sprint 2 · Clean Foundation
-- Provincial Assessor's Office
-- ═══════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS
  "uuid-ossp";

-- ─── CLEANUP EXISTING DB ────────────
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS awards CASCADE;
DROP TABLE IF EXISTS development_plans CASCADE;
DROP TABLE IF EXISTS monitoring_journals CASCADE;
DROP TABLE IF EXISTS opcr_forms CASCADE;
DROP TABLE IF EXISTS ipcr_outputs CASCADE;
DROP TABLE IF EXISTS ipcr_forms CASCADE;
DROP TABLE IF EXISTS spms_cycles CASCADE;
DROP TABLE IF EXISTS leave_balances CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS dtr_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS deduct_leave_balance CASCADE;
DROP FUNCTION IF EXISTS get_my_role CASCADE;
DROP FUNCTION IF EXISTS is_hr_manager CASCADE;
DROP FUNCTION IF EXISTS is_division_chief CASCADE;
DROP FUNCTION IF EXISTS get_my_division CASCADE;
DROP FUNCTION IF EXISTS same_division CASCADE;

-- ─── PROFILES ───────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  employee_number TEXT UNIQUE,
  position TEXT NOT NULL,
  division TEXT NOT NULL,
  role TEXT NOT NULL
    CHECK (role IN (
      'head_of_office',
      'admin_staff',
      'division_chief',
      'project_staff'
    )),
  employment_status TEXT
    CHECK (employment_status IN (
      'Permanent',
      'Casual',
      'Contract of Service',
      'Job Order'
    )),
  date_hired DATE,
  salary_grade TEXT,
  contact_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── DTR LOGS ───────────────────────
CREATE TABLE dtr_logs (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,
  log_date DATE NOT NULL,
  am_arrival TIME,
  am_departure TIME,
  pm_arrival TIME,
  pm_departure TIME,
  undertime_hours INT DEFAULT 0,
  undertime_minutes INT DEFAULT 0,
  remarks TEXT,
  encoded_by UUID
    REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, log_date)
);

-- ─── LEAVE REQUESTS ─────────────────
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,
  leave_type TEXT NOT NULL
    CHECK (leave_type IN (
      'Vacation Leave',
      'Sick Leave',
      'Special Privilege Leave',
      'Maternity/Paternity Leave',
      'Emergency Leave',
      'Leave Without Pay'
    )),
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  working_days NUMERIC(5,2),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT
    'pending_approval'
    CHECK (status IN (
      'pending_approval',
      'approved',
      'rejected',
      'cancelled'
    )),
  approved_by UUID
    REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  approval_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── LEAVE BALANCES ─────────────────
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,
  year INT NOT NULL,
  vacation_leave_total
    NUMERIC(5,2) DEFAULT 15,
  vacation_leave_used
    NUMERIC(5,2) DEFAULT 0,
  sick_leave_total
    NUMERIC(5,2) DEFAULT 15,
  sick_leave_used
    NUMERIC(5,2) DEFAULT 0,
  special_leave_total
    NUMERIC(5,2) DEFAULT 5,
  special_leave_used
    NUMERIC(5,2) DEFAULT 0,
  emergency_leave_total
    NUMERIC(5,2) DEFAULT 3,
  emergency_leave_used
    NUMERIC(5,2) DEFAULT 0,
  UNIQUE(employee_id, year)
);

-- ─── SPMS CYCLES ────────────────────
CREATE TABLE spms_cycles (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed: first active SPMS cycle
INSERT INTO spms_cycles (
  name, period_start, period_end,
  is_active
) VALUES (
  'January to June 2026',
  '2026-01-01',
  '2026-06-30',
  true
);

-- ─── IPCR FORMS ─────────────────────
CREATE TABLE ipcr_forms (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,
  spms_cycle_id UUID NOT NULL
    REFERENCES spms_cycles(id),
  immediate_supervisor_id UUID
    REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'submitted',
      'reviewed',
      'finalized',
      'returned'
    )),
  final_average_rating NUMERIC(3,2),
  adjectival_rating TEXT
    CHECK (adjectival_rating IN (
      'Outstanding',
      'Very Satisfactory',
      'Satisfactory',
      'Unsatisfactory',
      'Poor'
    )),
  review_comments TEXT,
  final_remarks TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, spms_cycle_id)
);

-- ─── IPCR OUTPUTS ───────────────────
CREATE TABLE ipcr_outputs (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),
  ipcr_form_id UUID NOT NULL
    REFERENCES ipcr_forms(id)
    ON DELETE CASCADE,
  category TEXT NOT NULL
    CHECK (category IN (
      'Strategic Priority',
      'Core Function',
      'Support Function'
    )),
  output_order INT DEFAULT 0,
  major_final_output TEXT NOT NULL,
  success_indicator_target TEXT,
  success_indicator_measure TEXT,
  actual_accomplishments TEXT,
  rating_quantity NUMERIC(3,2),
  rating_efficiency NUMERIC(3,2),
  rating_timeliness NUMERIC(3,2),
  rating_average NUMERIC(3,2),
  remarks TEXT
);

-- ─── OPCR FORMS ─────────────────────
CREATE TABLE opcr_forms (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),
  spms_cycle_id UUID NOT NULL
    REFERENCES spms_cycles(id),
  prepared_by UUID NOT NULL
    REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'submitted',
      'approved'
    )),
  final_average_rating NUMERIC(3,2),
  adjectival_rating TEXT,
  approved_by UUID
    REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── MONITORING JOURNALS ────────────
CREATE TABLE monitoring_journals (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),
  division_chief_id UUID NOT NULL
    REFERENCES profiles(id),
  employee_id UUID NOT NULL
    REFERENCES profiles(id),
  spms_cycle_id UUID NOT NULL
    REFERENCES spms_cycles(id),
  quarter INT NOT NULL
    CHECK (quarter IN (1,2,3,4)),
  monitoring_mechanism TEXT
    CHECK (monitoring_mechanism IN (
      'One-on-One',
      'Group Meeting',
      'Memo',
      'Others'
    )),
  coaching_notes TEXT,
  date_conducted DATE,
  noted_by UUID
    REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── DEVELOPMENT PLANS ──────────────
CREATE TABLE development_plans (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,
  ipcr_form_id UUID
    REFERENCES ipcr_forms(id),
  aim TEXT,
  objective TEXT,
  tasks TEXT,
  outcome TEXT,
  next_step TEXT,
  target_date DATE,
  review_date DATE,
  achieved_date DATE,
  status TEXT DEFAULT 'active'
    CHECK (status IN (
      'active',
      'in_progress',
      'achieved',
      'cancelled'
    )),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── AWARDS ─────────────────────────
CREATE TABLE awards (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,
  award_type TEXT NOT NULL,
  award_period TEXT,
  basis_ipcr_id UUID
    REFERENCES ipcr_forms(id),
  given_by UUID NOT NULL
    REFERENCES profiles(id),
  given_at DATE,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── AUDIT LOGS ─────────────────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY
    DEFAULT gen_random_uuid(),
  performed_by UUID NOT NULL
    REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── RLS: ENABLE ON ALL TABLES ──────
ALTER TABLE profiles
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dtr_logs
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE spms_cycles
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipcr_forms
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipcr_outputs
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE opcr_forms
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_journals
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_plans
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs
  ENABLE ROW LEVEL SECURITY;

-- ─── RLS HELPER FUNCTIONS ───────────
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles
  WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER
   STABLE;

CREATE OR REPLACE FUNCTION is_hr_manager()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN (
    'head_of_office', 'admin_staff'
  )
$$ LANGUAGE sql SECURITY DEFINER
   STABLE;

CREATE OR REPLACE FUNCTION
  is_division_chief()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() = 'division_chief'
$$ LANGUAGE sql SECURITY DEFINER
   STABLE;

CREATE OR REPLACE FUNCTION
  get_my_division()
RETURNS TEXT AS $$
  SELECT division FROM profiles
  WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER
   STABLE;

CREATE OR REPLACE FUNCTION
  same_division(target_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_my_division() = (
    SELECT division FROM profiles
    WHERE id = target_id
  )
$$ LANGUAGE sql SECURITY DEFINER
   STABLE;

-- ─── RLS POLICIES ───────────────────

-- profiles
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR is_hr_manager()
    OR (
      is_division_chief() AND
      same_division(id)
    )
  );

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_admin"
  ON profiles FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles
     WHERE id = auth.uid()) = 'admin_staff'
  );

CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (is_hr_manager())
  WITH CHECK (is_hr_manager());

-- dtr_logs
CREATE POLICY "dtr_select"
  ON dtr_logs FOR SELECT
  USING (
    employee_id = auth.uid()
    OR is_hr_manager()
    OR (
      is_division_chief() AND
      same_division(employee_id)
    )
  );

CREATE POLICY "dtr_insert"
  ON dtr_logs FOR INSERT
  WITH CHECK (is_hr_manager());

CREATE POLICY "dtr_update"
  ON dtr_logs FOR UPDATE
  USING (is_hr_manager());

CREATE POLICY "dtr_delete"
  ON dtr_logs FOR DELETE
  USING (is_hr_manager());

-- leave_requests
CREATE POLICY "leave_select"
  ON leave_requests FOR SELECT
  USING (
    employee_id = auth.uid()
    OR is_hr_manager()
    OR (
      is_division_chief() AND
      same_division(employee_id)
    )
  );

CREATE POLICY "leave_insert"
  ON leave_requests FOR INSERT
  WITH CHECK (
    employee_id = auth.uid()
  );

CREATE POLICY "leave_update"
  ON leave_requests FOR UPDATE
  USING (
    employee_id = auth.uid()
    OR is_hr_manager()
  );

-- leave_balances
CREATE POLICY "balance_select"
  ON leave_balances FOR SELECT
  USING (
    employee_id = auth.uid()
    OR is_hr_manager()
    OR (
      is_division_chief() AND
      same_division(employee_id)
    )
  );

CREATE POLICY "balance_manage"
  ON leave_balances FOR ALL
  USING (is_hr_manager());

-- spms_cycles
CREATE POLICY "cycles_select_all"
  ON spms_cycles FOR SELECT
  USING (true);

CREATE POLICY "cycles_manage"
  ON spms_cycles FOR ALL
  USING (is_hr_manager());

-- ipcr_forms
CREATE POLICY "ipcr_select"
  ON ipcr_forms FOR SELECT
  USING (
    employee_id = auth.uid()
    OR is_hr_manager()
    OR (
      is_division_chief() AND
      same_division(employee_id)
    )
  );

CREATE POLICY "ipcr_insert"
  ON ipcr_forms FOR INSERT
  WITH CHECK (
    employee_id = auth.uid()
  );

CREATE POLICY "ipcr_update"
  ON ipcr_forms FOR UPDATE
  USING (
    employee_id = auth.uid()
    OR is_hr_manager()
    OR is_division_chief()
  );

-- ipcr_outputs (inherits via join)
CREATE POLICY "ipcr_outputs_select"
  ON ipcr_outputs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ipcr_forms f
      WHERE f.id = ipcr_form_id
      AND (
        f.employee_id = auth.uid()
        OR is_hr_manager()
        OR (
          is_division_chief() AND
          same_division(f.employee_id)
        )
      )
    )
  );

CREATE POLICY "ipcr_outputs_manage"
  ON ipcr_outputs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ipcr_forms f
      WHERE f.id = ipcr_form_id
      AND (
        f.employee_id = auth.uid()
        OR is_hr_manager()
      )
    )
  );

-- opcr_forms
CREATE POLICY "opcr_manage"
  ON opcr_forms FOR ALL
  USING (is_hr_manager());

-- monitoring_journals
CREATE POLICY "monitoring_select"
  ON monitoring_journals FOR SELECT
  USING (
    employee_id = auth.uid()
    OR is_hr_manager()
    OR division_chief_id = auth.uid()
  );

CREATE POLICY "monitoring_manage"
  ON monitoring_journals FOR ALL
  USING (
    is_hr_manager() OR
    is_division_chief()
  );

-- development_plans
CREATE POLICY "devplan_select"
  ON development_plans FOR SELECT
  USING (
    employee_id = auth.uid()
    OR is_hr_manager()
  );

CREATE POLICY "devplan_manage"
  ON development_plans FOR ALL
  USING (is_hr_manager());

-- awards
CREATE POLICY "awards_select"
  ON awards FOR SELECT
  USING (
    employee_id = auth.uid()
    OR is_hr_manager()
  );

CREATE POLICY "awards_manage"
  ON awards FOR ALL
  USING (is_hr_manager());

-- audit_logs
CREATE POLICY "audit_select"
  ON audit_logs FOR SELECT
  USING (is_hr_manager());

CREATE POLICY "audit_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (
    performed_by = auth.uid()
  );

-- ─── TRIGGER: updated_at ────────────
CREATE OR REPLACE FUNCTION
  update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER dtr_updated_at
  BEFORE UPDATE ON dtr_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─── DEDUCT LEAVE BALANCE RPC ───────
CREATE OR REPLACE FUNCTION
  deduct_leave_balance(
    p_employee_id UUID,
    p_year INT,
    p_leave_type TEXT,
    p_days NUMERIC
  )
RETURNS void AS $$
BEGIN
  IF p_leave_type = 'Vacation Leave' THEN
    UPDATE leave_balances
      SET vacation_leave_used =
        vacation_leave_used + p_days
      WHERE employee_id = p_employee_id
      AND year = p_year;
  ELSIF p_leave_type = 'Sick Leave' THEN
    UPDATE leave_balances
      SET sick_leave_used =
        sick_leave_used + p_days
      WHERE employee_id = p_employee_id
      AND year = p_year;
  ELSIF p_leave_type =
    'Special Privilege Leave' THEN
    UPDATE leave_balances
      SET special_leave_used =
        special_leave_used + p_days
      WHERE employee_id = p_employee_id
      AND year = p_year;
  ELSIF p_leave_type =
    'Emergency Leave' THEN
    UPDATE leave_balances
      SET emergency_leave_used =
        emergency_leave_used + p_days
      WHERE employee_id = p_employee_id
      AND year = p_year;
  END IF;
  -- LWOP and Maternity/Paternity:
  -- no balance to deduct, do nothing
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
