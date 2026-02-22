'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { format, endOfMonth, eachDayOfInterval, startOfMonth, parseISO } from "date-fns"
import { formatTime12h } from "@/lib/utils"
import { logActivity } from "@/lib/audit-logger"

export async function getStaffDTR(userId: string, month: number, year: number) {
    const supabase = await createClient()

    // Construct date range
    const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd')
    const endDate = format(endOfMonth(new Date(year, month - 1, 1)), 'yyyy-MM-dd')

    // Fetch logs
    const { data: logs, error } = await supabase
        .from('dtr_records')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)

    if (error) throw new Error(error.message)

    // Create a map for quick lookup
    const logMap = new Map(logs?.map(log => [log.date, log]))

    // Generate all days in month
    const daysInMonth = eachDayOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate)
    })

    // Return structured array
    return daysInMonth.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const log = logMap.get(dateStr)
        return {
            date: dateStr,
            day: format(day, 'd'),
            logs: log ? {
                ...log,
                am_in: formatTime12h(log.am_arrival, false),
                am_out: formatTime12h(log.am_departure, false),
                pm_in: formatTime12h(log.pm_arrival, false),
                pm_out: formatTime12h(log.pm_departure, false)
            } : null
        }
    })
}

export async function upsertDTRLog(userId: string, date: string, field: string, value: string) {
    const supabase = await createClient()
    const { data: { user: adminUser } } = await supabase.auth.getUser()

    if (!adminUser) return { error: "Unauthorized" }

    // Map field names if necessary (e.g. am_in -> am_arrival)
    const fieldMap: Record<string, string> = {
        'am_in': 'am_arrival',
        'am_out': 'am_departure',
        'pm_in': 'pm_arrival',
        'pm_out': 'pm_departure',
        'remarks': 'remarks'
    }

    const dbField = fieldMap[field] || field

    // Check if record exists
    const { data: existing, error: fetchError } = await supabase
        .from('dtr_records')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .single()

    let error = null
    if (existing) {
        const { error: updateError } = await supabase
            .from('dtr_records')
            .update({ [dbField]: value || null })
            .eq('id', existing.id)
        error = updateError
    } else {
        const { error: insertError } = await supabase
            .from('dtr_records')
            .insert({
                user_id: userId,
                date: date,
                [dbField]: value || null
            })
        error = insertError
    }

    if (error) {
        await logActivity('DTR_ADMIN_UPSERT_FAILED', 'DTR', date, { staffId: userId, field, value, error: error.message })
        return { error: error.message }
    }

    await logActivity('DTR_ADMIN_UPSERT_SUCCESS', 'DTR', date, { staffId: userId, field, value })
    return { success: true }
}

export async function getStaffProfile(userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    return data
}
export async function saveSingleDTR(data: {
    staff_id: string;
    date: string;
    time_in: string;
    time_out: string;
    remarks?: string;
}) {
    const supabase = await createClient()
    const { data: { user: adminUser } } = await supabase.auth.getUser()

    if (!adminUser) return { error: "Unauthorized" }

    try {
        const { error } = await supabase
            .from('dtr_records')
            .upsert({
                user_id: data.staff_id,
                date: data.date,
                am_arrival: data.time_in,
                pm_departure: data.time_out,
                remarks: data.remarks || null,
                status: 'Present' // Default status for manual entries
            }, {
                onConflict: 'user_id,date'
            })

        if (error) throw error

        await logActivity('DTR_SINGLE_SAVE', 'DTR', data.date, {
            targetStaffId: data.staff_id,
            timeIn: data.time_in,
            timeOut: data.time_out
        })

        revalidatePath('/dashboard/dtr')
        return { success: true }
    } catch (err: any) {
        console.error("Single DTR save error:", err)
        return { error: err.message }
    }
}
