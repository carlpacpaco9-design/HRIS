'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/audit-logger"
import { format, endOfMonth as dfEndOfMonth } from "date-fns"
import { getDTRPermissions } from "@/lib/dtr-permissions"

export type PunchType = 'am_in' | 'am_out' | 'pm_in' | 'pm_out'

// Helper to check permission
async function checkDTRPermission(action: 'log' | 'edit' | 'delete') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const permissions = getDTRPermissions(profile?.role ?? 'project_staff')

    if (action === 'log' && !permissions.canLogTime) return { error: 'Forbidden' }
    if (action === 'edit' && !permissions.canEditEntry) return { error: 'Forbidden' }
    if (action === 'delete' && !permissions.canDeleteEntry) return { error: 'Forbidden' }

    return { user }
}

export async function punchClock(
    type: PunchType,
    lat?: number,
    lng?: number
) {
    const perm = await checkDTRPermission('log')
    if (perm.error || !perm.user) return { error: perm.error || "Unauthorized" }

    const user = perm.user
    const supabase = await createClient()

    const today = format(new Date(), 'yyyy-MM-dd')
    const nowTime = format(new Date(), 'HH:mm:ss')

    // Map PunchType to DB Column
    const fieldMap: Record<string, string> = {
        'am_in': 'am_arrival',
        'am_out': 'am_departure',
        'pm_in': 'pm_arrival',
        'pm_out': 'pm_departure'
    }
    const dbType = fieldMap[type]

    // 1. Check if record exists for today
    const { data: existingLog, error: fetchError } = await supabase
        .from('dtr_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
        return { error: "Failed to verify existing logs: " + fetchError.message }
    }

    // 2. Validation: Prevent overwriting
    if (existingLog && existingLog[dbType]) {
        return { error: `You have already logged your ${type.replace('_', ' ').toUpperCase()} today.` }
    }

    let resultError = null

    if (!existingLog) {
        const { error: insertError } = await supabase
            .from('dtr_records')
            .insert({
                user_id: user.id,
                date: today,
                [dbType]: nowTime,
                location_lat: lat || null,
                location_long: lng || null
            })
        resultError = insertError
    } else {
        const { error: updateError } = await supabase
            .from('dtr_records')
            .update({
                [dbType]: nowTime,
                location_lat: lat || existingLog.location_lat,
                location_long: lng || existingLog.location_long
            })
            .eq('id', existingLog.id)
        resultError = updateError
    }

    if (resultError) {
        await logActivity('DTR_PUNCH_FAILED', 'DTR', today, { type, error: resultError.message })
        return { error: "Punch failed: " + resultError.message }
    }

    await logActivity('DTR_PUNCH_SUCCESS', 'DTR', today, { type, time: nowTime, lat, lng })

    revalidatePath('/dashboard/dtr')
    return { success: true, time: nowTime }
}

export async function logDTREntry(data: any) {
    return adminLogDTR(data)
}

export async function adminLogDTR(data: {
    staff_id: string;
    date: string;
    am_arrival?: string | null;
    am_departure?: string | null;
    pm_arrival?: string | null;
    pm_departure?: string | null;
    remarks?: string;
}) {
    const perm = await checkDTRPermission('log')
    if (perm.error) return { error: perm.error }

    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('dtr_records')
            .upsert({
                user_id: data.staff_id,
                date: data.date,
                am_arrival: data.am_arrival || null,
                am_departure: data.am_departure || null,
                pm_arrival: data.pm_arrival || null,
                pm_departure: data.pm_departure || null,
                remarks: data.remarks || null,
                status: 'Present'
            }, {
                onConflict: 'user_id,date'
            })

        if (error) throw error

        await logActivity('DTR_ADMIN_LOG', 'DTR', data.date, {
            targetStaffId: data.staff_id,
            action: 'log/upsert'
        })

        revalidatePath('/dashboard/dtr')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

export async function updateDTREntry(id: string, data: any) {
    const perm = await checkDTRPermission('edit')
    if (perm.error) return { error: perm.error }

    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('dtr_records')
            .update(data)
            .eq('id', id)

        if (error) throw error

        await logActivity('DTR_UPDATE', 'DTR', id, { data })
        revalidatePath('/dashboard/dtr')
        return { success: true }

    } catch (err: any) {
        return { error: err.message }
    }
}

export async function deleteDTREntry(id: string) {
    const perm = await checkDTRPermission('delete')
    if (perm.error) return { error: perm.error }

    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('dtr_records')
            .delete()
            .eq('id', id)

        if (error) throw error

        await logActivity('DTR_DELETE', 'DTR', id, {})
        revalidatePath('/dashboard/dtr')
        return { success: true }

    } catch (err: any) {
        return { error: err.message }
    }
}

export async function getTodayLog() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const today = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase
        .from('dtr_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

    if (!data) return null
    return {
        ...data,
        am_in: data.am_arrival,
        am_out: data.am_departure,
        pm_in: data.pm_arrival,
        pm_out: data.pm_departure
    }
}

export async function getMonthHistory() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const startOfMonth = format(new Date(), 'yyyy-MM-01')
    const endOfMonth = format(new Date(), 'yyyy-MM-dd')

    const { data, error } = await supabase
        .from('dtr_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: false })

    if (error) return []
    return data.map((d: any) => ({
        ...d,
        log_date: d.date,
        am_in: d.am_arrival,
        am_out: d.am_departure,
        pm_in: d.pm_arrival,
        pm_out: d.pm_departure
    }))
}

export async function getMonthlyAttendance(year: number, month: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const date = new Date(year, month - 1, 1)
    const startDate = format(date, 'yyyy-MM-01')
    const endDate = format(dfEndOfMonth(date), 'yyyy-MM-dd')

    const { data, error } = await supabase
        .from('dtr_records')
        .select('date, am_arrival, am_departure, pm_arrival, pm_departure')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)

    if (error) {
        console.error('Error fetching monthly attendance:', error)
        return []
    }

    return data
}


export async function submitCorrectionRequest(data: { date: string, reason: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    await new Promise(resolve => setTimeout(resolve, 800))
    console.log(`[Mock Submission] User ${user.email} requested correction for ${data.date}: ${data.reason}`)

    return { success: true }
}

export async function searchStaff(query: string) {
    const supabase = await createClient()

    if (!query || query.length < 2) return []

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, email')
        .ilike('full_name', `%${query}%`)
        .limit(5)

    if (error) return []

    return data || []
}
