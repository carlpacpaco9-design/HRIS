-- Update CHECK constraint on ipcr_outputs.category:
-- Remove 'Strategic Priority'

ALTER TABLE ipcr_outputs
  DROP CONSTRAINT IF EXISTS ipcr_outputs_category_check;

-- Note: Depending on how the table was generated, Supabase might not have explicitly named it ipcr_outputs_category_check, 
-- but we will enforce a new one. Before restricting, we migrate data.

-- Migrate any existing Strategic Priority rows to Core Function:
UPDATE ipcr_outputs
  SET category = 'Core Function'
  WHERE category = 'Strategic Priority';

ALTER TABLE ipcr_outputs
  ADD CONSTRAINT ipcr_outputs_category_check
  CHECK (category IN (
    'Core Function',
    'Support Function'
  ));
