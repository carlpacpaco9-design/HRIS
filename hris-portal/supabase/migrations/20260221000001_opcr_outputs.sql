CREATE TABLE opcr_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opcr_form_id UUID NOT NULL REFERENCES opcr_forms(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'Strategic Priority',
    'Core Function',
    'Support Function'
  )),
  output_order INT DEFAULT 0,
  major_final_output TEXT NOT NULL,
  success_indicators TEXT,
  allotted_budget NUMERIC(12,2),
  division_accountable TEXT,
  actual_accomplishments TEXT,
  rating_quantity NUMERIC(3,2),
  rating_efficiency NUMERIC(3,2),
  rating_timeliness NUMERIC(3,2),
  rating_average NUMERIC(3,2),
  remarks TEXT
);

ALTER TABLE opcr_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opcr_outputs_manage" ON opcr_outputs FOR ALL USING (is_hr_manager());
