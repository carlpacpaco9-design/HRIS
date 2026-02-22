import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateDTRMonthlyExcel } from '@/lib/export/dtr-xlsx'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Read query params
        const { searchParams } = new URL(request.url)
        const monthStr = searchParams.get('month')  // "2025-01"
        const divisionId = searchParams.get('division_id') ?? undefined
        const staffId = searchParams.get('employee_id') ?? user.id

        const now = new Date()
        const targetDate = monthStr ? new Date(monthStr + '-01') : now
        const year = targetDate.getFullYear()
        const month = targetDate.getMonth() + 1

        // Fetch profile info
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, division_id, divisions(name)')
            .eq('id', staffId)
            .single()

        const staffName = profile?.full_name ?? 'Staff member'
        const divisionName = (profile?.divisions as any)?.name ?? 'Division'

        // Fetch DTR records for the month
        const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        let query = supabase
            .from('dtr_records')
            .select('*')
            .eq('user_id', staffId)
            .gte('date', monthStart)
            .lte('date', monthEnd)
            .order('date', { ascending: true })

        const { data: dtrRecords, error: dtrError } = await query

        if (dtrError) {
            console.error('[DTR Fetch Error]', dtrError)
        }

        // Count working days (Mon-Fri)
        let workingDays = 0
        let daysPresent = 0
        let daysAbsent = 0
        let daysLate = 0
        const today = new Date()

        for (let d = 1; d <= lastDay; d++) {
            const date = new Date(year, month - 1, d)
            const dow = date.getDay()
            if (dow === 0 || dow === 6) continue // skip weekends
            workingDays++

            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const rec = (dtrRecords ?? []).find((r: any) => r.date === dateStr)
            if (rec && (rec.am_arrival || rec.pm_arrival)) {
                daysPresent++
                if ((rec.minutes_late ?? 0) > 0) daysLate++
            } else if (date <= today) {
                daysAbsent++
            }
        }

        // Shape days data
        const days = (dtrRecords ?? []).map((r: any) => ({
            date: r.date,
            am_arrival: r.am_arrival,
            am_departure: r.am_departure,
            pm_arrival: r.pm_arrival,
            pm_departure: r.pm_departure,
            minutes_late: r.minutes_late ?? 0,
            status: r.status ?? null,
            is_holiday: r.is_holiday ?? false,
            is_leave: r.is_leave ?? false,
        }))

        // Generate Excel
        const monthName = targetDate.toLocaleString('en-US', { month: 'long' })
        const buffer = generateDTRMonthlyExcel({
            month,
            year,
            staff_name: staffName,
            division: divisionName,
            division_name: divisionName,
            days,
            total_working_days: workingDays,
            days_present: daysPresent,
            days_absent: daysAbsent,
            days_late: daysLate,
        })

        const filename = `DTR_Report_${monthName}_${year}.xlsx`

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString(),
            },
        })
    } catch (err: any) {
        console.error('[DTR Monthly Export Error]', err)
        return NextResponse.json({ error: err.message ?? 'Export failed' }, { status: 500 })
    }
}
