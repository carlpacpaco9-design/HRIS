'use server'

import { createClient } from "@/utils/supabase/server"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { AttendanceLog } from "@/types/dashboard"

export async function getAttendanceLogs(userId?: string): Promise<AttendanceLog[]> {
    const supabase = await createClient()

    let activeUserId = userId

    if (!activeUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []
        activeUserId = user.id
    }

    const start = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const end = format(new Date(), 'yyyy-MM-dd')

    const { data, error } = await supabase
        .from('dtr_records')
        .select('*')
        .eq('user_id', activeUserId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })

    if (error) {
        console.error("Error fetching attendance logs:", error)
        return []
    }

    if (!data) return []

    // Map to AttendanceLog interface
    return data.map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        date: d.date,
        am_arrival: d.am_arrival,
        am_departure: d.am_departure,
        pm_arrival: d.pm_arrival,
        pm_departure: d.pm_departure,
        // UI specific mapping
        log_date: d.date,
        am_in: d.am_arrival,
        pm_out: d.pm_departure
    })) as AttendanceLog[]
}
