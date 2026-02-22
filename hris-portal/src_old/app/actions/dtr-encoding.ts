'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { format, endOfMonth, eachDayOfInterval, startOfMonth, parseISO } from "date-fns"
import { logActivity } from "@/lib/audit-logger"
import { formatTime12h } from "@/lib/utils"

export async function getStaffForDTR() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, department')
        .order('full_name', { ascending: true })

    if (error) throw new Error(error.message)
    return data
}

export async function getStaffMonthRecords(userId: string, month: number, year: number) {
    const supabase = await createClient()

    const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd')
    const endDate = format(endOfMonth(new Date(year, month - 1, 1)), 'yyyy-MM-dd')

    const [logsResult, balancesResult] = await Promise.all([
        supabase
            .from('dtr_records')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate),
        supabase
            .from('leave_balances')
            .select('*')
            .eq('user_id', userId)
            .eq('year', year)
            .single()
    ])

    const logs = logsResult.data
    const balances = balancesResult.data
    const error = logsResult.error

    if (error) throw new Error(error.message)

    const logMap = new Map(logs?.map(log => [log.date, log]))
    const daysInMonth = eachDayOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate)
    })

    return {
        records: daysInMonth.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const log = logMap.get(dateStr)
            return {
                date: dateStr,
                day: format(day, 'd'),
                isWeekend: [0, 6].includes(day.getDay()),
                am_in: formatTime12h(log?.am_arrival, false),
                am_out: formatTime12h(log?.am_departure, false),
                pm_in: formatTime12h(log?.pm_arrival, false),
                pm_out: formatTime12h(log?.pm_departure, false),
                status: log?.status || 'Regular',
                remarks: log?.remarks || ''
            }
        }),
        balances: balances || null
    }
}

export async function saveBatchDTR(userId: string, records: any[]) {
    const supabase = await createClient()
    const { data: { user: adminUser } } = await supabase.auth.getUser()

    if (!adminUser) return { error: "Unauthorized" }

    try {
        // Efficient batch upsert
        const upsertData = records.map(reg => ({
            user_id: userId,
            date: reg.date,
            am_arrival: reg.am_in || null,
            am_departure: reg.am_out || null,
            pm_arrival: reg.pm_in || null,
            pm_departure: reg.pm_out || null,
            status: reg.status || 'Regular',
            remarks: reg.remarks || null
        }))

        const { error } = await supabase
            .from('dtr_records')
            .upsert(upsertData, {
                onConflict: 'user_id,date'
            })

        if (error) throw error

        await logActivity('DTR_BATCH_SAVE', 'DTR', userId, { recordCount: records.length })
        revalidatePath('/dashboard/dtr')
        return { success: true }
    } catch (err: any) {
        console.error("Batch save error:", err)
        return { error: err.message }
    }
}
