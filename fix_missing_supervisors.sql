-- CRITICAL FIX for existing commitments
-- Users might have already submitted their IPCR but it went to a NULL supervisor.
-- This script will retroactive fix them by looking up their current profile supervisor.

UPDATE spms_commitments c
SET supervisor_id = p.supervisor_id
FROM profiles p
WHERE c.user_id = p.id
  AND c.status = 'pending_approval'
  AND (c.supervisor_id IS NULL OR c.supervisor_id != p.supervisor_id);

-- Verify the fix
SELECT 
    c.id, 
    p.full_name as employee, 
    c.status, 
    sup.full_name as now_assigned_to 
FROM spms_commitments c
JOIN profiles p ON c.user_id = p.id
LEFT JOIN profiles sup ON c.supervisor_id = sup.id
WHERE c.status = 'pending_approval';
