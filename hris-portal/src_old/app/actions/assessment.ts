'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'

// 1. Update Actual Accomplishments (Staff Action)
export async function updateAccomplishments(targetId: string, text: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Validate Status: Only editable if 'approved' (meaning targets are set) or 'pending_rating'
    // We need to fetch the commitment status first
    const { data: target } = await supabase
        .from('spms_targets')
        .select('commitment_id, spms_commitments(status, user_id)')
        .eq('id', targetId)
        .single()

    // Check ownership
    /* @ts-ignore */
    if (target?.spms_commitments?.user_id !== user.id) {
        return { error: 'Unauthorized to edit this accomplishment' }
    }

    const { error } = await supabase
        .from('spms_targets')
        .update({ actual_accomplishment: text })
        .eq('id', targetId)

    if (error) {
        return { error: 'Failed to save accomplishment' }
    }

    revalidatePath('/dashboard/ipcr')
    return { success: 'Accomplishment updated' }
}

// 2. Submit Rating (Supervisor Action)
export async function submitRating(targetId: string, q: number, e: number, t: number, remarks?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Security Gate: Check Supervisor
    const { data: target, error: targetError } = await supabase
        .from('spms_targets')
        .select('commitment_id, spms_commitments(supervisor_id)')
        .eq('id', targetId)
        .single()

    if (targetError || !target) return { error: 'Target not found' }

    /* @ts-ignore */
    if (target.spms_commitments?.supervisor_id !== user.id) {
        throw new Error("Unauthorized: Only the assigned supervisor can rate this.")
    }

    // Basic validation
    if ([q, e, t].some(val => val < 1 || val > 5)) {
        return { error: 'Scores must be between 1 and 5' }
    }

    // Calculate Average
    const average = (Number(q) + Number(e) + Number(t)) / 3

    const { error } = await supabase
        .from('spms_targets')
        .update({
            quantity_score: q,
            quality_score: e,
            timeliness_score: t,
            average_score: average,
            remarks: remarks || ''
        })
        .eq('id', targetId)

    if (error) {
        await logActivity('RATE_TARGET_FAILED', 'TARGET', targetId, { error: error.message })
        return { error: 'Failed to submit rating' }
    }

    await logActivity('RATE_TARGET_SUCCESS', 'TARGET', targetId, { q, e, t, average })
    return { success: 'Rating saved', average }
}

// 3. Finalize Assessment (Supervisor Action)
export async function finalizeAssessment(commitmentId: string) {
    console.log("Finalizing assessment for:", commitmentId) // Debug log
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 1. Security Gate: Verify Supervisor
    const { data: commitment, error: commError } = await supabase
        .from('spms_commitments')
        .select('supervisor_id, status')
        .eq('id', commitmentId)
        .single()

    if (commError || !commitment) return { error: 'Commitment not found' }

    if (commitment.supervisor_id !== user.id) {
        throw new Error("Unauthorized: Only the assigned supervisor can rate this.")
    }

    // 2. Completeness Validation
    const { data: targets, error: fetchError } = await supabase
        .from('spms_targets')
        .select('quantity_score, quality_score, timeliness_score, average_score')
        .eq('commitment_id', commitmentId)

    if (fetchError || !targets || targets.length === 0) {
        return { error: 'Could not fetch targets for calculation' }
    }

    // Check for incomplete ratings
    const incompleteTargets = targets.some(t =>
        t.quantity_score === null ||
        t.quality_score === null ||
        t.timeliness_score === null
    )

    if (incompleteTargets) {
        throw new Error("Cannot finalize: Please rate ALL targets first.")
    }

    // 3. Grand Average Calculation
    const validTargets = targets.filter(t => t.average_score !== null)

    if (validTargets.length === 0) {
        return { error: 'No rated targets found to calculate average' }
    }

    const totalScore = validTargets.reduce((acc, curr) => acc + (curr.average_score || 0), 0)
    const finalRating = totalScore / validTargets.length

    // Adjectival Rating
    let adjectival = ''
    if (finalRating >= 4.5) adjectival = 'Outstanding'
    else if (finalRating >= 3.5) adjectival = 'Very Satisfactory'
    else if (finalRating >= 2.5) adjectival = 'Satisfactory'
    else if (finalRating >= 1.5) adjectival = 'Unsatisfactory'
    else adjectival = 'Poor'

    // Update Commitment
    const { error } = await supabase
        .from('spms_commitments')
        .update({
            status: 'rated',
            final_rating: finalRating,
            adjectival_rating: adjectival
        })
        .eq('id', commitmentId)

    if (error) {
        await logActivity('FINALIZE_ASSESSMENT_FAILED', 'COMMITMENT', commitmentId, { error: error.message })
        return { error: 'Failed to finalize assessment' }
    }

    await logActivity('FINALIZE_ASSESSMENT_SUCCESS', 'COMMITMENT', commitmentId, { rating: finalRating, adjectival })

    revalidatePath('/dashboard/rate/[id]')
    revalidatePath('/dashboard/approvals')
    revalidatePath('/dashboard/ipcr') // Staff member sees update

    return { success: 'Assessment finalized successfully' }
}
