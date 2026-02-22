'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Submit for Rating (Employee Action)
export async function submitForRating(commitmentId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('spms_commitments')
        .update({ status: 'for_rating' }) // Employee locks their evidence uploads
        .eq('id', commitmentId)

    if (error) {
        return { error: 'Failed to submit for rating' }
    }

    revalidatePath('/dashboard/ipcr') // Employee Dashboard
    revalidatePath('/dashboard/approvals') // Supervisor Dashboard might see this status change
    return { success: 'Submitted for rating' }
}

// 2. Save Target Rating (Supervisor Action)
export async function saveTargetRating(targetId: string, q: number, e: number, t: number) {
    const supabase = await createClient()

    // Validate Scores
    if ([q, e, t].some(score => score < 1 || score > 5)) {
        return { error: 'Scores must be between 1 and 5' }
    }

    // Calculate Average
    const average_score = parseFloat(((q + e + t) / 3).toFixed(2))

    const { error } = await supabase
        .from('spms_targets')
        .update({
            quantity_score: q, // Map Q/E/T to DB columns (assuming quantity/quality/timeliness naming or generic score_q/e/t)
            quality_score: e, // Note: DB schema columns might vary, mapping strictly to request logic
            timeliness_score: t,
            average_score: average_score
        })
        .eq('id', targetId)

    if (error) {
        console.error('Error saving rating:', error)
        return { error: 'Failed to save rating' }
    }

    // We don't necessarily need to revalidate path on every single cell save for UX speed, 
    // but good for consistency.
    return { success: 'Rating saved', average: average_score }
}

// 3. Finalize Rating (Supervisor Action)
export async function finalizeRating(commitmentId: string, comments: string) {
    const supabase = await createClient()

    // A. Calculate Grand Average of all targets
    // Fetch all targets for this commitment
    const { data: targets, error: fetchError } = await supabase
        .from('spms_targets')
        .select('average_score')
        .eq('commitment_id', commitmentId)

    if (fetchError || !targets || targets.length === 0) {
        return { error: 'Could not calculate final rating' }
    }

    // Simple Average Logic (Sum / Count)
    // Note: SPMS sometimes has weighted averages based on Strategic/Core/Support percentages.
    // For this implementation, we will perform a straight average as per user request context implicitly.
    const totalScore = targets.reduce((acc, curr) => acc + (curr.average_score || 0), 0)
    const grandAverage = parseFloat((totalScore / targets.length).toFixed(2))

    // B. Determine Adjectival Rating (Simplified DepEd/CSC scale)
    let adjectival = ''
    if (grandAverage >= 5.00) adjectival = 'Outstanding'
    else if (grandAverage >= 4.00) adjectival = 'Very Satisfactory'
    else if (grandAverage >= 3.00) adjectival = 'Satisfactory'
    else if (grandAverage >= 2.00) adjectival = 'Unsatisfactory'
    else adjectival = 'Poor'

    // C. Update Commitment
    const { error } = await supabase
        .from('spms_commitments')
        .update({
            status: 'rated',
            final_rating: grandAverage,
            adjectival_rating: adjectival,
            comments: comments
        })
        .eq('id', commitmentId)

    if (error) {
        return { error: 'Failed to finalize rating' }
    }

    revalidatePath('/dashboard/approvals')
    revalidatePath(`/dashboard/rate/${commitmentId}`)
    return { success: 'Rating finalized successfully' }
}

// 4. Get Rating Data for Page
export async function getRatingData(commitmentId: string) {
    const supabase = await createClient()

    // Fetch Commitment + Profile + Targets
    const { data, error } = await supabase
        .from('spms_commitments')
        .select(`
            *,
            profiles!user_id (
                full_name,
                position_title
            ),
            spms_targets (
                *,
                spms_evidence (*)
            )
        `)
        .eq('id', commitmentId)
        .single()

    if (error) return null
    return data
}
