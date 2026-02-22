'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type Evidence = {
    id: string
    file_name: string
    file_path: string
    uploaded_at: string
    file_type: string
}

// 1. Get Evidence for a Target
export async function getEvidenceFiles(targetId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('spms_evidence')
        .select('*')
        .eq('target_id', targetId)
        .order('uploaded_at', { ascending: false })

    if (error) {
        console.error('Error fetching evidence:', error)
        return []
    }
    return data as Evidence[]
}

// 2. Upload Evidence
export async function uploadEvidence(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const file = formData.get('file') as File
    const targetId = formData.get('targetId') as string

    if (!file || !targetId) return { error: 'Missing file or target' }

    // Validate File (Max 5MB, PDF/Image)
    if (file.size > 5 * 1024 * 1024) return { error: 'File too large (Max 5MB)' }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) return { error: 'Invalid file type (PDF, JPG, PNG only)' }

    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop()
    const safeFileName = `${Date.now()}_${crypto.randomUUID()}.${fileExt}`
    const filePath = `${user.id}/${targetId}/${safeFileName}`

    const { error: uploadError } = await supabase
        .storage
        .from('evidence_files')
        .upload(filePath, file)

    if (uploadError) {
        console.error('Upload Error:', uploadError)
        return { error: 'Failed to upload file to storage' }
    }

    // 2. Insert into DB
    const { error: dbError } = await supabase
        .from('spms_evidence')
        .insert({
            user_id: user.id,
            target_id: targetId,
            file_name: file.name, // Original name
            file_path: filePath,
            file_type: file.type,
            file_size: file.size
        })

    if (dbError) {
        console.error('DB Insert Error:', dbError)
        // Cleanup storage if DB fails? (Optional but recommended)
        return { error: 'Failed to save file record' }
    }

    revalidatePath('/dashboard/ipcr')
    return { success: 'Evidence uploaded' }
}

// 3. Delete Evidence
export async function deleteEvidence(evidenceId: string, filePath: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Delete from DB first (or check ownership)
    const { error: dbError } = await supabase
        .from('spms_evidence')
        .delete()
        .eq('id', evidenceId)
        .eq('user_id', user.id) // Ensure owner

    if (dbError) {
        return { error: 'Failed to delete record' }
    }

    // 2. Delete from Storage
    const { error: storageError } = await supabase
        .storage
        .from('evidence_files')
        .remove([filePath])

    if (storageError) {
        console.error("Storage delete error", storageError)
        // Proceed anyway since DB record is gone
    }

    revalidatePath('/dashboard/ipcr')
    return { success: 'Proof deleted' }
}

// 4. Get View URL (Signed URL)
export async function getEvidenceUrl(filePath: string) {
    const supabase = await createClient()

    // Create a signed URL valid for 1 hour
    const { data, error } = await supabase
        .storage
        .from('evidence_files')
        .createSignedUrl(filePath, 60 * 60)

    if (error) return null

    return data.signedUrl
}
