'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isWeekend, isFuture } from 'date-fns'
import { getMonthlyAttendance } from '@/app/actions/dtr'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AttendanceCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const year = currentDate.getFullYear()
            const month = currentDate.getMonth() + 1 // 1-12
            const data = await getMonthlyAttendance(year, month)
            setAttendanceData(data || [])
            setLoading(false)
        }
        fetchData()
    }, [currentDate])

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Padding days for grid alignment
    const startDayOfWeek = monthStart.getDay() // 0 (Sun) - 6 (Sat)
    const paddingDays = Array.from({ length: startDayOfWeek })

    // Helper to get status
    const getDayStatus = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const log = attendanceData.find((d: any) => d.date === dateStr)

        if (log) return { status: 'present', log }

        // Absent logic: Past date, not weekend, no log
        const isPast = day < new Date() && !isToday(day)
        const isWknd = isWeekend(day)

        if (isPast && !isWknd) return { status: 'absent' }
        if (isWknd) return { status: 'weekend' }

        return { status: 'future' }
    }

    return (
        <Card className="h-full border-slate-100 shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-violet-600" />
                        Attendance
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Reflects your bio-logs.
                    </CardDescription>
                </div>
                <div className="flex items-center space-x-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-semibold w-24 text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextMonth} disabled={isFuture(addMonths(currentDate, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-[200px]">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                            <div key={d} className="font-medium text-slate-400 py-1">{d}</div>
                        ))}

                        {paddingDays.map((_, i) => (
                            <div key={`pad-${i}`} />
                        ))}

                        {days.map(day => {
                            const { status, log } = getDayStatus(day)
                            const isTodayDate = isToday(day)

                            let bgClass = "bg-transparent text-slate-900"
                            let tooltipText = ""

                            if (status === 'present') {
                                bgClass = "bg-green-100 text-green-700 font-semibold"
                                tooltipText = `Time In: ${log.am_arrival?.slice(0, 5) || '-'}, Out: ${log.pm_departure?.slice(0, 5) || '-'}`
                            } else if (status === 'absent') {
                                bgClass = "bg-red-50 text-red-600 font-medium"
                                tooltipText = "Absent / No Log"
                            } else if (status === 'weekend') {
                                bgClass = "text-slate-400 bg-slate-50/50"
                            }

                            if (isTodayDate) {
                                bgClass += " ring-1 ring-blue-500 ring-offset-1"
                            }

                            return (
                                <TooltipProvider key={day.toISOString()}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className={`
                                                aspect-square flex items-center justify-center rounded-md cursor-default text-[10px]
                                                ${bgClass}
                                            `}>
                                                {day.getDate()}
                                            </div>
                                        </TooltipTrigger>
                                        {tooltipText && (
                                            <TooltipContent>
                                                <p>{tooltipText}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        })}
                    </div>
                )}

                <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" /> Present
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400" /> Absent
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
