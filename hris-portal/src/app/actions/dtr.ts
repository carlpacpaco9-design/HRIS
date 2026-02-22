'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateUndertime } from '@/lib/dtr-utils'
import { logActivity } from '@/lib/audit-logger'
import { isHRManager, isDivisionChief, Role } from '@/lib/roles'
import { Division } from '@/lib/office-structure'

export type CreateDTRInput = {
    employee_id: string
    log_date: string       // YYYY-MM-DD
    am_arrival?: string    // HH:MM
    am_departure?: string
    pm_arrival?: string
    pm_departure?: string
    remarks?: string
}

export type DTRLog = {
    id: string
    employee_id: string
    log_date: string
    am_arrival: string | null
    am_departure: string | null
    pm_arrival: string | null
    pm_departure: string | null
    undertime_hours: number
    undertime_minutes: number
    remarks: string | null
    encoded_by: string | null
}

export type Profile = {
    id: string
    full_name: string
    position: string
    division: string
    employee_number: string
}

type RosterMap = Record<string, Profile[]>

export async function getDTRByMonth(employeeId: string, month: number, year: number) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        // 1. Verify caller can view this employee's DTR
        const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('role, division')
            .eq('id', user.id)
            .single()

        if (!currentUserProfile) throw new Error('Profile not found')

        let allowed = false
        const role = currentUserProfile.role as Role

        if (user.id === employeeId) {
            allowed = true
        } else if (isHRManager(role)) {
            allowed = true
        } else if (isDivisionChief(role)) {
            const { data: targetProfile } = await supabase
                .from('profiles')
                .select('division')
                .eq('id', employeeId)
                .single()
            if (targetProfile && targetProfile.division === currentUserProfile.division) {
                allowed = true
            }
        }

        if (!allowed) throw new Error('Forbidden')

        // 2. Query dtr_logs
        const paddedMonth = month.toString().padStart(2, '0')
        const startOfMonth = `${year}-${paddedMonth}-01`
        const nextMonth = month === 12 ? 1 : month + 1
        const nextYear = month === 12 ? year + 1 : year
        const paddedNextMonth = nextMonth.toString().padStart(2, '0')
        const startOfNextMonth = `${nextYear}-${paddedNextMonth}-01`

        const { data, error } = await supabase
            .from('dtr_logs')
            .select('*')
            .eq('employee_id', employeeId)
            .gte('log_date', startOfMonth)
            .lt('log_date', startOfNextMonth)
            .order('log_date', { ascending: true })

        if (error) throw error

        return { success: true, data: data as DTRLog[] }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function getEmployeeRoster() {
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

        const isHr = isHRManager(profile.role as Role)
        const isChief = isDivisionChief(profile.role as Role)

        if (!isHr && !isChief) throw new Error('Forbidden')

        let query = supabase
            .from('profiles')
            .select('id, full_name, position, division, employee_number')
            .eq('is_active', true)
            .order('division', { ascending: true })
            .order('full_name', { ascending: true })

        if (isChief) {
            query = query.eq('division', profile.division)
        }

        const { data, error } = await query

        if (error) throw error

        // Group by division
        const roster: RosterMap = (data as Profile[]).reduce((acc, emp) => {
            if (!acc[emp.division]) acc[emp.division] = []
            acc[emp.division]!.push(emp)
            return acc
        }, {} as RosterMap)

        return { success: true, data: roster }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function createDTRLog(input: CreateDTRInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || !isHRManager(profile.role as Role)) {
            throw new Error('Forbidden')
        }

        let undertime = { hours: 0, minutes: 0 }

        // Only calculate undertime if ALL fields are present
        if (input.am_arrival && input.am_departure && input.pm_arrival && input.pm_departure) {
            undertime = calculateUndertime(
                input.am_arrival,
                input.am_departure,
                input.pm_arrival,
                input.pm_departure
            )
        }

        const { data, error } = await supabase
            .from('dtr_logs')
            .insert({
                employee_id: input.employee_id,
                log_date: input.log_date,
                am_arrival: input.am_arrival || null,
                am_departure: input.am_departure || null,
                pm_arrival: input.pm_arrival || null,
                pm_departure: input.pm_departure || null,
                remarks: input.remarks || null,
                undertime_hours: undertime.hours,
                undertime_minutes: undertime.minutes,
                encoded_by: user.id
            })
            .select()
            .single()

        if (error) throw error

        await logActivity('dtr.created', 'dtr_logs', data.id, { entry: input })
        revalidatePath(`/dashboard/dtr/${input.employee_id}`)

        return { success: true, data }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function updateDTRLog(logId: string, updates: Partial<CreateDTRInput>) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || !isHRManager(profile.role as Role)) {
            throw new Error('Forbidden')
        }

        const { data: existing, error: errFetch } = await supabase
            .from('dtr_logs')
            .select('*')
            .eq('id', logId)
            .single()

        if (errFetch || !existing) {
            throw new Error('DTR Log not found')
        }

        const am_arrival = updates.am_arrival !== undefined ? updates.am_arrival : existing.am_arrival
        const am_departure = updates.am_departure !== undefined ? updates.am_departure : existing.am_departure
        const pm_arrival = updates.pm_arrival !== undefined ? updates.pm_arrival : existing.pm_arrival
        const pm_departure = updates.pm_departure !== undefined ? updates.pm_departure : existing.pm_departure

        let undertime = { hours: 0, minutes: 0 }
        if (am_arrival && am_departure && pm_arrival && pm_departure) {
            undertime = calculateUndertime(
                am_arrival,
                am_departure,
                pm_arrival,
                pm_departure
            )
        }

        const { data, error } = await supabase
            .from('dtr_logs')
            .update({
                am_arrival: am_arrival || null,
                am_departure: am_departure || null,
                pm_arrival: pm_arrival || null,
                pm_departure: pm_departure || null,
                remarks: updates.remarks !== undefined ? updates.remarks : existing.remarks,
                undertime_hours: undertime.hours,
                undertime_minutes: undertime.minutes,
                updated_at: new Date().toISOString()
            })
            .eq('id', logId)
            .select()
            .single()

        if (error) throw error

        await logActivity('dtr.updated', 'dtr_logs', logId, { before: existing, after: data })
        revalidatePath(`/dashboard/dtr/${data.employee_id}`)

        return { success: true, data }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function deleteDTRLog(logId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || !isHRManager(profile.role as Role)) {
            throw new Error('Forbidden')
        }

        const { data: existing, error: errFetch } = await supabase
            .from('dtr_logs')
            .select('*')
            .eq('id', logId)
            .single()

        if (errFetch || !existing) {
            throw new Error('DTR Log not found')
        }

        const { error } = await supabase
            .from('dtr_logs')
            .delete()
            .eq('id', logId)

        if (error) throw error

        await logActivity('dtr.deleted', 'dtr_logs', logId, { log: existing })
        revalidatePath(`/dashboard/dtr/${existing.employee_id}`)

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}
