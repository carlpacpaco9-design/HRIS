'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
    Card, CardHeader,
    CardTitle, CardContent
} from '@/components/ui/card'
import { Clock } from 'lucide-react'

const DAY_LABELS =
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

type DayStatus =
    | 'present'
    | 'late'
    | 'absent'
    | 'weekend'
    | 'holiday'
    | 'future'
    | 'today-present'
    | 'today-absent'

export type AttendanceDay = {
    date: number      // day of month (1-31)
    status: DayStatus
    timeIn?: string   // "08:00"
    timeOut?: string  // "17:00"
}

type AttendanceWidgetProps = {
    month: number          // 1-12
    year: number
    attendanceDays: AttendanceDay[]
    employeeId: string
}

export function AttendanceWidget({
    month, year, attendanceDays
}: AttendanceWidgetProps) {

    const today = new Date()
    const todayDate = today.getDate()
    const isCurrentMonth =
        today.getMonth() + 1 === month &&
        today.getFullYear() === year

    const monthName = new Date(year, month - 1)
        .toLocaleString('en-PH', {
            month: 'long', year: 'numeric'
        })

    const daysInMonth =
        new Date(year, month, 0).getDate()

    // Day of week the 1st falls on (0=Sun)
    const firstDayOfWeek =
        new Date(year, month - 1, 1).getDay()

    // Build lookup: day number → status
    const statusMap = useMemo(() => {
        const map: Record<number, AttendanceDay> = {}
        attendanceDays.forEach(d => {
            map[d.date] = d
        })
        return map
    }, [attendanceDays])

    // Build calendar cells array
    // (null = empty leading cell)
    const cells: (number | null)[] = [
        ...Array(firstDayOfWeek).fill(null),
        ...Array.from(
            { length: daysInMonth },
            (_, i) => i + 1
        )
    ]

    // Pad to complete last row
    while (cells.length % 7 !== 0) {
        cells.push(null)
    }

    // Status → style mapping
    const getDayStyle = (
        day: number
    ): string => {
        const isToday =
            isCurrentMonth && day === todayDate
        const isFuture =
            isCurrentMonth && day > todayDate
        const dayOfWeek =
            new Date(year, month - 1, day).getDay()
        const isWeekend =
            dayOfWeek === 0 || dayOfWeek === 6
        const record = statusMap[day]

        if (isWeekend) {
            return cn(
                'text-muted-foreground/50',
                isToday && 'ring-2 ring-primary'
            )
        }

        if (isFuture) {
            return 'text-muted-foreground/40'
        }

        if (!record) {
            // Past weekday with no record = absent
            // But only if day is not today (logic handled below) or handle strictly
            // If we strictly follow the prompt, record not found = absent for past week days?
            // Or maybe just show gray? Prompt says: "Red circles = absent days".
            // Let's assume passed in data explicitly marks 'absent'.
            // If no record is passed for a past weekday, it might mean absent or just no data yet.
            // Let's default to a neutral or slight warning if "no record".
            // But for now, let's stick to statusMap check.

            // If today and no record, it's just not time yet or absent.
            if (isToday) return 'ring-2 ring-primary'

            // If past and no record, maybe absent?
            return 'text-foreground'
        }

        switch (record.status) {
            case 'present':
            case 'today-present':
                return cn(
                    'bg-green-100 text-green-800 font-medium',
                    isToday &&
                    'bg-green-500 text-white ring-2 ring-green-400'
                )
            case 'late':
                return cn(
                    'bg-amber-100 text-amber-800 font-medium',
                    isToday &&
                    'bg-amber-500 text-white ring-2 ring-amber-400'
                )
            case 'absent':
            case 'today-absent':
                return cn(
                    'bg-red-100 text-red-700 font-medium',
                    isToday && 'ring-2 ring-red-400'
                )
            case 'holiday':
                return 'bg-blue-100 text-blue-700 font-medium'
            default:
                return 'text-foreground'
        }
    }

    // Summary counts
    const presentCount = attendanceDays
        .filter(d =>
            d.status === 'present' ||
            d.status === 'today-present'
        ).length
    const lateCount = attendanceDays
        .filter(d => d.status === 'late').length
    const absentCount = attendanceDays
        .filter(d =>
            d.status === 'absent' ||
            d.status === 'today-absent'
        ).length

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center
          justify-between">
                    <CardTitle className="text-sm
            font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4
              text-primary" />
                        Attendance
                    </CardTitle>
                    <span className="text-xs
            text-muted-foreground">
                        {monthName}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="pb-4">
                {/* Day of week headers */}
                <div className="grid grid-cols-7
          mb-1">
                    {DAY_LABELS.map(label => (
                        <div
                            key={label}
                            className="text-center text-[10px]
                font-semibold
                text-muted-foreground/70
                uppercase py-1"
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-y-1">
                    {cells.map((day, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                'aspect-square flex items-center',
                                'justify-center rounded-full',
                                'text-xs mx-auto w-7 h-7',
                                'transition-colors duration-150',
                                day === null
                                    ? ''
                                    : getDayStyle(day)
                            )}
                        >
                            {day ?? ''}
                        </div>
                    ))}
                </div>

                {/* Legend + summary row */}
                <div className="mt-3 pt-3
          border-t border-border
          flex items-center justify-between">

                    {/* Summary counts */}
                    <div className="flex items-center
            gap-3 text-xs">
                        <span className="flex items-center
              gap-1">
                            <span className="w-2 h-2
                rounded-full bg-green-500" />
                            <span className="
                text-muted-foreground">
                                {presentCount} Present
                            </span>
                        </span>
                        {lateCount > 0 && (
                            <span className="flex items-center
                gap-1">
                                <span className="w-2 h-2
                  rounded-full bg-amber-500" />
                                <span className="
                  text-muted-foreground">
                                    {lateCount} Late
                                </span>
                            </span>
                        )}
                        {absentCount > 0 && (
                            <span className="flex items-center
                gap-1">
                                <span className="w-2 h-2
                  rounded-full bg-red-400" />
                                <span className="
                  text-muted-foreground">
                                    {absentCount} Absent
                                </span>
                            </span>
                        )}
                    </div>

                    {/* Today's status pill */}
                    {isCurrentMonth && (() => {
                        const todayRecord =
                            statusMap[todayDate]
                        if (!todayRecord) {
                            // If today has no record, assumes 'Working...' or 'Not In'
                            return (
                                <span className={cn(
                                    'text-xs font-medium px-2 py-0.5',
                                    'rounded-full',
                                    'bg-slate-100 text-slate-700'
                                )}>
                                    ● No log yet
                                </span>
                            )
                        }
                        const isPresent =
                            todayRecord.status === 'present' ||
                            todayRecord.status === 'today-present' ||
                            todayRecord.status === 'late'
                        return (
                            <span className={cn(
                                'text-xs font-medium px-2 py-0.5',
                                'rounded-full',
                                isPresent
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                            )}>
                                {isPresent
                                    ? '● Present today'
                                    : '● Absent today'
                                }
                            </span>
                        )
                    })()}
                </div>
            </CardContent>
        </Card>
    )
}
