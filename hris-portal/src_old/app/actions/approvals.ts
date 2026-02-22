'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type PendingSubmission = {
    id: string
    staffName: string
    position: string
    department: string
    dateSubmitted: string
    status: string
    targets: any[]
    final_rating?: number
    adjectival_rating?: string
}

// 1. Get Pending Submissions for Supervisor and Provincial Assessor
export async function getPendingSubmissions() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch user role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role || 'project_staff'
    console.log("Fetching approvals for:", user.id, "Role:", role)

    let query = supabase
        .from('spms_commitments')
        .select(`
            *,
            profiles!user_id (
                full_name,
                position_title,
                department,
                avatar_url
            ),
            spms_targets (*)
        `)
        .order('created_at', { ascending: false })

    if (role === 'head_of_office' || role === 'admin_staff') {
        // Provincial Assessor sees 'rated' (for final approval) AND direct reports 'pending_approval'
        query = query.or(`status.eq.rated,and(status.eq.pending_approval,supervisor_id.eq.${user.id})`)
    } else {
        // Supervisors only see their direct reports' pending approvals
        query = query
            .eq('supervisor_id', user.id)
            .eq('status', 'pending_approval')
    }

    const { data: submissions, error } = await query

    if (error) {
        console.error('Error fetching submissions:', error)
        return []
    }

    console.log("Found submissions:", submissions?.length)

    // Map safely
    return submissions.map(sub => ({
        id: sub.id,
        staffName: sub.profiles?.full_name || 'Unknown User',
        position: sub.profiles?.position_title || 'N/A',
        department: sub.profiles?.department || 'N/A',
        dateSubmitted: new Date(sub.updated_at || sub.created_at).toLocaleDateString(),
        status: sub.status,
        targets: sub.spms_targets || [],
        final_rating: sub.final_rating,
        adjectival_rating: sub.adjectival_rating
    }))
}

// 2. Approve/Verify Submission (Initial Review by Supervisor)
// Renaming strictly for clarity, but mapped to existing usage
export async function reviewSubmission(commitmentId: string, action: 'approve' | 'return', remarks?: string) {
    const supabase = await createClient()

    // Determine new status
    // If Supervisor approves, it moves to 'rated' (ready for rating input? No, rating happens separately)
    // Wait, usually: Submit -> Pending -> (Review) -> Rated (by supervisor) -> Approved (Head)
    // BUT the 'reviewSubmission' action in UI is just "Approve".
    // If we assume 'approve' means "Accepted for Rating", status becomes 'reviewed'? or stays 'pending_approval'?
    // Let's stick to current flow: 'approve' -> 'approved' (for simple flow).
    // BUT for Provincial Assessor flow, we need 'rated' status.
    // The Rating Form sets it to 'rated'.

    // For now, keep existing logic: 'approve' -> 'approved' (which might be wrong naming, maybe 'reviewed'?)
    const newStatus = action === 'approve' ? 'approved' : 'draft'

    const { error } = await supabase
        .from('spms_commitments')
        .update({ status: newStatus })
        .eq('id', commitmentId)

    if (error) {
        return { error: `Failed to ${action} submission` }
    }

    revalidatePath('/dashboard/approvals')
    return { success: true }
}

// 3. Final Approve Submission (Provincial Assessor)
export async function finalApproveSubmission(commitmentId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('spms_commitments')
        .update({ status: 'approved' }) // Final state
        .eq('id', commitmentId)

    if (error) {
        return { error: 'Failed to final approve submission' }
    }

    revalidatePath('/dashboard/approvals')
    return { success: true }
}

// 4. Get Team Commitments (for Rating)
export async function getTeamCommitments() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Fetch commitments assigned to this supervisor
    const { data, error } = await supabase
        .from('spms_commitments')
        .select(`
            id,
            status,
            created_at,
            final_rating,
            adjectival_rating,
            profiles!user_id (
                full_name,
                position_title,
                department
            )
        `)
        .eq('supervisor_id', user.id)
        .in('status', ['approved', 'rated']) // 'approved' means ready for rating? 'rated' means done.
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching team commitments:', JSON.stringify(error, null, 2))
        // Fallback: Return empty array to avoid crashing UI
        return []
    }

    return data.map((item: any) => ({
        id: item.id,
        staff_name: item.profiles.full_name,
        position_title: item.profiles.position_title,
        date_submitted: item.created_at,
        status: item.status,
        final_rating: item.final_rating,
        adjectival_rating: item.adjectival_rating
    }))
}
