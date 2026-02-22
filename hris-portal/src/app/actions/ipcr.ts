'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'
import { isHRManager, isDivisionChief, Role } from '@/lib/roles'

export type IPCRForm = {
    id: string
    employee_id: string
    spms_cycle_id: string
    immediate_supervisor_id: string | null
    status: 'draft' | 'submitted' | 'reviewed' | 'finalized' | 'returned'
    final_average_rating: number | null
    adjectival_rating: string | null
    review_comments: string | null
    final_remarks: string | null
    submitted_at: string | null
    reviewed_at: string | null
    finalized_at: string | null
    created_at: string
    updated_at: string
    profiles?: {
        full_name: string
        division: string
        position?: string
    }
    spms_cycles?: {
        start_date: string
        end_date: string
        is_active: boolean
    }
    immediate_supervisor?: {
        full_name: string
    }
}

export type IPCROutput = {
    id: string
    ipcr_form_id: string
    category: 'Core Function' | 'Support Function'
    output_order: number
    major_final_output: string
    success_indicator_target: string | null
    success_indicator_measure: string | null
    actual_accomplishments: string | null
    rating_quantity: number | null
    rating_efficiency: number | null
    rating_timeliness: number | null
    rating_average: number | null
    remarks: string | null
    created_at: string
}

type GetIPCRFilter = {
    employeeId?: string
    cycleId?: string
    status?: string
}

