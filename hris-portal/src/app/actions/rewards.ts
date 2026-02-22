'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'
import { isHRManager, isDivisionChief, Role } from '@/lib/roles'

export async function getAwards(filter: { employeeId?: string } = {}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role, division').eq('id', user.id).single()
        if (!profile) throw new Error('Profile not found')

        const role = profile.role as Role

        let query = supabase
            .from('awards')
            .select(`
        *,
        employee:profiles!awards_employee_id_fkey(full_name, division),
        given_by_profile:profiles!awards_given_by_fkey(full_name),
        ipcr:ipcr_forms(spms_cycles(name), final_average_rating, adjectival_rating)
      `)
            .order('created_at', { ascending: false })

        if (isHRManager(role)) {
            // HR sees all
        } else if (isDivisionChief(role)) {
            query = query.eq('employee.division', profile.division)
        } else {
            query = query.eq('employee_id', user.id)
        }

        if (filter.employeeId) {
            query = query.eq('employee_id', filter.employeeId)
        }

        const { data, error } = await query
        if (error) throw error

        return { success: true, data: data }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

type CreateAwardInput = {
    employee_id: string
    award_type: string
    award_period: string
    basis_ipcr_id?: string
    given_at: string
    remarks?: string
}

export async function createAward(input: CreateAwardInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        const { data, error } = await supabase
            .from('awards')
            .insert({
                employee_id: input.employee_id,
                award_type: input.award_type,
                award_period: input.award_period,
                basis_ipcr_id: input.basis_ipcr_id || null,
                given_by: user.id,
                given_at: input.given_at || null,
                remarks: input.remarks || null
            })
            .select('id')
            .single()

        if (error) throw error

        await logActivity('award.created', 'awards', data.id, {})
        revalidatePath('/dashboard/rewards')

        return { success: true, id: data.id }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function deleteAward(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        const { error } = await supabase.from('awards').delete().eq('id', id)
        if (error) throw error

        await logActivity('award.deleted', 'awards', id, {})
        revalidatePath('/dashboard/rewards')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}
