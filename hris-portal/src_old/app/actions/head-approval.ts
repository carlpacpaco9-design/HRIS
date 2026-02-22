'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/audit-logger"

export async function approveFinalRating(commitmentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Check if user is Provincial Assessor or Administrative Staff
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'head_of_office' && profile?.role !== 'admin_staff') {
        return { error: "Only Provincial Assessor or Administrative Staff can approve final ratings." }
    }

    // Update status
    const { error } = await supabase
        .from('spms_commitments')
        .update({ status: 'closed' }) // or 'finalized'
        .eq('id', commitmentId)

    if (error) {
        await logActivity('APPROVE_FINAL_RATING_FAILED', 'COMMITMENT', commitmentId, { error: error.message })
        return { error: "Failed to approve rating" }
    }

    await logActivity(
        "APPROVE_FINAL_RATING_SUCCESS",
        "COMMITMENT",
        commitmentId,
        { status: "closed", approved_by: user.id }
    );

    revalidatePath('/dashboard/admin')
    return { success: "Rating Approved Final" }
}
