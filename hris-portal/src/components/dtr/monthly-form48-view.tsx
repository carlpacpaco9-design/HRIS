'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Printer, Download, Calendar as CalendarIcon, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    calculateMonthlyAttendance,
    DailyPunch,
    MonthlySummary
} from '@/lib/attendance-calculator'
import { format, getDaysInMonth, parseISO, startOfMonth } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAttendanceData } from '@/hooks/use-attendance-data'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, AlertCircle } from 'lucide-react'

interface MonthlyForm48ViewProps {
    employeeId: string
    employeeName: string
    yearMonth: string // Format: "YYYY-MM"
}

/**
 * MonthlyForm48View Component
 * Renders the Official CSC Form 48 (Daily Time Record)
 */
export function MonthlyForm48View({
    employeeId,
    employeeName,
    yearMonth
}: MonthlyForm48ViewProps) {
    // Integrate Production Data Fetching
    const { records, isLoading, error } = useAttendanceData(employeeId, yearMonth)

    // Construct the 28-31 day grid from fetched data
    const attendanceData = useMemo(() => {
        if (isLoading || !yearMonth) return null

        const [year, month] = yearMonth.split('-').map(Number)
        if (!year || !month) return null

        const dateObj = parseISO(`${yearMonth}-01`)
        const daysCount = getDaysInMonth(dateObj)

        // Create a punch map for O(1) lookup
        const punchMap = new Map(records.map(r => [r.date, r]))

        const fullMonthPunches: DailyPunch[] = Array.from({ length: daysCount }, (_, i) => {
            const day = i + 1
            const dateStr = `${yearMonth}-${day.toString().padStart(2, '0')}`

            const existingPunch = punchMap.get(dateStr)
            if (existingPunch) return existingPunch

            // Fill with empty entry if no record exists
            return { date: dateStr }
        })

        return calculateMonthlyAttendance(fullMonthPunches)
    }, [records, isLoading, yearMonth])

    // 2. FORMATTING HELPERS
    const monthName = useMemo(() => {
        try {
            return format(parseISO(`${yearMonth}-01`), 'MMMM yyyy')
        } catch {
            return yearMonth
        }
    }, [yearMonth])

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-4xl mx-auto p-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <Skeleton className="h-12 w-3/4 mx-auto" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-destructive/20 rounded-xl bg-destructive/5 max-w-4xl mx-auto">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h3 className="text-lg font-bold text-destructive">Error Fetching Records</h3>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => window.location.reload()}>Retry Connection</Button>
            </div>
        )
    }

    if (!attendanceData || attendanceData.days.length === 0) {
        return (
            <div className="text-center p-20 border-2 border-dashed rounded-3xl max-w-4xl mx-auto">
                <CalendarIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold opacity-50">No Data Available</h3>
                <p className="text-muted-foreground">We couldn't find any attendance logs for this period.</p>
            </div>
        )
    }

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-none border-none print:m-0">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b print:pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-serif font-bold uppercase tracking-tight">
                        Daily Time Record (Form 48)
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {employeeName}
                        </span>
                        <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {monthName}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2 print:hidden">
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print Form
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                {/* CSC FORM 48 STRUCTURE */}
                <div className="overflow-x-auto border-2 border-black/10 rounded-sm">
                    <table className="w-full text-[11px] text-left border-collapse font-serif leading-tight">
                        <thead>
                            <tr className="bg-muted/30 border-b border-black/20">
                                <th rowSpan={2} className="px-2 py-3 border-r border-black/20 text-center uppercase font-bold">Day</th>
                                <th colSpan={2} className="px-2 py-1 border-b border-r border-black/20 text-center uppercase font-bold">A.M.</th>
                                <th colSpan={2} className="px-2 py-1 border-b border-r border-black/20 text-center uppercase font-bold">P.M.</th>
                                <th colSpan={2} className="px-2 py-1 border-b border-r border-black/20 text-center uppercase font-bold">Undertime</th>
                                <th rowSpan={2} className="px-2 py-3 text-center uppercase font-bold">Remarks</th>
                            </tr>
                            <tr className="bg-muted/30 border-b border-black/20">
                                <th className="px-1 py-1 border-r border-black/20 text-center uppercase font-medium">In</th>
                                <th className="px-1 py-1 border-r border-black/20 text-center uppercase font-medium">Out</th>
                                <th className="px-1 py-1 border-r border-black/20 text-center uppercase font-medium">In</th>
                                <th className="px-1 py-1 border-r border-black/20 text-center uppercase font-medium">Out</th>
                                <th className="px-1 py-1 border-r border-black/20 text-center uppercase font-medium">Late</th>
                                <th className="px-1 py-1 border-r border-black/20 text-center uppercase font-medium">Undertime</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/10">
                            {attendanceData.days.map((day, idx) => {
                                const dateNum = idx + 1
                                return (
                                    <tr key={day.date} className={cn(
                                        "hover:bg-muted/10 transition-colors",
                                        (day.tardinessMinutes > 0 || day.undertimeMinutes > 0) && "bg-yellow-50/50 print:bg-transparent"
                                    )}>
                                        <td className="px-2 py-1.5 border-r border-black/20 text-center font-bold">
                                            {dateNum}
                                        </td>
                                        <td className="px-1 py-1.5 border-r border-black/20 text-center text-gray-700">
                                            {day.amIn || ""}
                                        </td>
                                        <td className="px-1 py-1.5 border-r border-black/20 text-center text-gray-700">
                                            {day.amOut || ""}
                                        </td>
                                        <td className="px-1 py-1.5 border-r border-black/20 text-center text-gray-700">
                                            {day.pmIn || ""}
                                        </td>
                                        <td className="px-1 py-1.5 border-r border-black/20 text-center text-gray-700">
                                            {day.pmOut || ""}
                                        </td>
                                        <td className={cn(
                                            "px-1 py-1.5 border-r border-black/20 text-center font-medium",
                                            day.tardinessMinutes > 0 && "text-red-600 font-bold"
                                        )}>
                                            {day.tardinessMinutes > 0 ? day.tardinessMinutes : ""}
                                        </td>
                                        <td className={cn(
                                            "px-1 py-1.5 border-r border-black/20 text-center font-medium",
                                            day.undertimeMinutes > 0 && "text-red-500"
                                        )}>
                                            {day.undertimeMinutes > 0 ? day.undertimeMinutes : ""}
                                        </td>
                                        <td className="px-2 py-1.5 text-xs italic text-muted-foreground overflow-hidden whitespace-nowrap text-ellipsis max-w-[120px]">
                                            {day.isIncomplete ? (
                                                <span className="text-destructive font-bold">INCOMPLETE</span>
                                            ) : day.remarks}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        {/* FOOTER TOTALS */}
                        <tfoot>
                            <tr className="bg-muted/40 border-t-2 border-black/20">
                                <td colSpan={5} className="px-4 py-3 border-r border-black/20 text-right font-bold uppercase">
                                    Monthly Total (Minutes)
                                </td>
                                <td className="px-1 py-3 border-r border-black/20 text-center text-[12px] font-black underline decoration-2">
                                    {attendanceData.totalTardiness}
                                </td>
                                <td className="px-1 py-3 border-r border-black/20 text-center text-[12px] font-black underline decoration-2">
                                    {attendanceData.totalUndertime}
                                </td>
                                <td className="px-2 py-3 bg-white print:bg-transparent tracking-tighter text-[9px]">
                                    * Verified against paper logbook
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* PRINT SIGNATURE BLOCK */}
                <div className="mt-12 hidden print:grid grid-cols-2 gap-16 text-center text-xs">
                    <div className="space-y-12">
                        <div className="border-t border-black pt-4">
                            <p className="font-bold uppercase">{employeeName}</p>
                            <p className="text-[10px] italic">Employee Signature</p>
                        </div>
                    </div>
                    <div className="space-y-12">
                        <div className="border-t border-black pt-4">
                            <p className="font-bold uppercase text-gray-400">.............................................</p>
                            <p className="text-[10px] italic">Supervisor / HR Officer</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center p-4 bg-muted/20 border border-dashed rounded-lg print:hidden">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                        Highlighted rows indicate tardiness or undertime.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
