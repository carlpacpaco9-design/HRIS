-- 1. Check if ANY relevant commitments exist
-- Replace 'pending_approval' with the status you expect (e.g. 'pending_approval', 'draft')

SELECT 
    c.id AS commitment_id,
    c.status,
    c.user_id AS employee_id,
    p1.full_name AS employee_name,
    c.supervisor_id,
    p2.full_name AS supervisor_name,
    p2.email AS supervisor_email
FROM spms_commitments c
LEFT JOIN profiles p1 ON c.user_id = p1.id
LEFT JOIN profiles p2 ON c.supervisor_id = p2.id
WHERE c.status = 'pending_approval';

-- 2. Check if the logged-in supervisor (you) is actually assigned as the supervisor
-- Compare your USER ID with the `supervisor_id` in the result above.
-- If `supervisor_id` is NULL or WRONG, the employee selected the wrong person or none at all.

-- 3. Check if RLS is hiding them (Run as anon/authenticated role simulation if possible, or trust this admin query)
-- If the query returns rows but the app shows nothing, it IS an RLS issue.
-- If the query returns NO rows, then the data is missing (Employee didn't submit properly or selected wrong supervisor).
