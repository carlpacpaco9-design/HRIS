'use server'

import { createClient } from '@/utils/supabase/server'
import { Role, isHRManager } from '@/lib/roles'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'

export async function getAuditLogs(filter: string = 'all', page: number = 1) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Unauthorized')

        const limit = 20
        const start = (page - 1) * limit
        const end = start + limit - 1

        let query = supabase.from('audit_logs').select('*, profiles!audit_logs_user_id_fkey(full_name)', { count: 'exact' })

        if (filter !== 'all') {
            query = query.ilike('action_type', `%${filter}%`)
        }

        const { data, count, error } = await query.order('created_at', { ascending: false }).range(start, end)

        if (error) throw error

        return { success: true, data, count: count || 0 }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function initializeLeaveBalances(year: number) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Unauthorized')

        // 1. Get all active active staff
        const { data: staff, error: staffError } = await supabase.from('profiles').select('id').eq('is_active', true)
        if (staffError) throw staffError

        if (!staff || staff.length === 0) return { success: true, message: 'No active staff found' }

        // 2. Iterate and insert ONLY if balance for that year doesn't exist already
        let createdCount = 0

        for (const emp of staff) {
            const { data: existing } = await supabase.from('leave_balances')
                .select('id')
                .eq('employee_id', emp.id)
                .eq('year', year)
                .single()

            if (!existing) {
                const { error: insertError } = await supabase.from('leave_balances').insert({
                    employee_id: emp.id,
                    year: year,
                    vacation_leave_total: 15,
                    sick_leave_total: 15,
                    special_leave_total: 3,
                    emergency_leave_total: 3
                })
                if (!insertError) createdCount++
            }
        }

        await logActivity('INIT', 'System', year.toString(), { details: `Generated default leave balances for ${createdCount} employees for year ${year}` })

        revalidatePath('/dashboard/admin/settings')
        return { success: true, createdCount }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}
