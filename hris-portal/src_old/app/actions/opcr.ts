'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'
import {
    OPCRForm,
    OPCRStatus,
    OPCRFormInput,
    OPCROutputInput,
    AdjectivalRating
} from '@/types/opcr'
import { buildNotificationContent, notifyMultipleUsers } from '@/lib/notifications'

// ── HELPERS ──────────────────────────────────────────

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, division_id, full_name')
        .eq('id', user.id)
        .single()

    if (!profile) throw new Error('User profile not found')
    return { user, profile }
}

function getAdjectivalRatingLabel(rating: number): AdjectivalRating {
    if (rating >= 4.5) return 'Outstanding'
    if (rating >= 3.5) return 'Very Satisfactory'
    if (rating >= 2.5) return 'Satisfactory'
    if (rating >= 1.5) return 'Unsatisfactory'
    return 'Poor'
}

// ── QUERIES ──────────────────────────────────────────

export async function getOPCRForms(filters?: {
    status?: string
    rating_period_id?: string
}) {
    try {
        const supabase = await createClient()
        let query = supabase
            .from('opcr_forms')
            .select(`
                *,
                rating_period:rating_periods(name, period_from, period_to),
                prepared_by_profile:profiles!prepared_by(full_name),
                reviewed_by_profile:profiles!reviewed_by(full_name)
            `)
            .order('created_at', { ascending: false })

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status)
        }
        if (filters?.rating_period_id) {
            query = query.eq('rating_period_id', filters.rating_period_id)
        }

        const { data, error } = await query
        if (error) throw error

        return { data: data as OPCRForm[], error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function getOPCRFormById(id: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('opcr_forms')
            .select(`
                *,
                rating_period:rating_periods(name, period_from, period_to),
                prepared_by_profile:profiles!prepared_by(full_name),
                reviewed_by_profile:profiles!reviewed_by(full_name),
                outputs:opcr_outputs(*)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return { data: data as OPCRForm, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function getActiveOPCR() {
    try {
        const supabase = await createClient()

        // 1. Get active rating period
        const { data: activePeriod } = await supabase
            .from('rating_periods')
            .select('id')
            .eq('status', 'active')
            .maybeSingle()

        if (!activePeriod) return { data: null, error: null }

        // 2. Get OPCR for this period
        const { data, error } = await supabase
            .from('opcr_forms')
            .select(`
                *,
                rating_period:rating_periods(name, period_from, period_to),
                prepared_by_profile:profiles!prepared_by(full_name),
                outputs:opcr_outputs(*)
            `)
            .eq('rating_period_id', activePeriod.id)
            .maybeSingle()

        if (error) throw error
        return { data: data as OPCRForm, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function checkOPCRExists(rating_period_id: string): Promise<boolean> {
    const supabase = await createClient()
    const { count } = await supabase
        .from('opcr_forms')
        .select('*', { count: 'exact', head: true })
        .eq('rating_period_id', rating_period_id)

    return (count || 0) > 0
}

export async function getOPCRConsolidationReport(rating_period_id: string) {
    try {
        const supabase = await createClient()

        // 1. Get OPCR for period
        const { data: opcr, error: opcrError } = await supabase
            .from('opcr_forms')
            .select('*, rating_period:rating_periods(name)')
            .eq('rating_period_id', rating_period_id)
            .maybeSingle()

        if (opcrError) throw opcrError

        // 2. Get all IPCR summaries for the period
        const { data: ipcrForms, error: ipcrError } = await supabase
            .from('ipcr_forms')
            .select(`
                final_average_rating,
                division_id,
                division:divisions(name, code)
            `)
            .eq('rating_period_id', rating_period_id)
            .neq('status', 'draft')

        if (ipcrError) throw ipcrError

        // 3. Get all divisions to ensure full breakdown
        const { data: divisions } = await supabase.from('divisions').select('id, name, code')

        const divisionStats = divisions?.map(d => {
            const divIpcrs = ipcrForms.filter(f => f.division_id === d.id)
            const count = divIpcrs.length
            const avg = count > 0
                ? divIpcrs.reduce((acc, f) => acc + (Number(f.final_average_rating) || 0), 0) / count
                : 0

            return {
                division_id: d.id,
                division_name: d.name,
                division_code: d.code,
                staff_count: count,
                avg_rating: avg.toFixed(2),
                adjectival: getAdjectivalRatingLabel(avg)
            }
        }) || []

        const summary = {
            opcr: opcr,
            division_stats: divisionStats,
            total_ipcr_avg: ipcrForms.length > 0
                ? (ipcrForms.reduce((acc, f) => acc + (Number(f.final_average_rating) || 0), 0) / ipcrForms.length).toFixed(2)
                : "0.00"
        }

        return { data: summary, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

// ── MUTATIONS ────────────────────────────────────

export async function createOPCRForm(data: OPCRFormInput) {
    try {
        const { profile } = await getAuthenticatedUser()
        if (profile.role !== 'head_of_office' && profile.role !== 'admin_staff') {
            throw new Error('Only Provincial Assessor or Administrative Staff can create OPCR')
        }

        const supabase = await createClient()

        // Check if exists
        const exists = await checkOPCRExists(data.rating_period_id)
        if (exists) throw new Error('OPCR already exists for this rating period')

        // 1. Create Form
        const { data: form, error: formError } = await supabase
            .from('opcr_forms')
            .insert({
                rating_period_id: data.rating_period_id,
                prepared_by: profile.id,
                division_id: profile.division_id, // Provincial Assessor's division
                status: 'draft',
                remarks: data.remarks
            })
            .select()
            .single()

        if (formError) throw formError

        // 2. Create Outputs
        if (data.outputs.length > 0) {
            const outputsToInsert = data.outputs.map((o, index) => ({
                ...o,
                opcr_form_id: form.id,
                sort_order: index
            }))

            const { error: outputsError } = await supabase
                .from('opcr_outputs')
                .insert(outputsToInsert)

            if (outputsError) throw outputsError
        }

        await logActivity('CREATE_OPCR', 'opcr_forms', form.id, { period_id: data.rating_period_id })
        revalidatePath('/dashboard/opcr')
        return { data: form, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function updateOPCRForm(id: string, data: Partial<OPCRFormInput>) {
    try {
        const { profile } = await getAuthenticatedUser()
        const supabase = await createClient()

        // Check status
        const { data: existing } = await supabase
            .from('opcr_forms')
            .select('status')
            .eq('id', id)
            .single()

        if (!existing) throw new Error('OPCR not found')
        if (existing.status !== 'draft' && existing.status !== 'returned' && profile.role !== 'admin_staff') {
            throw new Error('Only drafts or returned OPCRs can be updated')
        }

        // Update form
        const { error: formError } = await supabase
            .from('opcr_forms')
            .update({
                remarks: data.remarks,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (formError) throw formError

        // Sync outputs if provided
        if (data.outputs) {
            await supabase.from('opcr_outputs').delete().eq('opcr_form_id', id)

            const outputsToInsert = data.outputs.map((o, index) => ({
                ...o,
                opcr_form_id: id,
                sort_order: index
            }))

            const { error: outputsError } = await supabase
                .from('opcr_outputs')
                .insert(outputsToInsert)

            if (outputsError) throw outputsError
        }

        await logActivity('UPDATE_OPCR', 'opcr_forms', id)
        revalidatePath('/dashboard/opcr')
        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function submitOPCRForm(id: string) {
    try {
        const { profile } = await getAuthenticatedUser()
        if (profile.role !== 'head_of_office' && profile.role !== 'admin_staff') {
            throw new Error('Unauthorized')
        }

        const supabase = await createClient()

        // Fetch OPCR with rating period for notification context
        const { data: opcr } = await supabase
            .from('opcr_forms')
            .select('id, rating_period:rating_periods(name)')
            .eq('id', id)
            .single()

        const { error } = await supabase
            .from('opcr_forms')
            .update({
                status: 'submitted',
                submitted_at: new Date().toISOString()
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('SUBMIT_OPCR', 'opcr_forms', id)
        revalidatePath('/dashboard/opcr')

        // ── Notification ────────────────────────────────────────────────────
        const { data: pmtMembers } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('role', 'admin_staff')

        if (pmtMembers && pmtMembers.length > 0) {
            const { title, message } = buildNotificationContent('opcr.submitted', {
                period: (opcr as any)?.rating_period?.name ?? 'current period',
                submitter: profile.full_name,
            })
            await notifyMultipleUsers(
                pmtMembers.map((u: any) => ({
                    id: u.id,
                    email: u.email ?? '',
                    full_name: u.full_name ?? '',
                })),
                {
                    type: 'opcr.submitted',
                    title,
                    message,
                    entity_type: 'opcr',
                    entity_id: id,
                    action_url: '/dashboard/opcr',
                }
            )
        }

        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function reviewOPCRForm(id: string, data: {
    review_remarks: string
    office_rating_q: number
    office_rating_e: number
    office_rating_t: number
}) {
    try {
        const { profile } = await getAuthenticatedUser()
        if (profile.role !== 'admin_staff' && profile.role !== 'head_of_office') {
            throw new Error('Only Administrative Staff can review OPCR')
        }

        const supabase = await createClient()

        const finalRating = (data.office_rating_q + data.office_rating_e + data.office_rating_t) / 3

        const { error } = await supabase
            .from('opcr_forms')
            .update({
                status: 'reviewed',
                reviewed_by: profile.id,
                office_rating_q: data.office_rating_q,
                office_rating_e: data.office_rating_e,
                office_rating_t: data.office_rating_t,
                office_final_rating: finalRating,
                adjectival_rating: getAdjectivalRatingLabel(finalRating),
                remarks: data.review_remarks
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('REVIEW_OPCR', 'opcr_forms', id, { reviewer: profile.full_name })
        revalidatePath('/dashboard/opcr')
        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function finalizeOPCRForm(id: string, data: {
    final_remarks?: string
}) {
    try {
        const { profile } = await getAuthenticatedUser()
        if (profile.role !== 'head_of_office' && profile.role !== 'admin_staff') {
            throw new Error('Only Provincial Assessor can finalize OPCR')
        }

        const supabase = await createClient()
        const { error } = await supabase
            .from('opcr_forms')
            .update({
                status: 'finalized',
                approved_by: profile.id,
                approved_at: new Date().toISOString(),
                remarks: data.final_remarks || null
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('FINALIZE_OPCR', 'opcr_forms', id)
        revalidatePath('/dashboard/opcr')
        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function returnOPCRForm(id: string, data: {
    return_reason: string
}) {
    try {
        const { profile } = await getAuthenticatedUser()
        if (!['head_of_office', 'admin_staff'].includes(profile.role)) {
            throw new Error('Unauthorized')
        }

        const supabase = await createClient()
        const { error } = await supabase
            .from('opcr_forms')
            .update({
                status: 'returned',
                remarks: data.return_reason
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('RETURN_OPCR', 'opcr_forms', id, { reason: data.return_reason })
        revalidatePath('/dashboard/opcr')
        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function updateOPCROutputRatings(
    opcr_id: string,
    ratings: {
        output_id: string
        rating_q: number
        rating_e: number
        rating_t: number
        actual_accomplishments: string
        remarks?: string
    }[]
) {
    try {
        const { profile } = await getAuthenticatedUser()
        if (!['admin_staff', 'head_of_office'].includes(profile.role)) {
            throw new Error('Unauthorized')
        }

        const supabase = await createClient()

        for (const r of ratings) {
            const { error } = await supabase
                .from('opcr_outputs')
                .update({
                    rating_q: r.rating_q,
                    rating_e: r.rating_e,
                    rating_t: r.rating_t,
                    actual_accomplishments: r.actual_accomplishments,
                    remarks: r.remarks
                })
                .eq('id', r.output_id)
                .eq('opcr_form_id', opcr_id)

            if (error) throw error
        }

        await logActivity('UPDATE_OPCR_RATINGS', 'opcr_forms', opcr_id)
        revalidatePath('/dashboard/opcr')
        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}
