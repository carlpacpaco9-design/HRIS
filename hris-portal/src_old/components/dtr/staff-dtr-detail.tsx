'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Download,
    Plus,
    Pencil,
    Trash2,
    Clock,
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { getStaffDTR } from '@/app/actions/dtr-admin'
import { deleteDTREntry } from '@/app/actions/dtr'
import { toast } from 'sonner'
import { DTRPermission } from '@/lib/dtr-permissions'
import { DTRLogDialog } from './dtr-log-dialog'

interface DTRLog {
    id: string
    log_date: string
    am_arrival: string | null
    am_departure: string | null
    pm_arrival: string | null
    pm_departure: string | null
    status: string
    remarks?: string | null
    undertime_hours?: number
    undertime_minutes?: number
}

interface StaffMember {
    id: string
    full_name: string
    position: string | null
    division: string | null
    employee_number?: string | null
}

interface StaffDTRDetailProps {
    staffMember: StaffMember
    initialLogs: any[]
    permissions: DTRPermission
    currentMonth: number
    currentYear: number
}

export function StaffDTRDetail({
    staffMember,
    initialLogs,
    permissions,
    currentMonth,
    currentYear
}: StaffDTRDetailProps) {
    const router = useRouter()
    const [month, setMonth] = useState(currentMonth)
    const [year, setYear] = useState(currentYear)
    const [logs, setLogs] = useState<DTRLog[]>(initialLogs.map(l => ({
        ...l,
        log_date: l.date // mapping date to log_date for consistency with user snippet
    })))
    const [logDialogOpen, setLogDialogOpen] = useState(false)
    const [editTarget, setEditTarget] = useState<any | null>(null)
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Reload logs when month/year changes
    const refreshLogs = async () => {
        setIsLoading(true)
        try {
            const data = await getStaffDTR(staffMember.id, month, year)
            // Extract logs from daysInMonth structure returned by getStaffDTR
            const extractedLogs = data
                .filter(day => day.logs)
                .map(day => ({
                    ...day.logs,
                    log_date: day.date
                }))
            setLogs(extractedLogs)
        } catch (error) {
            toast.error("Failed to load records")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        refreshLogs()
    }, [month, year])

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this log entry?")) return
        const res = await deleteDTREntry(id)
        if (res.success) {
            toast.success("Entry deleted")
            refreshLogs()
        } else {
            toast.error(res.error || "Delete failed")
        }
    }


    // Build full month calendar
    const daysInMonth = new Date(year, month, 0).getDate()

    const allDays = useMemo(() => {
        return Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
            const d = new Date(year, month - 1, dayNum)
            const dayOfWeek = d.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
            const log = logs.find(l => l.log_date === dateStr)
            return {
                day: dayNum,
                date: dateStr,
                dayName: d.toLocaleString('en-PH', { weekday: 'short' }),
                isWeekend,
                log
            }
        })
    }, [year, month, logs, daysInMonth])

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard/dtr')}
                        className="-ml-2 text-muted-foreground hover:text-foreground shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">
                                {staffMember.full_name
                                    .split(' ')
                                    .map((n: string) => n[0])
                                    .slice(0, 2).join('')}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold text-foreground truncate">
                                {staffMember.full_name}
                            </h1>
                            <p className="text-xs text-muted-foreground truncate">
                                {staffMember.position} {staffMember.division ? `· ${staffMember.division}` : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Month/Year nav + actions */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Month navigator */}
                    <div className="flex items-center bg-muted/40 rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white hover:shadow-sm"
                            onClick={() => {
                                if (month === 1) {
                                    setMonth(12)
                                    setYear(y => y - 1)
                                } else {
                                    setMonth(m => m - 1)
                                }
                            }}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-semibold min-w-[120px] text-center px-2">
                            {new Date(year, month - 1).toLocaleString('en-PH', {
                                month: 'long', year: 'numeric'
                            })}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-white hover:shadow-sm"
                            onClick={() => {
                                if (month === 12) {
                                    setMonth(1)
                                    setYear(y => y + 1)
                                } else {
                                    setMonth(m => m + 1)
                                }
                            }}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

                    {/* Download Form 48 */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-4"
                        onClick={() => {
                            const p = new URLSearchParams({
                                month: String(month),
                                year: String(year),
                                userId: staffMember.id
                            })
                            window.open(`/api/export/dtr-form48?${p}`, '_blank')
                        }}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Form 48
                    </Button>

                    {/* Log new entry */}
                    {permissions.canLogTime && (
                        <Button
                            size="sm"
                            className="h-10 px-4 shadow-sm"
                            onClick={() => {
                                setEditTarget(null)
                                setSelectedDate('')
                                setLogDialogOpen(true)
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Log Entry
                        </Button>
                    )}
                </div>
            </div>

            {/* DTR Table */}
            <Card className="border-none shadow-premium overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="text-left px-4 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-32">
                                        Date
                                    </th>
                                    <th className="text-center px-3 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        AM In
                                    </th>
                                    <th className="text-center px-3 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        AM Out
                                    </th>
                                    <th className="text-center px-3 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        PM In
                                    </th>
                                    <th className="text-center px-3 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        PM Out
                                    </th>
                                    <th className="text-center px-3 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Undertime
                                    </th>
                                    <th className="text-center px-3 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Status
                                    </th>
                                    {permissions.canEditEntry && (
                                        <th className="text-center px-3 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-24">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {allDays.map(({ day, date, dayName, isWeekend, log }) => {
                                    const isFuture = new Date(date) > new Date(new Date().setHours(0, 0, 0, 0))
                                    const hasLog = !!log

                                    return (
                                        <tr
                                            key={date}
                                            className={cn(
                                                'transition-colors',
                                                isWeekend ? 'bg-muted/10' : 'hover:bg-muted/20',
                                                !hasLog && !isWeekend && !isFuture ? 'bg-red-50/20' : ''
                                            )}
                                        >
                                            {/* Date cell */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        'text-[10px] font-bold uppercase tracking-tight w-8',
                                                        isWeekend ? 'text-muted-foreground/60' : 'text-muted-foreground'
                                                    )}>
                                                        {dayName}
                                                    </span>
                                                    <span className={cn(
                                                        "text-sm font-semibold tabular-nums",
                                                        isWeekend ? "text-muted-foreground" : ""
                                                    )}>
                                                        {String(day).padStart(2, '0')}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* AM In */}
                                            <td className="px-3 py-3 text-center">
                                                {log?.am_arrival
                                                    ? <TimeCell time={log.am_arrival} official="08:00" />
                                                    : <span className="text-muted-foreground/30 font-mono">—</span>
                                                }
                                            </td>

                                            {/* AM Out */}
                                            <td className="px-3 py-3 text-center">
                                                {log?.am_departure
                                                    ? <TimeCell time={log.am_departure} official="12:00" />
                                                    : <span className="text-muted-foreground/30 font-mono">—</span>
                                                }
                                            </td>

                                            {/* PM In */}
                                            <td className="px-3 py-3 text-center">
                                                {log?.pm_arrival
                                                    ? <TimeCell time={log.pm_arrival} official="13:00" />
                                                    : <span className="text-muted-foreground/30 font-mono">—</span>
                                                }
                                            </td>

                                            {/* PM Out */}
                                            <td className="px-3 py-3 text-center">
                                                {log?.pm_departure
                                                    ? <TimeCell time={log.pm_departure} official="17:00" />
                                                    : <span className="text-muted-foreground/30 font-mono">—</span>
                                                }
                                            </td>

                                            {/* Undertime */}
                                            <td className="px-3 py-3 text-center">
                                                {(log?.undertime_hours || log?.undertime_minutes)
                                                    ? <span className="text-xs font-bold text-amber-600 tabular-nums">
                                                        {log.undertime_hours || 0}h {log.undertime_minutes || 0}m
                                                    </span>
                                                    : <span className="text-muted-foreground/30 text-xs font-mono">0</span>
                                                }
                                            </td>

                                            {/* Status */}
                                            <td className="px-3 py-3 text-center">
                                                {isWeekend ? (
                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground/40">
                                                        Weekend
                                                    </span>
                                                ) : !hasLog ? (
                                                    !isFuture ? (
                                                        <Badge variant="outline" className="text-[10px] font-bold bg-red-50 text-red-600 border-red-100 uppercase">
                                                            Absent
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground/20 font-mono text-xs">—</span>
                                                    )
                                                ) : (
                                                    <DTRStatusBadge log={log} />
                                                )}
                                            </td>

                                            {/* Actions */}
                                            {permissions.canEditEntry && (
                                                <td className="px-3 py-3 text-center">
                                                    {!isWeekend && (
                                                        <div className="flex items-center justify-center gap-1">
                                                            {hasLog ? (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                                        onClick={() => {
                                                                            setEditTarget({
                                                                                ...log,
                                                                                date: log.log_date // Map back to date for Form
                                                                            })
                                                                            setLogDialogOpen(true)
                                                                        }}
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                                        onClick={() => handleDelete(log.id)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                !isFuture && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 text-[11px] font-bold text-primary hover:bg-primary/5 uppercase"
                                                                        onClick={() => {
                                                                            setSelectedDate(date)
                                                                            setEditTarget(null)
                                                                            setLogDialogOpen(true)
                                                                        }}
                                                                    >
                                                                        Log
                                                                    </Button>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Log / Edit Dialog */}
            <DTRLogDialog
                open={logDialogOpen}
                onClose={() => {
                    setLogDialogOpen(false)
                    setEditTarget(null)
                    setSelectedDate('')
                }}
                staffId={staffMember.id}
                staffName={staffMember.full_name}
                existingLog={editTarget}
                preselectedDate={selectedDate}
                onSuccess={refreshLogs}
            />
        </div>
    )
}

function TimeCell({
    time, official
}: {
    time: string
    official: string
}) {
    // time format: "HH:MM:SS" or "HH:MM"
    const display = time.substring(0, 5)
    const timeVal = time.substring(0, 5)
    const isLate = timeVal > official
    const isEarly = timeVal < official

    return (
        <span className={cn(
            'text-sm font-medium tabular-nums',
            isLate && 'text-amber-600',
            isEarly && 'text-blue-600',
            !isLate && !isEarly &&
            'text-foreground'
        )}>
            {display}
            {isLate && (
                <span className="text-[10px] ml-0.5">↑</span>
            )}
        </span>
    )
}


function DTRStatusBadge({ log }: {
    log: DTRLog
}) {
    const isLate = log.am_arrival && log.am_arrival > '08:00:00'
    const hasUndertime =
        (log.undertime_hours ?? 0) > 0 ||
        (log.undertime_minutes ?? 0) > 0
    const isComplete =
        log.am_arrival &&
        log.am_departure &&
        log.pm_arrival &&
        log.pm_departure

    if (!isComplete) return (
        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
            Incomplete
        </span>
    )

    if (isLate || hasUndertime) return (
        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
            {isLate ? 'Late' : 'Undertime'}
        </span>
    )

    return (
        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
            Present
        </span>
    )
}
