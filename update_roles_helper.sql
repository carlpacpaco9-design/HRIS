-- INSTRUCTIONS:
-- Run this script in the Supabase SQL Editor to configure your user roles for the new Hierarchy.
-- Replace the emails with the actual email addresses of your users.

-- 1. Set the HEAD OF OFFICE (Top of the hierarchy)
-- Only one person generally holds this role.
-- They will not see any supervisor options.
UPDATE profiles 
SET role = 'head_of_office'::user_role, 
    position_title = 'Municipal/City Assessor' 
WHERE email = 'INSERT_HEAD_EMAIL_HERE@example.com'; 

-- 2. Set the DIVISION CHIEFS
-- These users will strictly report to the Head of Office.
-- They will appear as options for regular employees.
UPDATE profiles 
SET role = 'division_chief'::user_role 
WHERE email IN (
    'INSERT_CHIEF_1@example.com', 
    'INSERT_CHIEF_2@example.com'
);

-- 3. Set regular EMPLOYEES
-- These users can choose either a Division Chief or the Head of Office.
UPDATE profiles 
SET role = 'employee'::user_role 
WHERE email IN (
    'INSERT_EMPLOYEE_1@example.com'
);

-- 4. (Optional) Reset supervisor selections that contradict the new hierarchy
-- For example, remove supervisors from the Head of Office
UPDATE profiles 
SET supervisor_id = NULL 
WHERE role = 'head_of_office'::user_role;

-- 5. Verify the configuration
SELECT full_name, role, position_title, email FROM profiles ORDER BY role;
