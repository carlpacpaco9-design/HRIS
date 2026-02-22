import * as XLSX from 'xlsx'
import { format, getDaysInMonth, parseISO } from 'date-fns'

interface DTRDayRecord {
    date: string
    am_arrival?: string | null
    am_departure?: string | null
    pm_arrival?: string | null
    pm_departure?: string | null
    minutes_late?: number
    status?: string
    is_holiday?: boolean
    is_leave?: boolean
}

interface DTRMonthlyData {
    month: number       // 1-12
    year: number
    staff_name: string
    division: string
    days: DTRDayRecord[]
    total_working_days: number
    days_present: number
    days_absent: number
    days_late: number
    division_name?: string
}

function timeToHM(timeStr: string | null | undefined): string {
    if (!timeStr) return ''
    return timeStr.substring(0, 5) // "HH:MM"
}

function dayOfWeek(year: number, month: number, day: number): number {
    return new Date(year, month - 1, day).getDay() // 0=Sun, 6=Sat
}

function isWeekend(year: number, month: number, day: number): boolean {
    const dow = dayOfWeek(year, month, day)
    return dow === 0 || dow === 6
}

export function generateDTRMonthlyExcel(data: DTRMonthlyData): Buffer {
    const wb = XLSX.utils.book_new()

    const monthName = new Date(data.year, data.month - 1, 1).toLocaleString('en-US', { month: 'long' })
    const daysInMonth = getDaysInMonth(new Date(data.year, data.month - 1, 1))

    // Build a quick lookup map
    const dayMap = new Map<number, DTRDayRecord>()
    for (const d of data.days) {
        const day = parseInt(d.date.split('-')[2], 10)
        dayMap.set(day, d)
    }

    // ── Sheet: Monthly DTR ───────────────────────────────────────────────────
    const rows: any[][] = []

    // Title
    rows.push([`DAILY TIME RECORD — ${monthName.toUpperCase()} ${data.year}`])
    rows.push([])
    rows.push(['Staff Member:', data.staff_name, '', 'Division:', data.division_name ?? data.division])
    rows.push(['Month/Year:', `${monthName} ${data.year}`])
    rows.push([])

    // Header
    rows.push([
        'Day',
        'Day of Week',
        'AM Arrival',
        'AM Departure',
        'PM Arrival',
        'PM Departure',
        'Minutes Late',
        'Status',
        'Remarks',
    ])

    const dataStartRow = rows.length + 1  // 1-indexed row for COUNTA formulas
    let presentCount = 0
    let absentCount = 0
    let lateCount = 0
    let holidayCount = 0
    let leaveCount = 0
    const daysWithPresent: number[] = []
    const daysWithLate: number[] = []

    for (let day = 1; day <= daysInMonth; day++) {
        const isWknd = isWeekend(data.year, data.month, day)
        const rec = dayMap.get(day)
        const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek(data.year, data.month, day)]

        if (isWknd) {
            rows.push([day, dow, '', '', '', '', '', 'Weekend', ''])
            continue
        }

        if (rec?.is_holiday) {
            holidayCount++
            rows.push([day, dow, '', '', '', '', '', 'Holiday', ''])
            continue
        }

        if (rec?.is_leave) {
            leaveCount++
            rows.push([day, dow, timeToHM(rec?.am_arrival), timeToHM(rec?.am_departure), timeToHM(rec?.pm_arrival), timeToHM(rec?.pm_departure), rec?.minutes_late ?? 0, 'Leave', ''])
            continue
        }

        if (rec && (rec.am_arrival || rec.pm_arrival)) {
            presentCount++
            if ((rec.minutes_late ?? 0) > 0) lateCount++
            rows.push([
                day,
                dow,
                timeToHM(rec.am_arrival),
                timeToHM(rec.am_departure),
                timeToHM(rec.pm_arrival),
                timeToHM(rec.pm_departure),
                rec.minutes_late ?? 0,
                (rec.minutes_late ?? 0) > 0 ? 'Late' : 'Present',
                '',
            ])
        } else {
            // Future days or absent
            const today = new Date()
            const thisDate = new Date(data.year, data.month - 1, day)
            if (thisDate > today) {
                rows.push([day, dow, '', '', '', '', '', '', ''])
            } else {
                absentCount++
                rows.push([day, dow, '', '', '', '', '', 'Absent', ''])
            }
        }
    }

    rows.push([])

    // Summary section
    rows.push(['ATTENDANCE SUMMARY'])
    rows.push(['Total Working Days:', data.total_working_days > 0 ? data.total_working_days : `=SUMPRODUCT((WEEKDAY(DATE(${data.year},${data.month},ROW(INDIRECT("1:"&${daysInMonth}))),2)<6)*1)-${holidayCount}`])
    rows.push(['Days Present:', presentCount])
    rows.push(['Days Absent:', absentCount])
    rows.push(['Days Late:', lateCount])
    rows.push(['Days on Leave:', leaveCount])
    rows.push(['Holidays:', holidayCount])
    rows.push(['Compliance Rate (%):', {
        f: `=IF(${data.total_working_days}>0,ROUND(${presentCount}/${data.total_working_days}*100,1),0)`,
    }])
    rows.push([])

    // Signatory
    rows.push(['Certified Correct:'])
    rows.push([])
    rows.push([data.staff_name, '', '', 'CERTIFYING OFFICER'])
    rows.push(['Staff Member', '', '', 'Provincial Assessor'])

    const ws = XLSX.utils.aoa_to_sheet(rows)

    ws['!cols'] = [
        { wch: 5 },   // Day
        { wch: 12 },  // Day of Week
        { wch: 12 },  // AM Arrival
        { wch: 14 },  // AM Departure
        { wch: 12 },  // PM Arrival
        { wch: 14 },  // PM Departure
        { wch: 12 },  // Minutes Late
        { wch: 12 },  // Status
        { wch: 20 },  // Remarks
    ]

    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },  // Title
    ]

    XLSX.utils.book_append_sheet(wb, ws, `DTR ${monthName} ${data.year}`)

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}
