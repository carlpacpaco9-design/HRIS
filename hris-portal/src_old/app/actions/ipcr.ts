'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'
import {
    IPCRForm,
    IPCRStatus,
    AdjectivalRating,
    OutputCategory,
    IPCROutputInput,
    IPCRFormInput
} from '@/types/ipcr'
import { buildNotificationContent, notifyUser } from '@/lib/notifications'

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

// ── QUERIES ──────────────────────────────────────────

export async function getIPCRForms(filters?: {
    status?: string
    rating_period_id?: string
    division_id?: string
}) {
    try {
        const supabase = await createClient()
        let query = supabase
            .from('ipcr_forms')
            .select(`
        *,
        employee:profiles!employee_id(full_name, avatar_url),
        division:divisions(name, code),
        rating_period:rating_periods(name)
      `)
            .order('created_at', { ascending: false })

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status)
        }
        if (filters?.rating_period_id) {
            query = query.eq('rating_period_id', filters.rating_period_id)
        }
        if (filters?.division_id) {
            query = query.eq('division_id', filters.division_id)
        }

        const { data, error } = await query
        if (error) throw error

        return { data: data as IPCRForm[], error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function getIPCRFormById(id: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('ipcr_forms')
            .select(`
        *,
        employee:profiles!employee_id(full_name, avatar_url),
        division:divisions(name, code),
        rating_period:rating_periods(name),
        outputs:ipcr_outputs(*)
      `)
            .eq('id', id)
            .single()

        if (error) throw error
        return { data: data as IPCRForm, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function getActiveRatingPeriod() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('rating_periods')
            .select('*')
            .eq('status', 'active')
            .maybeSingle()

        if (error) throw error
        return { data: data, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function getIPCRData() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { cycle: null, commitment: null }

        // 1. Get active rating period
        const { data: cycle, error: cycleError } = await supabase
            .from('rating_periods')
            .select('*')
            .eq('status', 'active')
            .maybeSingle()

        if (cycleError) throw cycleError
        if (!cycle) return { cycle: null, commitment: null }

        // 2. Get user's current IPCR form for this period
        const { data: commitment, error: formsError } = await supabase
            .from('ipcr_forms')
            .select(`
                *,
                rating_period:rating_periods(name)
            `)
            .eq('employee_id', user.id)
            .eq('rating_period_id', cycle.id)
            .maybeSingle()

        if (formsError) throw formsError

        return {
            cycle: cycle ? {
                ...cycle,
                title: cycle.name,
                end_date: cycle.period_to
            } : null,
            commitment: commitment
        }
    } catch (error: any) {
        console.error('Error in getIPCRData:', error.message)
        return { cycle: null, commitment: null }
    }
}

export async function getRatingPeriods() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('rating_periods')
            .select('*')
            .order('period_from', { ascending: false })

        if (error) throw error
        return { data, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function getDivisions() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('divisions')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (error) throw error
        return { data, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function getStaffByDivision(divisionId: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('division_id', divisionId)
            .order('full_name')

        if (error) throw error
        return { data, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function getDivisionChief(divisionId: string) {
    try {
        const supabase = await createClient()
        const { data: division, error } = await supabase
            .from('divisions')
            .select('division_chief_id')
            .eq('id', divisionId)
            .single()

        if (error) throw error
        return { data: division.division_chief_id, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

// ── MUTATIONS ────────────────────────────────────────

export async function createIPCRForm(data: {
    rating_period_id: string
    division_id: string
    immediate_supervisor_id?: string
    outputs: IPCROutputInput[]
}) {
    try {
        const { profile } = await getAuthenticatedUser()
        const supabase = await createClient()

        // 1. Create IPCR Form
        const { data: form, error: formError } = await supabase
            .from('ipcr_forms')
            .insert({
                rating_period_id: data.rating_period_id,
                employee_id: profile.id,
                division_id: data.division_id,
                immediate_supervisor_id: data.immediate_supervisor_id,
                status: 'draft'
            })
            .select()
            .single()

        if (formError) throw formError

        // 2. Create Outputs
        if (data.outputs.length > 0) {
            const outputsToInsert = data.outputs.map((o, index) => ({
                ...o,
                ipcr_form_id: form.id,
                sort_order: index
            }))

            const { error: outputsError } = await supabase
                .from('ipcr_outputs')
                .insert(outputsToInsert)

            if (outputsError) throw outputsError
        }

        await logActivity('CREATE_IPCR', 'ipcr_forms', form.id, { employee: profile.full_name })
        revalidatePath('/dashboard/ipcr')
        return { data: form, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function updateIPCRForm(
    id: string,
    data: Partial<IPCRFormInput>
) {
    try {
        const { profile } = await getAuthenticatedUser()
        const supabase = await createClient()

        // Check status first
        const { data: existing } = await supabase
            .from('ipcr_forms')
            .select('status, employee_id')
            .eq('id', id)
            .single()

        if (!existing) throw new Error('IPCR not found')
        if (existing.status !== 'draft' && existing.status !== 'returned' && profile.role !== 'admin_staff') {
            throw new Error('Only drafts or returned IPCRs can be updated')
        }

        // Update form
        const { error: formError } = await supabase
            .from('ipcr_forms')
            .update({
                immediate_supervisor_id: data.immediate_supervisor_id,
                comments_recommendations: data.comments,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (formError) throw formError

        // Sync outputs if provided
        if (data.outputs) {
            // Simple strategy: delete existing and re-insert
            await supabase.from('ipcr_outputs').delete().eq('ipcr_form_id', id)

            const outputsToInsert = data.outputs.map((o, index) => ({
                ...o,
                ipcr_form_id: id,
                sort_order: index
            }))

            const { error: outputsError } = await supabase
                .from('ipcr_outputs')
                .insert(outputsToInsert)

            if (outputsError) throw outputsError
        }

        await logActivity('UPDATE_IPCR', 'ipcr_forms', id)
        revalidatePath('/dashboard/ipcr')
        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function submitIPCRForm(id: string) {
    try {
        const { profile } = await getAuthenticatedUser()
        const supabase = await createClient()

        const { error } = await supabase
            .from('ipcr_forms')
            .update({
                status: 'submitted',
                submitted_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('employee_id', profile.id)

        if (error) throw error

        await logActivity('SUBMIT_IPCR', 'ipcr_forms', id)
        revalidatePath('/dashboard/ipcr')
        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function reviewIPCRForm(id: string, data: {
    review_remarks: string
    reviewed_by: string
}) {
    try {
        const { profile } = await getAuthenticatedUser()
        if (profile.role !== 'division_chief' && profile.role !== 'admin_staff') {
            throw new Error('Only Division Chiefs can review IPCRs')
        }

        const supabase = await createClient()
        const { error } = await supabase
            .from('ipcr_forms')
            .update({
                status: 'reviewed',
                reviewed_by: data.reviewed_by,
                comments_recommendations: data.review_remarks
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('REVIEW_IPCR', 'ipcr_forms', id, { reviewer: profile.full_name })
        revalidatePath('/dashboard/ipcr')
        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function approveIPCRForm(id: string, data: {
    final_average_rating: number
    adjectival_rating: string
    comments_recommendations: string
    output_ratings: {
        output_id: string
        rating_q: number
        rating_e: number
        rating_t: number
        remarks: string
    }[]
}) {
    try {
        const { profile } = await getAuthenticatedUser()
        if (profile.role !== 'head_of_office' && profile.role !== 'admin_staff') {
            throw new Error('Forbidden')
        }

        const supabase = await createClient()

        // 1. Update Output Ratings
        for (const or of data.output_ratings) {
            const { error: orError } = await supabase
                .from('ipcr_outputs')
                .update({
                    rating_q: or.rating_q,
                    rating_e: or.rating_e,
                    rating_t: or.rating_t,
                    remarks: or.remarks
                })
                .eq('id', or.output_id)

            if (orError) throw orError
        }

        // 2. Update Form Status
        const { error: formError } = await supabase
            .from('ipcr_forms')
            .update({
                status: 'approved',
                approved_by: profile.id,
                approved_at: new Date().toISOString(),
                final_average_rating: data.final_average_rating,
                adjectival_rating: data.adjectival_rating as AdjectivalRating,
                comments_recommendations: data.comments_recommendations
            })
            .eq('id', id)

        if (formError) throw formError

        await logActivity('APPROVE_IPCR', 'ipcr_forms', id, { approver: profile.full_name })
        revalidatePath('/dashboard/ipcr')
        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function returnIPCRForm(id: string, data: {
    return_reason: string
}) {
    try {
        const { profile } = await getAuthenticatedUser()
        const supabase = await createClient()

        const { error } = await supabase
            .from('ipcr_forms')
            .update({
                status: 'returned',
                comments_recommendations: data.return_reason
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('RETURN_IPCR', 'ipcr_forms', id, { reason: data.return_reason })
        revalidatePath('/dashboard/ipcr')
        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function finalizeIPCRForm(id: string) {
    try {
        const { profile } = await getAuthenticatedUser()
        if (profile.role !== 'head_of_office' && profile.role !== 'admin_staff') {
            throw new Error('Forbidden')
        }

        const supabase = await createClient()

        // Fetch IPCR with employee info for notification
        const { data: ipcr } = await supabase
            .from('ipcr_forms')
            .select(`
                *,
                employee:profiles!employee_id(id, full_name, email),
                rating_period:rating_periods(name)
            `)
            .eq('id', id)
            .single()

        const { error } = await supabase
            .from('ipcr_forms')
            .update({
                status: 'finalized',
                finalized_at: new Date().toISOString()
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('FINALIZE_IPCR', 'ipcr_forms', id)
        revalidatePath('/dashboard/ipcr')

        // ── Notification ────────────────────────────────────────────────────
        if (ipcr?.employee) {
            const { title, message } = buildNotificationContent('ipcr.finalized', {
                period: ipcr.rating_period?.name ?? 'current period',
                approver: profile.full_name,
                rating: String(ipcr.final_average_rating ?? ''),
                adjectival: ipcr.adjectival_rating ?? '',
            })
            await notifyUser(
                {
                    recipient_id: ipcr.employee_id,
                    type: 'ipcr.finalized',
                    title,
                    message,
                    entity_type: 'ipcr',
                    entity_id: ipcr.id,
                    action_url: '/dashboard/ipcr',
                },
                ipcr.employee.email ?? '',
                ipcr.employee.full_name ?? ''
            )
        }

        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function deleteIPCRForm(id: string) {
    try {
        const { profile } = await getAuthenticatedUser()
        if (profile.role !== 'admin_staff') throw new Error('Only Admin Staff can delete IPCRs')

        const supabase = await createClient()

        // Check if finalized
        const { data: existing } = await supabase
            .from('ipcr_forms')
            .select('status')
            .eq('id', id)
            .single()

        if (existing?.status === 'finalized') throw new Error('Cannot delete finalized IPCR')

        const { error } = await supabase
            .from('ipcr_forms')
            .delete()
            .eq('id', id)

        if (error) throw error

        await logActivity('DELETE_IPCR', 'ipcr_forms', id)
        revalidatePath('/dashboard/ipcr')
        return { data: true, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function getIPCRSummaryReport(rating_period_id: string) {
    try {
        const supabase = await createClient()

        // 1. Get all forms for period
        const { data: forms, error: formsError } = await supabase
            .from('ipcr_forms')
            .select(`
        *,
        employee:profiles!employee_id(full_name),
        division:divisions(name, code)
      `)
            .eq('rating_period_id', rating_period_id)

        if (formsError) throw formsError

        // 2. Get divisions for breakdown
        const { data: divisions } = await supabase.from('divisions').select('id, name, code')

        const summary = {
            total_staff: forms.length,
            submitted: forms.filter(f => f.status !== 'draft').length,
            pending: forms.filter(f => f.status === 'draft').length,
            average_rating: forms.reduce((acc, f) => acc + (f.final_average_rating || 0), 0) / (forms.filter(f => f.final_average_rating).length || 1),
            division_breakdown: divisions?.map(d => {
                const divForms = forms.filter(f => f.division_id === d.id)
                const divAvg = divForms.reduce((acc, f) => acc + (f.final_average_rating || 0), 0) / (divForms.filter(f => f.final_average_rating).length || 1)
                return {
                    division: d.name,
                    code: d.code,
                    total: divForms.length,
                    submitted: divForms.filter(f => f.status !== 'draft').length,
                    avg_rating: divAvg.toFixed(2),
                    adjectival: getAdjectivalRating(divAvg)
                }
            }) || [],
            individual_ratings: forms.map(f => ({
                staff: f.employee.full_name,
                division: f.division.code,
                rating: f.final_average_rating,
                adjectival: f.adjectival_rating,
                status: f.status
            })).sort((a, b) => (b.rating || 0) - (a.rating || 0))
        }

        return { data: summary, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

function getAdjectivalRating(rating: number): string {
    if (rating >= 4.5) return 'Outstanding'
    if (rating >= 3.5) return 'Very Satisfactory'
    if (rating >= 2.5) return 'Satisfactory'
    if (rating >= 1.5) return 'Unsatisfactory'
    return rating > 0 ? 'Poor' : 'N/A'
}

// ── LEGACY TARGET ACTIONS (used by ipcr-client.tsx) ──────────────────────────

export async function addTarget(
    commitmentId: string,
    data: { mfo_category: string; output: string; indicators: string }
) {
    try {
        const supabase = await createClient()
        const { data: target, error } = await supabase
            .from('spms_targets')
            .insert({
                commitment_id: commitmentId,
                mfo_category: data.mfo_category,
                output: data.output,
                indicators: data.indicators,
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/dashboard/ipcr')
        return { success: true, data: target }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function updateTarget(
    targetId: string,
    data: { output?: string; indicators?: string }
) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('spms_targets')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', targetId)

        if (error) throw error

        revalidatePath('/dashboard/ipcr')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function deleteTarget(targetId: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('spms_targets')
            .delete()
            .eq('id', targetId)

        if (error) throw error

        revalidatePath('/dashboard/ipcr')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function submitIPCR(commitmentId: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('ipcr_commitments')
            .update({ status: 'pending_approval', updated_at: new Date().toISOString() })
            .eq('id', commitmentId)

        if (error) throw error

        revalidatePath('/dashboard/ipcr')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function cancelSubmission(commitmentId: string) {
    try {
        const supabase = await createClient()
        const { error } = await supabase
            .from('ipcr_commitments')
            .update({ status: 'draft', updated_at: new Date().toISOString() })
            .eq('id', commitmentId)

        if (error) throw error

        revalidatePath('/dashboard/ipcr')
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
