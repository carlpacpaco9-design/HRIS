'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { DailyPunch } from '@/lib/attendance-calculator'
import { toast } from 'sonner'

/**
 * Custom hook to fetch attendance records for a specific employee and month.
 */
export function useAttendanceData(employeeId: string, yearMonth: string) {
    const [records, setRecords] = useState<DailyPunch[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchAttendance() {
            if (!employeeId || !yearMonth) return

            setIsLoading(true)
            setError(null)

            try {
                const supabase = createClient()

                // Calculate date range for the month
                const [year, month] = yearMonth.split('-')
                const startDate = `${yearMonth}-01`
                const lastDay = new Date(Number(year), Number(month), 0).getDate()
                const endDate = `${yearMonth}-${lastDay}`

                const { data, error: fetchError } = await supabase
                    .from('daily_time_records')
                    .select('*')
                    .eq('employee_id', employeeId)
                    .gte('record_date', startDate)
                    .lte('record_date', endDate)
                    .order('record_date', { ascending: true })

                if (fetchError) throw fetchError

                // Map snake_case database rows to camelCase DailyPunch interface
                const mappedRecords: DailyPunch[] = (data || []).map(row => ({
                    date: row.record_date,
                    amIn: row.am_in || undefined,
                    amOut: row.am_out || undefined,
                    pmIn: row.pm_in || undefined,
                    pmOut: row.pm_out || undefined,
                    remarks: row.remarks || undefined
                }))

                setRecords(mappedRecords)
            } catch (err: any) {
                const msg = err.message || 'Failed to fetch attendance data'
                setError(msg)
                toast.error(msg)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAttendance()
    }, [employeeId, yearMonth])

    return { records, isLoading, error }
}
