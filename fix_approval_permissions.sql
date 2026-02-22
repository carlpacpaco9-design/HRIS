-- 1. Ensure Supervisor Policy exists and works
-- We need to check if RLS allows supervisors to see commitments where they are the 'supervisor_id'.

DROP POLICY IF EXISTS "Supervisors can view assigned commitments" ON spms_commitments;

CREATE POLICY "Supervisors can view assigned commitments"
ON spms_commitments
FOR SELECT
TO authenticated
USING (
    supervisor_id = auth.uid() 
    OR 
    user_id = auth.uid() -- keep owner access
);

-- 2. Also ensure they can see the targets within those commitments
DROP POLICY IF EXISTS "Supervisors can view targets of assigned commitments" ON spms_targets;

CREATE POLICY "Supervisors can view targets of assigned commitments"
ON spms_targets
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM spms_commitments
        WHERE spms_commitments.id = spms_targets.commitment_id
        AND (
            spms_commitments.supervisor_id = auth.uid() 
            OR 
            spms_commitments.user_id = auth.uid()
        )
    )
);

-- 3. Debug: Check if any commitments exist for the current supervisor (replace UUID with your supervisor's ID if testing manually)
-- SELECT * FROM spms_commitments WHERE supervisor_id = 'YOUR_SUPERVISOR_UUID' AND status = 'pending_approval';
