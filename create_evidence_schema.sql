-- 1. Create the Private Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence_files', 'evidence_files', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the Evidence Table
CREATE TABLE IF NOT EXISTS spms_evidence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_id UUID NOT NULL REFERENCES spms_targets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on Table
ALTER TABLE spms_evidence ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for spms_evidence Table

-- Policy A: Users can view their own evidence OR evidence of employees they supervise
CREATE POLICY "Users can view own or supervisee evidence" 
ON spms_evidence FOR SELECT 
USING (
    auth.uid() = user_id 
    OR 
    auth.uid() IN (
        SELECT c.supervisor_id 
        FROM spms_targets t
        JOIN spms_commitments c ON c.id = t.commitment_id
        WHERE t.id = spms_evidence.target_id
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'head_of_office')
    )
);

-- Policy B: Users can upload (INSERT) only for themselves
CREATE POLICY "Users can insert own evidence" 
ON spms_evidence FOR INSERT 
WITH CHECK (
    auth.uid() = user_id
);

-- Policy C: Users can delete only their own evidence
CREATE POLICY "Users can delete own evidence" 
ON spms_evidence FOR DELETE 
USING (
    auth.uid() = user_id
);

-- 5. RLS Policies for Storage (Bucket)
-- Note: This requires complex joins usually, but we will protect it via folder structure "user_id/..."

-- Allow users to fully manage files in their own folder
CREATE POLICY "Individual User Storage Access"
ON storage.objects FOR ALL
USING (
    bucket_id = 'evidence_files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'evidence_files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow Supervisors to Read (SELECT) files from their subordinates
-- This is a simplified policy; for high security, generate Signed URLs with the Service Role in the backend.
-- The policy below effectively allows read access if you know the path, relying on the Signed URL for time-limited access.
-- CREATE POLICY "Give Read Access to Signed URLs" ... (Handled by Supabase Signed URLs implicitly if configured or using service role)
