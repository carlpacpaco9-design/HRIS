-- The leave_type column is an enum or check constraint. Expand it to include all 14 types:

DO $$ 
DECLARE 
  rec record;
BEGIN
  FOR rec IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'leave_requests'
      AND tc.constraint_type = 'CHECK'
      AND ccu.column_name = 'leave_type'
  LOOP
    EXECUTE 'ALTER TABLE leave_requests DROP CONSTRAINT ' || quote_ident(rec.constraint_name);
  END LOOP;
END $$;

-- Map old values to new valid values
UPDATE leave_requests SET leave_type = 'Maternity Leave' WHERE leave_type = 'Maternity/Paternity Leave';
UPDATE leave_requests SET leave_type = 'Special Emergency (Calamity) Leave' WHERE leave_type = 'Emergency Leave';
UPDATE leave_requests SET leave_type = 'Leave Without Pay' WHERE leave_type = 'LWOP';

ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_leave_type_check
CHECK (leave_type IN (
  'Vacation Leave',
  'Mandatory/Forced Leave',
  'Sick Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Special Privilege Leave',
  'Solo Parent Leave',
  'Study Leave',
  '10-Day VAWC Leave',
  'Rehabilitation Privilege',
  'Special Leave Benefits for Women',
  'Special Emergency (Calamity) Leave',
  'Adoption Leave',
  'Leave Without Pay'
));
