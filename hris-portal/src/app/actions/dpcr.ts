'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'
import { isHRManager, Role } from '@/lib/roles'

export type DPCRForm = {
    id: string
    spms_cycle_id: string
    status: 'draft' | 'submitted' | 'approved'
    prepared_by: string
    approved_by: string | null
    final_average_rating: number | null
    adjectival_rating: string | null
    final_remarks: string | null
    submitted_at: string | null
    approved_at: string | null
    created_at: string
    updated_at: string
    profiles?: {
        full_name: string
    }
    spms_cycles?: {
        start_date: string
        end_date: string
        is_active: boolean
    }
    approver?: {
        full_name: string
    }
}

export type DPCROutput = {
    id: string
    dpcr_form_id: string
    category: 'Strategic Priority' | 'Core Function' | 'Support Function'
    output_order: number
    major_final_output: string
    success_indicators: string | null
    allotted_budget: number | null
    division_accountable: string | null
    actual_accomplishments: string | null
    rating_quantity: number | null
    rating_efficiency: number | null
    rating_timeliness: number | null
    rating_average: number | null
    remarks: string | null
}

// 1. getDPCRForms
export async function getDPCRForms(filter: { cycleId?: string, status?: string } = {}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        let query = supabase
            .from('dpcr_forms')
            .select(`
        *,
        profiles!dpcr_forms_prepared_by_fkey(full_name),
        spms_cycles(start_date, end_date, is_active)
      `)
            .order('created_at', { ascending: false })

        if (filter.cycleId) {
            query = query.eq('spms_cycle_id', filter.cycleId)
        }

        if (filter.status && filter.status !== 'all') {
            query = query.eq('status', filter.status)
        }

        const { data, error } = await query
        if (error) throw error

        // Fetch output counts to display in list
        const formIds = data.map(d => d.id)
        let outputCounts: Record<string, number> = {}
        if (formIds.length > 0) {
            const { data: counts } = await supabase.from('dpcr_outputs').select('dpcr_form_id').in('dpcr_form_id', formIds)
            if (counts) {
                counts.forEach(c => {
                    outputCounts[c.dpcr_form_id] = (outputCounts[c.dpcr_form_id] || 0) + 1
                })
            }
        }

        const mappedData = data.map(d => ({
            ...d,
            output_count: outputCounts[d.id] || 0
        }))

        return { success: true, data: mappedData as any[] }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 2. getDPCRById
export async function getDPCRById(dpcr_id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        const { data: form, error: formErr } = await supabase
            .from('dpcr_forms')
            .select(`
        *,
        profiles!dpcr_forms_prepared_by_fkey(full_name, position),
        spms_cycles(start_date, end_date, is_active),
        approver:profiles!dpcr_forms_approved_by_fkey(full_name)
      `)
            .eq('id', dpcr_id)
            .single()

        if (formErr || !form) throw new Error('DPCR not found')

        const { data: outputs, error: outErr } = await supabase
            .from('dpcr_outputs')
            .select('*')
            .eq('dpcr_form_id', dpcr_id)
            .order('output_order', { ascending: true })

        if (outErr) throw outErr

        const catOrder: Record<string, number> = { 'Strategic Priority': 1, 'Core Function': 2, 'Support Function': 3 }
        outputs.sort((a, b) => (catOrder[a.category] || 99) - (catOrder[b.category] || 99) || a.output_order - b.output_order)

        return { success: true, form: form as DPCRForm, outputs: outputs as DPCROutput[] }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 3. createDPCR
export async function createDPCR(input: { spms_cycle_id: string }) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        const { data: existing } = await supabase
            .from('dpcr_forms')
            .select('id')
            .eq('spms_cycle_id', input.spms_cycle_id)
            .single()

        if (existing) {
            return { success: false, duplicateId: existing.id, error: 'An DPCR for this cycle already exists.' }
        }

        const { data: newForm, error } = await supabase
            .from('dpcr_forms')
            .insert({
                spms_cycle_id: input.spms_cycle_id,
                status: 'draft',
                prepared_by: user.id
            })
            .select('id')
            .single()

        if (error) throw error

        await logActivity('dpcr.created', 'dpcr_forms', newForm.id, {})
        revalidatePath('/dashboard/dpcr')

        return { success: true, dpcr_id: newForm.id }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 4. saveDPCROutputs
type SaveDPCROutputsInput = {
    dpcr_form_id: string
    outputs: Array<{
        id?: string
        category: string
        output_order: number
        major_final_output: string
        success_indicators?: string
        allotted_budget?: number
        division_accountable?: string
        actual_accomplishments?: string
        remarks?: string
    }>
}

export async function saveDPCROutputs(input: SaveDPCROutputsInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        const { data: form } = await supabase.from('dpcr_forms').select('status').eq('id', input.dpcr_form_id).single()
        if (!form) throw new Error('Form not found')
        if (form.status === 'approved') throw new Error('Cannot edit approved DPCR')

        const upsertData = input.outputs.map(o => ({
            id: o.id || undefined,
            dpcr_form_id: input.dpcr_form_id,
            category: o.category,
            output_order: o.output_order,
            major_final_output: o.major_final_output,
            success_indicators: o.success_indicators || null,
            allotted_budget: o.allotted_budget !== undefined ? o.allotted_budget : null,
            division_accountable: o.division_accountable || null,
            actual_accomplishments: o.actual_accomplishments || null,
            remarks: o.remarks || null
        }))

        for (const data of upsertData) {
            if (data.id) {
                const { error } = await supabase.from('dpcr_outputs').update(data).eq('id', data.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('dpcr_outputs').insert(data)
                if (error) throw error
            }
        }

        const providedIds = input.outputs.filter(o => o.id).map(o => o.id)
        let deleteQuery = supabase.from('dpcr_outputs').delete().eq('dpcr_form_id', input.dpcr_form_id)
        if (providedIds.length > 0) {
            deleteQuery = deleteQuery.not('id', 'in', `(${providedIds.join(',')})`)
        }
        const { error: delErr } = await deleteQuery

        if (delErr) throw delErr

        await logActivity('dpcr.outputs_saved', 'dpcr_forms', input.dpcr_form_id, {})
        revalidatePath(`/dashboard/dpcr/${input.dpcr_form_id}`)

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 5. submitDPCR
export async function submitDPCR(dpcr_form_id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        const { data: form } = await supabase.from('dpcr_forms').select('status').eq('id', dpcr_form_id).single()
        if (!form) throw new Error('Form not found')
        if (form.status !== 'draft') throw new Error('Only draft DPCRs can be submitted')

        const { count } = await supabase.from('dpcr_outputs').select('*', { count: 'exact', head: true }).eq('dpcr_form_id', dpcr_form_id)
        if (!count || count === 0) throw new Error('Add at least one output before submitting.')

        const { error } = await supabase.from('dpcr_forms').update({
            status: 'submitted',
            submitted_at: new Date().toISOString()
        }).eq('id', dpcr_form_id)

        if (error) throw error

        await logActivity('dpcr.submitted', 'dpcr_forms', dpcr_form_id, {})
        revalidatePath(`/dashboard/dpcr/${dpcr_form_id}`)
        revalidatePath('/dashboard/dpcr')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 6. approveDPCR
export async function approveDPCR(dpcr_form_id: string, ratings: Array<{
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
        if (!profile) throw new Error('Profile not found')

        // Both head_of_office and admin_staff can approve DPCR
        if (profile.role !== 'head_of_office' && profile.role !== 'admin_staff') {
            throw new Error('Only the Head of Office or Admin Staff can approve the DPCR')
        }

        const { data: form } = await supabase.from('dpcr_forms').select('status').eq('id', dpcr_form_id).single()
        if (!form) throw new Error('Form not found')
        if (form.status !== 'submitted') throw new Error('Only submitted DPCRs can be approved')
        if (ratings.length === 0) throw new Error('No ratings provided')

        let sumAverage = 0

        for (const r of ratings) {
            const avg = Number(((r.rating_quantity + r.rating_efficiency + r.rating_timeliness) / 3).toFixed(2))
            sumAverage += avg

            const { error } = await supabase.from('dpcr_outputs').update({
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

        const { error } = await supabase.from('dpcr_forms').update({
            status: 'approved',
            approved_by: user.id,
            final_average_rating: finalAvg,
            adjectival_rating: adjectival,
            final_remarks: final_remarks || null,
            approved_at: new Date().toISOString()
        }).eq('id', dpcr_form_id)

        if (error) throw error

        await logActivity('dpcr.approved', 'dpcr_forms', dpcr_form_id, { finalAvg, adjectival })
        revalidatePath(`/dashboard/dpcr/${dpcr_form_id}`)
        revalidatePath('/dashboard/dpcr')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}
