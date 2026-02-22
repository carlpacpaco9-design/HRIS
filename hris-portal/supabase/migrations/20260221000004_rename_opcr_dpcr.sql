-- Rename the tables
ALTER TABLE opcr_forms RENAME TO dpcr_forms;
ALTER TABLE opcr_outputs RENAME TO dpcr_outputs;

-- Update RLS policies:
-- Drop old policies on renamed tables and recreate with correct table references

DROP POLICY IF EXISTS "opcr_outputs_all" ON dpcr_outputs;
DROP POLICY IF EXISTS "opcr_outputs_manage" ON dpcr_outputs;

CREATE POLICY "dpcr_outputs_manage" ON dpcr_outputs FOR ALL USING (is_hr_manager());

DROP POLICY IF EXISTS "opcr_forms_all" ON dpcr_forms;
DROP POLICY IF EXISTS "opcr_forms_manage" ON dpcr_forms;

CREATE POLICY "dpcr_forms_manage" ON dpcr_forms FOR ALL USING (is_hr_manager());
