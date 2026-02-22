'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/audit-logger"
import {
    DevelopmentPlan,
    DevelopmentPlanInput,
    DevelopmentPlanStatus,
    DevelopmentPlanTaskInput
} from "@/types/development-plan"
import { buildNotificationContent, notifyUser } from '@/lib/notifications'

/**
 * Helper to get authenticated user and profile
 */
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
    return { user, profile, supabase }
}

// ── QUERIES ──────────────────────────────────────

export async function getDevelopmentPlans(filters?: {
    status?: DevelopmentPlanStatus
    rating_period_id?: string
    division_id?: string
    employee_id?: string
}) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        let query = supabase
            .from('development_plans')
            .select(`
                *,
                employee:profiles!development_plans_employee_id_fkey(full_name, avatar_url, division_id),
                division:divisions(name, code),
                rating_period:rating_periods(name),
                ipcr_form:ipcr_forms(final_average_rating, adjectival_rating, status)
            `)

        // 1. Role-based Visibility
        if (profile.role === 'project_staff') {
            query = query.eq('employee_id', profile.id)
        } else if (profile.role === 'division_chief') {
            query = query.or(`employee_id.eq.${profile.id},division_id.eq.${profile.division_id}`)
        }

        // 2. Apply Filters
        if (filters?.status) query = query.eq('status', filters.status)
        if (filters?.rating_period_id) query = query.eq('rating_period_id', filters.rating_period_id)
        if (filters?.division_id) query = query.eq('division_id', filters.division_id)
        if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id)

        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error

        return { data }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function getDevelopmentPlanById(id: string) {
    try {
        const { supabase } = await getAuthenticatedUser()

        const { data, error } = await supabase
            .from('development_plans')
            .select(`
                *,
                employee:profiles!development_plans_employee_id_fkey(full_name, avatar_url, division_id),
                division:divisions(name, code),
                rating_period:rating_periods(name),
                ipcr_form:ipcr_forms(*),
                created_by_profile:profiles!development_plans_created_by_fkey(full_name, role),
                tasks:development_plan_tasks(*)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return { data }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function getPlansByIPCR(ipcr_form_id: string) {
    try {
        const { supabase } = await getAuthenticatedUser()
        const { data, error } = await supabase
            .from('development_plans')
            .select('*')
            .eq('ipcr_form_id', ipcr_form_id)

        if (error) throw error
        return { data }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function checkPlanExists(employee_id: string, ipcr_form_id: string) {
    const { supabase } = await getAuthenticatedUser()
    const { data } = await supabase
        .from('development_plans')
        .select('id')
        .eq('employee_id', employee_id)
        .eq('ipcr_form_id', ipcr_form_id)
        .maybeSingle()

    return !!data
}

export async function getEligibleIPCRsForPlan(employee_id: string) {
    try {
        const { supabase } = await getAuthenticatedUser()

        // Finalized IPCRs for this staff member
        const { data: forms, error } = await supabase
            .from('ipcr_forms')
            .select(`
                id,
                rating_period_id,
                status,
                final_average_rating,
                adjectival_rating,
                rating_period:rating_periods(name)
            `)
            .eq('employee_id', employee_id)
            .in('status', ['approved', 'finalized'])

        if (error) throw error

        // Filter out those that already have a plan
        const { data: existingPlans } = await supabase
            .from('development_plans')
            .select('ipcr_form_id')
            .eq('employee_id', employee_id)

        const existingIds = (existingPlans || []).map((p: any) => p.ipcr_form_id)
        const eligible = forms.filter((f: any) => !existingIds.includes(f.id))

        return eligible
    } catch (err: any) {
        console.error("Error fetching eligible IPCRs:", err)
        return []
    }
}

export async function getStaffForSelection() {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        let query = supabase
            .from('profiles')
            .select('id, full_name, role, division_id, position_title')
            .order('full_name')

        if (profile.role === 'division_chief') {
            query = query.eq('division_id', profile.division_id)
        }

        const { data, error } = await query
        if (error) throw error
        return { data }
    } catch (err: any) {
        return { error: err.message }
    }
}

// ── MUTATIONS ────────────────────────────────────

export async function createDevelopmentPlan(data: DevelopmentPlanInput) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        if (!['head_of_office', 'division_chief', 'admin_staff'].includes(profile.role)) {
            throw new Error('Only supervisors can create development plans')
        }

        const exists = await checkPlanExists(data.employee_id, data.ipcr_form_id)
        if (exists) throw new Error('A development plan already exists for this IPCR')

        const { data: plan, error: planError } = await supabase
            .from('development_plans')
            .insert({
                employee_id: data.employee_id,
                ipcr_form_id: data.ipcr_form_id,
                rating_period_id: data.rating_period_id,
                created_by: profile.id,
                plan_date: data.plan_date,
                aim: data.aim,
                objective: data.objective,
                target_date: data.target_date,
                review_date: data.review_date,
                comments: data.comments,
                status: 'active'
            })
            .select()
            .single()

        if (planError) throw planError

        if (data.tasks.length > 0) {
            const { error: taskError } = await supabase
                .from('development_plan_tasks')
                .insert(
                    data.tasks.map((t, i) => ({
                        ...t,
                        development_plan_id: plan.id,
                        sort_order: t.sort_order || i
                    }))
                )
            if (taskError) throw taskError
        }

        await logActivity('CREATE_PLAN', 'development_plan', plan.id, { target: data.employee_id })
        revalidatePath('/dashboard/development-plan')

        // ── Notification ────────────────────────────────────────────────────
        const { data: empProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', data.employee_id)
            .single()
        const { data: ratingPeriod } = await supabase
            .from('rating_periods')
            .select('name')
            .eq('id', data.rating_period_id)
            .single()
        if (empProfile) {
            const { title, message } = buildNotificationContent('development_plan.created', {
                creator: profile.full_name,
                period: ratingPeriod?.name ?? 'current period',
                aim: (data.aim ?? '').substring(0, 100),
            })
            await notifyUser(
                {
                    recipient_id: data.employee_id,
                    type: 'development_plan.created',
                    title,
                    message,
                    entity_type: 'development_plan',
                    entity_id: plan.id,
                    action_url: '/dashboard/development-plan',
                },
                empProfile.email ?? '',
                empProfile.full_name ?? ''
            )
        }

        return { data: plan }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function updateDevelopmentPlan(id: string, data: Partial<DevelopmentPlanInput>) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        const { data: current } = await supabase
            .from('development_plans')
            .select('status, employee_id')
            .eq('id', id)
            .single()

        if (!current) throw new Error('Plan not found')
        if (!['active', 'in_progress'].includes(current.status)) {
            throw new Error('Can only update active or in-progress plans')
        }

        const { error } = await supabase
            .from('development_plans')
            .update({
                aim: data.aim,
                objective: data.objective,
                target_date: data.target_date,
                review_date: data.review_date,
                comments: data.comments,
                plan_date: data.plan_date
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('UPDATE_PLAN', 'development_plan', id)
        revalidatePath('/dashboard/development-plan')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function markPlanInProgress(id: string) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()
        const { error } = await supabase
            .from('development_plans')
            .update({ status: 'in_progress' })
            .eq('id', id)

        if (error) throw error
        await logActivity('MARK_IN_PROGRESS', 'development_plan', id)
        revalidatePath('/dashboard/development-plan')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function markPlanAchieved(id: string, achieved_date: string) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        if (!['head_of_office', 'division_chief', 'admin_staff'].includes(profile.role)) {
            throw new Error('Unauthorized')
        }

        const { error } = await supabase
            .from('development_plans')
            .update({
                status: 'achieved',
                achieved_date: achieved_date
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('MARK_ACHIEVED', 'development_plan', id, { achieved_date })
        revalidatePath('/dashboard/development-plan')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function cancelDevelopmentPlan(id: string, reason: string) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        if (!['head_of_office', 'admin_staff'].includes(profile.role)) {
            throw new Error('Only Provincial Assessor or Administrative Staff can cancel plans')
        }

        const { error } = await supabase
            .from('development_plans')
            .update({
                status: 'cancelled',
                comments: `Cancelled: ${reason}`
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('CANCEL_PLAN', 'development_plan', id, { reason })
        revalidatePath('/dashboard/development-plan')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

// ── TASK MUTATIONS ───────────────────────────────

export async function addPlanTask(plan_id: string, data: DevelopmentPlanTaskInput) {
    try {
        const { supabase } = await getAuthenticatedUser()
        const { data: task, error } = await supabase
            .from('development_plan_tasks')
            .insert({
                development_plan_id: plan_id,
                ...data
            })
            .select()
            .single()

        if (error) throw error
        revalidatePath('/dashboard/development-plan')
        return { data: task }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function updatePlanTask(task_id: string, data: Partial<DevelopmentPlanTaskInput>) {
    try {
        const { supabase } = await getAuthenticatedUser()
        const { error } = await supabase
            .from('development_plan_tasks')
            .update(data)
            .eq('id', task_id)

        if (error) throw error
        revalidatePath('/dashboard/development-plan')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function deletePlanTask(task_id: string) {
    try {
        const { supabase } = await getAuthenticatedUser()
        const { error } = await supabase
            .from('development_plan_tasks')
            .delete()
            .eq('id', task_id)

        if (error) throw error
        revalidatePath('/dashboard/development-plan')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}
