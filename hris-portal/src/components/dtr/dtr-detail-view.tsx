'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Edit, Trash2, Plus, Download } from 'lucide-react'
import { DTRLog, Profile, deleteDTRLog } from '@/app/actions/dtr'
import { format, getDaysInMonth, isWeekend } from 'date-fns'
import { DTRLogDialog } from './dtr-log-dialog'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type DTRDetailViewProps = {
    employee: Profile
    initialLogs: DTRLog[]
    initialMonth: number
    initialYear: number
    canEdit: boolean
    canAdminister: boolean
}

export function DTRDetailView({
    employee,
    initialLogs,
    initialMonth,
    initialYear,
    canEdit,
    canAdminister
}: DTRDetailViewProps) {
    const router = useRouter()
    const [currentMonth, setCurrentMonth] = useState(initialMonth)
    const [currentYear, setCurrentYear] = useState(initialYear)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const [selectedLog, setSelectedLog] = useState<DTRLog | null>(null)
    const [selectedDate, setSelectedDate] = useState<string>('')

    const [isExporting, setIsExporting] = useState(false)

    // Navigation handlers
    const handlePrevMonth = () => {
        let m = currentMonth - 1
        let y = currentYear
        if (m < 1) {
            m = 12
            y -= 1
        }
        setCurrentMonth(m)
        setCurrentYear(y)
        router.push(`?month=${m}&year=${y}`)
    }

    const handleNextMonth = () => {
        let m = currentMonth + 1
        let y = currentYear
        if (m > 12) {
            m = 1
            y += 1
        }
        setCurrentMonth(m)
        setCurrentYear(y)
        router.push(`?month=${m}&year=${y}`)
    }

    // Calculate month days correctly
    const paddedMonth = currentMonth.toString().padStart(2, '0')
    const dateObj = new Date(`${currentYear}-${paddedMonth}-01T00:00:00`)
    const monthName = format(dateObj, 'MMMM')
    const daysInMonthCount = getDaysInMonth(dateObj)

    // Construct table rows
    const daysArray = Array.from({ length: daysInMonthCount }, (_, i) => {
        const day = i + 1
        const paddedDay = day.toString().padStart(2, '0')
        const fullDateStr = `${currentYear}-${paddedMonth}-${paddedDay}`
        const dDate = new Date(`${fullDateStr}T00:00:00`)
        const isWkd = isWeekend(dDate)

        // find log for this date using precise match
        const existingLog = initialLogs.find(l => l.log_date === fullDateStr)

        return {
            day,
            dateStr: fullDateStr,
            isWeekend: isWkd,
            dateObj: dDate,
            log: existingLog
        }
    })

    // Summary logic
    let daysWithEntries = 0
    let totalUndertimeMinutes = 0

    initialLogs.forEach(l => {
        daysWithEntries++
        totalUndertimeMinutes += (l.undertime_hours * 60) + l.undertime_minutes
    })

    // Count working days simply as non-weekends this month
    const totalWorkingDays = daysArray.filter(d => !d.isWeekend).length
    const daysAbsent = totalWorkingDays - daysWithEntries

    const totalSummaryHours = Math.floor(totalUndertimeMinutes / 60)
    const totalSummaryMinutes = totalUndertimeMinutes % 60

    // Action handlers
    const handleAddClick = (dateStr: string) => {
        setSelectedLog(null)
        setSelectedDate(dateStr)
        setIsDialogOpen(true)
    }

    const handleEditClick = (dateStr: string, log: DTRLog) => {
        setSelectedLog(log)
        setSelectedDate(dateStr)
        setIsDialogOpen(true)
    }

    const handleDeleteClick = (log: DTRLog) => {
        setSelectedLog(log)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!selectedLog) return
        const res = await deleteDTRLog(selectedLog.id)
        if (res.success) {
            toast.success("DTR entry deleted")
            router.refresh()
        } else {
            toast.error(res.error || "Failed to delete entry")
        }
        setIsDeleteDialogOpen(false)
    }

    const handleExportForm48 = async () => {
        setIsExporting(true)
        try {
            const res = await fetch(`/api/dtr/form48?employeeId=${employee.id}&month=${currentMonth}&year=${currentYear}`)
            if (!res.ok) {
                throw new Error('Export failed')
            }

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Form48_${employee.full_name.replace(/\s+/g, '_')}_${monthName}_${currentYear}.docx`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)

            toast.success("Form 48 exported successfully")
        } catch (err) {
            toast.error("Failed to export Form 48")
        }
        setIsExporting(false)
    }

    return (
        <div className="space-y-6">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-xl font-bold text-slate-800 w-[200px] text-center">
                        {monthName} {currentYear}
                    </div>
                    <Button variant="outline" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="mt-4 sm:mt-0 opacity-100">
                    <Button
                        className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
                        onClick={handleExportForm48}
                        disabled={isExporting}
                    >
                        <Download className="mr-2 h-4 w-4" /> {isExporting ? 'Exporting...' : (canAdminister ? 'Export Form 48' : 'Export My Form 48')}
                    </Button>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="w-16 text-center">Date</TableHead>
                            <TableHead className="w-24">Day</TableHead>
                            <TableHead>AM In</TableHead>
                            <TableHead>AM Out</TableHead>
                            <TableHead>PM In</TableHead>
                            <TableHead>PM Out</TableHead>
                            <TableHead>Undertime</TableHead>
                            {canEdit && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {daysArray.map((d) => {
                            const rowClass = d.isWeekend ? 'bg-slate-100/50 text-slate-400' : ''

                            const formatTime = (t: string | null) => t ? t.substring(0, 5) : '—'

                            let underTimeDisp = '—'
                            if (d.log && (d.log.undertime_hours > 0 || d.log.undertime_minutes > 0)) {
                                underTimeDisp = `${d.log.undertime_hours}h ${d.log.undertime_minutes}m`
                            }

                            return (
                                <TableRow key={d.dateStr} className={rowClass}>
                                    <TableCell className="text-center font-medium">{d.day}</TableCell>
                                    <TableCell>{format(d.dateObj, 'EEE')}</TableCell>

                                    {d.isWeekend && !d.log ? (
                                        <>
                                            <TableCell colSpan={canEdit ? 6 : 5} className="text-center italic tracking-widest uppercase text-xs">
                                                Weekend
                                            </TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell>{formatTime(d.log?.am_arrival || null)}</TableCell>
                                            <TableCell>{formatTime(d.log?.am_departure || null)}</TableCell>
                                            <TableCell>{formatTime(d.log?.pm_arrival || null)}</TableCell>
                                            <TableCell>{formatTime(d.log?.pm_departure || null)}</TableCell>
                                            <TableCell className={underTimeDisp !== '—' ? 'text-red-500 font-medium' : ''}>
                                                {underTimeDisp}
                                            </TableCell>

                                            {canEdit && (
                                                <TableCell className="text-right">
                                                    {d.log ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-[#1E3A5F]" onClick={() => handleEditClick(d.dateStr, d.log!)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDeleteClick(d.log!)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button variant="ghost" size="sm" className="h-8 text-[#1E3A5F]" onClick={() => handleAddClick(d.dateStr)}>
                                                            <Plus className="mr-1 h-3 w-3" /> Log
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            )}
                                        </>
                                    )}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-50 rounded-lg border p-6 max-w-sm">
                <h3 className="font-semibold text-slate-900 mb-4 uppercase tracking-wider text-sm">Monthly Summary</h3>
                <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex justify-between">
                        <span>Total Working Days:</span>
                        <span className="font-medium">{totalWorkingDays}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Days with Entries:</span>
                        <span className="font-medium">{daysWithEntries}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Days Absent/No Entry:</span>
                        <span className="font-medium">{daysAbsent}</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-slate-900">
                        <span>Total Undertime:</span>
                        <span className={totalSummaryHours > 0 || totalSummaryMinutes > 0 ? "text-red-600" : ""}>
                            {totalSummaryHours} hr {totalSummaryMinutes} min
                        </span>
                    </div>
                </div>
            </div>

            <DTRLogDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                log={selectedLog}
                date={selectedDate}
                employeeId={employee.id}
                onSave={() => router.refresh()}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this DTR entry? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    )
}