// 1. getIPCRForms
export async function getIPCRForms(filter: GetIPCRFilter = {}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, division')
            .eq('id', user.id)
            .single()

        if (!profile) throw new Error('Profile not found')

        const role = profile.role as Role

        let query = supabase
            .from('ipcr_forms')
            .select(`
        *,
        profiles!ipcr_forms_employee_id_fkey(full_name, division),
        spms_cycles(start_date, end_date, is_active)
      `)
            .order('created_at', { ascending: false })

        if (filter.employeeId) {
            let allowed = false
            if (user.id === filter.employeeId) {
                allowed = true
            } else if (isHRManager(role)) {
                allowed = true
            } else if (isDivisionChief(role)) {
                const { data: targetProfile } = await supabase.from('profiles').select('division').eq('id', filter.employeeId).single()
                if (targetProfile && targetProfile.division === profile.division) allowed = true
            }
            if (!allowed) throw new Error('Forbidden')

            query = query.eq('employee_id', filter.employeeId)
        } else {
            if (isHRManager(role)) {
                // all
            } else if (isDivisionChief(role)) {
                query = supabase
                    .from('ipcr_forms')
                    .select(`
            *,
            profiles!inner(full_name, division),
            spms_cycles(start_date, end_date, is_active)
          `)
                    .eq('profiles.division', profile.division)
                    .order('created_at', { ascending: false })
            } else {
                query = query.eq('employee_id', user.id)
            }
        }

        if (filter.cycleId) {
            query = query.eq('spms_cycle_id', filter.cycleId)
        }

        if (filter.status && filter.status !== 'all') {
            query = query.eq('status', filter.status)
        }

        const { data, error } = await query
        if (error) throw error

        // Also get output counts for each efficiently or return as is and count later.
        // Given the schema and Supabase limitations, output count isn't retrieved directly in the join easily.
        // We will augment the results with an output count via a separate query if needed, or by joining.
        // For simplicity, let's fetch output counts.
        const formIds = data.map(d => d.id)
        let outputCounts: Record<string, number> = {}
        if (formIds.length > 0) {
            const { data: counts } = await supabase.from('ipcr_outputs').select('ipcr_form_id').in('ipcr_form_id', formIds)
            if (counts) {
                counts.forEach(c => {
                    outputCounts[c.ipcr_form_id] = (outputCounts[c.ipcr_form_id] || 0) + 1
                })
            }
        }

        const mappedData = data.map(d => ({
            ...d,
            output_count: outputCounts[d.id] || 0
        }))

        return { success: true, data: mappedData as any[] } // Type augmented
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 2. getIPCRById
export async function getIPCRById(ipcr_id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role, division').eq('id', user.id).single()
        if (!profile) throw new Error('Profile not found')

        const { data: form, error: formErr } = await supabase
            .from('ipcr_forms')
            .select(`
        *,
        profiles!ipcr_forms_employee_id_fkey(full_name, division, position),
        spms_cycles(start_date, end_date, is_active),
        immediate_supervisor:profiles!ipcr_forms_immediate_supervisor_id_fkey(full_name)
      `)
            .eq('id', ipcr_id)
            .single()

        if (formErr || !form) throw new Error('IPCR not found')

        let allowed = false
        const role = profile.role as Role
        if (user.id === form.employee_id) allowed = true
        else if (isHRManager(role)) allowed = true
        else if (isDivisionChief(role) && form.profiles.division === profile.division) allowed = true

        if (!allowed) throw new Error('Forbidden')

        const { data: outputs, error: outErr } = await supabase
            .from('ipcr_outputs')
            .select('*')
            .eq('ipcr_form_id', ipcr_id)
            .order('output_order', { ascending: true })

        if (outErr) throw outErr

        // Sort by category order
        const catOrder: Record<string, number> = { 'Core Function': 1, 'Support Function': 2 }
        outputs.sort((a, b) => (catOrder[a.category] || 99) - (catOrder[b.category] || 99) || a.output_order - b.output_order)

        return { success: true, form: form as IPCRForm, outputs: outputs as IPCROutput[] }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 3. createIPCR
type CreateIPCRInput = {
    spms_cycle_id: string
    immediate_supervisor_id?: string
}

export async function createIPCR(input: CreateIPCRInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        // Verify cycle is active
        const { data: cycle } = await supabase.from('spms_cycles').select('is_active').eq('id', input.spms_cycle_id).single()
        if (!cycle || !cycle.is_active) throw new Error('No active SPMS cycle found or selected cycle is not active')

        // Check duplicate
        const { data: existing } = await supabase
            .from('ipcr_forms')
            .select('id')
            .eq('employee_id', user.id)
            .eq('spms_cycle_id', input.spms_cycle_id)
            .single()

        if (existing) {
            return { success: false, duplicateId: existing.id, error: 'You already have an IPCR for this period. Would you like to edit it?' }
        }

        const { data: newForm, error } = await supabase
            .from('ipcr_forms')
            .insert({
                employee_id: user.id,
                spms_cycle_id: input.spms_cycle_id,
                status: 'draft',
                immediate_supervisor_id: input.immediate_supervisor_id || null
            })
            .select('id')
            .single()

        if (error) throw error

        await logActivity('ipcr.created', 'ipcr_forms', newForm.id, {})
        revalidatePath('/dashboard/ipcr')

        return { success: true, ipcr_id: newForm.id }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 4. saveIPCROutputs
type SaveOutputsInput = {
    ipcr_form_id: string
    outputs: Array<{
        id?: string
        category: string
        output_order: number
        major_final_output: string
        success_indicator_target?: string
        success_indicator_measure?: string
        actual_accomplishments?: string
        remarks?: string
    }>
}

export async function saveIPCROutputs(input: SaveOutputsInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: form } = await supabase.from('ipcr_forms').select('employee_id, status').eq('id', input.ipcr_form_id).single()
        if (!form) throw new Error('Form not found')

        if (user.id !== form.employee_id) throw new Error('Forbidden')
        if (form.status !== 'draft' && form.status !== 'returned') throw new Error('Cannot edit submitted or finalized IPCR')

        const validCategories = ['Core Function', 'Support Function']
        for (const output of input.outputs) {
            if (!validCategories.includes(output.category)) {
                return { success: false, error: 'Invalid category' }
            }
        }

        // Handle UPSERT inside a loop or mass upsert
        const upsertData = input.outputs.map(o => ({
            id: o.id || undefined, // undefined prevents sending to supabase, triggering default gen_random_uuid()
            ipcr_form_id: input.ipcr_form_id,
            category: o.category,
            output_order: o.output_order,
            major_final_output: o.major_final_output,
            success_indicator_target: o.success_indicator_target || null,
            success_indicator_measure: o.success_indicator_measure || null,
            actual_accomplishments: o.actual_accomplishments || null,
            remarks: o.remarks || null
        }))

        // Upsert the provided outputs
        for (const data of upsertData) {
            if (data.id) {
                const { error } = await supabase.from('ipcr_outputs').update(data).eq('id', data.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('ipcr_outputs').insert(data)
                if (error) throw error
            }
        }

        // Delete outputs that were removed
        const providedIds = input.outputs.filter(o => o.id).map(o => o.id)
        let deleteQuery = supabase.from('ipcr_outputs').delete().eq('ipcr_form_id', input.ipcr_form_id)
        if (providedIds.length > 0) {
            deleteQuery = deleteQuery.not('id', 'in', `(${providedIds.join(',')})`)
        }
        const { error: delErr } = await deleteQuery

        if (delErr) throw delErr

        await logActivity('ipcr.outputs_saved', 'ipcr_forms', input.ipcr_form_id, {})
        revalidatePath(`/dashboard/ipcr/${input.ipcr_form_id}`)

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 5. submitIPCR
export async function submitIPCR(ipcr_form_id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: form } = await supabase.from('ipcr_forms').select('employee_id, status').eq('id', ipcr_form_id).single()
        if (!form) throw new Error('Form not found')
        if (user.id !== form.employee_id) throw new Error('Forbidden')
        if (form.status !== 'draft' && form.status !== 'returned') throw new Error('Only draft or returned IPCRs can be submitted')

        const { count } = await supabase.from('ipcr_outputs').select('*', { count: 'exact', head: true }).eq('ipcr_form_id', ipcr_form_id)
        if (!count || count === 0) throw new Error('Add at least one output before submitting.')

        const { error } = await supabase.from('ipcr_forms').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', ipcr_form_id)
        if (error) throw error

        await logActivity('ipcr.submitted', 'ipcr_forms', ipcr_form_id, {})
        revalidatePath(`/dashboard/ipcr/${ipcr_form_id}`)
        revalidatePath('/dashboard/ipcr')
        revalidatePath('/dashboard/approvals')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 6. reviewIPCR
export async function reviewIPCR(ipcr_form_id: string, review_comments?: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role, division').eq('id', user.id).single()
        if (!profile) throw new Error('Profile not found')

        const role = profile.role as Role
        if (!isDivisionChief(role) && !isHRManager(role)) throw new Error('Forbidden')

        const { data: form } = await supabase.from('ipcr_forms').select('status, profiles!ipcr_forms_employee_id_fkey(division)').eq('id', ipcr_form_id).single()
        if (!form) throw new Error('Form not found')

        if (isDivisionChief(role) && (form.profiles as any)?.division !== profile.division) throw new Error('Forbidden')
        if (form.status !== 'submitted') throw new Error('Only submitted IPCRs can be reviewed')

        const { error } = await supabase.from('ipcr_forms').update({
            status: 'reviewed',
            review_comments: review_comments || null,
            reviewed_at: new Date().toISOString()
        }).eq('id', ipcr_form_id)

        if (error) throw error

        await logActivity('ipcr.reviewed', 'ipcr_forms', ipcr_form_id, {})
        revalidatePath(`/dashboard/ipcr/${ipcr_form_id}`)
        revalidatePath('/dashboard/ipcr')
        revalidatePath('/dashboard/approvals')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 7. finalizeIPCR
export async function finalizeIPCR(ipcr_form_id: string, ratings: Array<{
    output_id: string
    rating_quantity: number
    rating_efficiency: number
    rating_timeliness: number
}>, final_remarks?: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        const { data: form } = await supabase.from('ipcr_forms').select('status').eq('id', ipcr_form_id).single()
        if (!form) throw new Error('Form not found')
        if (form.status !== 'reviewed') throw new Error('Only reviewed IPCRs can be finalized')
        if (ratings.length === 0) throw new Error('No ratings provided')

        let sumAverage = 0

        for (const r of ratings) {
            const avg = Number(((r.rating_quantity + r.rating_efficiency + r.rating_timeliness) / 3).toFixed(2))
            sumAverage += avg

            const { error } = await supabase.from('ipcr_outputs').update({
                rating_quantity: r.rating_quantity,
                rating_efficiency: r.rating_efficiency,
                rating_timeliness: r.rating_timeliness,
                rating_average: avg
            }).eq('id', r.output_id)

            if (error) throw error
        }

        const finalAvg = Number((sumAverage / ratings.length).toFixed(3))
        let adjectival = 'Poor'
        if (finalAvg === 5.0) adjectival = 'Outstanding'
        else if (finalAvg >= 4.0) adjectival = 'Very Satisfactory'
        else if (finalAvg >= 3.0) adjectival = 'Satisfactory'
        else if (finalAvg >= 2.0) adjectival = 'Unsatisfactory'

        const { error } = await supabase.from('ipcr_forms').update({
            status: 'finalized',
            final_average_rating: finalAvg,
            adjectival_rating: adjectival,
            final_remarks: final_remarks || null,
            finalized_at: new Date().toISOString()
        }).eq('id', ipcr_form_id)

        if (error) throw error

        await logActivity('ipcr.finalized', 'ipcr_forms', ipcr_form_id, { finalAvg, adjectival })
        revalidatePath(`/dashboard/ipcr/${ipcr_form_id}`)
        revalidatePath('/dashboard/ipcr')
        revalidatePath('/dashboard/approvals')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 8. returnIPCR
export async function returnIPCR(ipcr_form_id: string, remarks: string) {
    try {
        if (!remarks) throw new Error('Remarks required for returning IPCR')

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        const { data: form } = await supabase.from('ipcr_forms').select('status').eq('id', ipcr_form_id).single()
        if (!form) throw new Error('Form not found')
        if (form.status !== 'reviewed') throw new Error('Only reviewed IPCRs can be returned')

        const { error } = await supabase.from('ipcr_forms').update({
            status: 'returned',
            final_remarks: remarks
        }).eq('id', ipcr_form_id)

        if (error) throw error

        await logActivity('ipcr.returned', 'ipcr_forms', ipcr_form_id, { remarks })
        revalidatePath(`/dashboard/ipcr/${ipcr_form_id}`)
        revalidatePath('/dashboard/ipcr')
        revalidatePath('/dashboard/approvals')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}
