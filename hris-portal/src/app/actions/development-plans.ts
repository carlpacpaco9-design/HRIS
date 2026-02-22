'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'
import { isHRManager, isDivisionChief, Role } from '@/lib/roles'

export async function getDevelopmentPlans(filter: { employeeId?: string } = {}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role, division').eq('id', user.id).single()
        if (!profile) throw new Error('Profile not found')

        const role = profile.role as Role

        let query = supabase
            .from('development_plans')
            .select(`
        *,
        employee:profiles!development_plans_employee_id_fkey(full_name, division),
        ipcr:ipcr_forms(spms_cycles(name))
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

type CreateDevPlanInput = {
    employee_id: string
    ipcr_form_id?: string
    aim: string
    objective: string
    tasks: string
    outcome: string
    next_step: string
    target_date?: string
    review_date?: string
}

export async function createDevelopmentPlan(input: CreateDevPlanInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        const { data, error } = await supabase
            .from('development_plans')
            .insert({
                employee_id: input.employee_id,
                ipcr_form_id: input.ipcr_form_id || null,
                aim: input.aim,
                objective: input.objective,
                tasks: input.tasks,
                outcome: input.outcome,
                next_step: input.next_step,
                target_date: input.target_date || null,
                review_date: input.review_date || null,
                status: 'active'
            })
            .select('id')
            .single()

        if (error) throw error

        await logActivity('devplan.created', 'development_plans', data.id, {})
        revalidatePath('/dashboard/development-plan')

        return { success: true, id: data.id }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function updateDevelopmentPlan(id: string, input: Partial<CreateDevPlanInput> & { status?: string, achieved_date?: string }) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        const { error } = await supabase
            .from('development_plans')
            .update({
                aim: input.aim,
                objective: input.objective,
                tasks: input.tasks,
                outcome: input.outcome,
                next_step: input.next_step,
                target_date: input.target_date || null,
                review_date: input.review_date || null,
                status: input.status,
                achieved_date: input.achieved_date || null
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('devplan.updated', 'development_plans', id, {})
        revalidatePath('/dashboard/development-plan')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function markPlanAchieved(id: string, achieved_date: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        const { error } = await supabase
            .from('development_plans')
            .update({
                status: 'achieved',
                achieved_date: achieved_date
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('devplan.achieved', 'development_plans', id, { achieved_date })
        revalidatePath('/dashboard/development-plan')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}
