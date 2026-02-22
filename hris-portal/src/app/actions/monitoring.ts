'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'
import { isHRManager, isDivisionChief, Role } from '@/lib/roles'

type GetMonitoringFilter = {
    divisionChiefId?: string
    employeeId?: string
    cycleId?: string
    quarter?: number
}

export async function getMonitoringJournals(filter: GetMonitoringFilter = {}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role, division').eq('id', user.id).single()
        if (!profile) throw new Error('Profile not found')

        const role = profile.role as Role

        let query = supabase
            .from('monitoring_journals')
            .select(`
        *,
        employee:profiles!monitoring_journals_employee_id_fkey(full_name, division),
        division_chief:profiles!monitoring_journals_division_chief_id_fkey(full_name),
        noted_by_profile:profiles!monitoring_journals_noted_by_fkey(full_name),
        spms_cycles:spms_cycles(name, is_active)
      `)
            .order('created_at', { ascending: false })

        if (isHRManager(role)) {
            // HR sees all
        } else if (isDivisionChief(role)) {
            query = query.eq('division_chief_id', user.id)
        } else {
            query = query.eq('employee_id', user.id)
        }

        if (filter.employeeId) {
            query = query.eq('employee_id', filter.employeeId)
        }
        if (filter.cycleId) {
            query = query.eq('spms_cycle_id', filter.cycleId)
        }
        if (filter.quarter) {
            query = query.eq('quarter', filter.quarter)
        }

        const { data, error } = await query
        if (error) throw error

        return { success: true, data: data }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

type CreateJournalInput = {
    employee_id: string
    spms_cycle_id: string
    quarter: 1 | 2 | 3 | 4
    monitoring_mechanism: 'One-on-One' | 'Group Meeting' | 'Memo' | 'Others'
    coaching_notes?: string
    date_conducted: string
    noted_by?: string
}

export async function createMonitoringJournal(input: CreateJournalInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role, division').eq('id', user.id).single()
        if (!profile) throw new Error('Profile not found')

        const role = profile.role as Role
        if (!isHRManager(role) && !isDivisionChief(role)) throw new Error('Forbidden')

        if (isDivisionChief(role)) {
            const { data: targetProfile } = await supabase.from('profiles').select('division').eq('id', input.employee_id).single()
            if (targetProfile?.division !== profile.division) throw new Error('Cannot monitor an employee outside your division')
        }

        const { data, error } = await supabase
            .from('monitoring_journals')
            .insert({
                division_chief_id: user.id,
                employee_id: input.employee_id,
                spms_cycle_id: input.spms_cycle_id,
                quarter: input.quarter,
                monitoring_mechanism: input.monitoring_mechanism,
                coaching_notes: input.coaching_notes || null,
                date_conducted: input.date_conducted,
                noted_by: input.noted_by || null
            })
            .select('id')
            .single()

        if (error) throw error

        await logActivity('monitoring.created', 'monitoring_journals', data.id, {})
        revalidatePath('/dashboard/monitoring')

        return { success: true, id: data.id }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function updateMonitoringJournal(id: string, input: Partial<CreateJournalInput>) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: form } = await supabase.from('monitoring_journals').select('division_chief_id').eq('id', id).single()
        if (!form) throw new Error('Journal not found')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!isHRManager(profile?.role as Role) && user.id !== form.division_chief_id) throw new Error('Forbidden')

        const { error } = await supabase
            .from('monitoring_journals')
            .update({
                quarter: input.quarter,
                monitoring_mechanism: input.monitoring_mechanism,
                coaching_notes: input.coaching_notes,
                date_conducted: input.date_conducted,
                noted_by: input.noted_by
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('monitoring.updated', 'monitoring_journals', id, {})
        revalidatePath('/dashboard/monitoring')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function deleteMonitoringJournal(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: form } = await supabase.from('monitoring_journals').select('division_chief_id').eq('id', id).single()
        if (!form) throw new Error('Journal not found')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!isHRManager(profile?.role as Role) && user.id !== form.division_chief_id) throw new Error('Forbidden')

        const { error } = await supabase.from('monitoring_journals').delete().eq('id', id)
        if (error) throw error

        await logActivity('monitoring.deleted', 'monitoring_journals', id, {})
        revalidatePath('/dashboard/monitoring')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}
