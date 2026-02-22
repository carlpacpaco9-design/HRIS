'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Clock, Calendar as CalendarIcon, Save } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { adminLogDTR } from '@/app/actions/dtr'
import { toast } from 'sonner'

// AM ARRIVAL options (15-min intervals as requested)
const AM_ARRIVAL_OPTIONS = [
    { value: '07:00', label: '7:00 AM' },
    { value: '07:15', label: '7:15 AM' },
    { value: '07:30', label: '7:30 AM' },
    { value: '07:45', label: '7:45 AM' },
    { value: '08:00', label: '8:00 AM ✓', official: true },
    { value: '08:15', label: '8:15 AM (late)' },
    { value: '08:30', label: '8:30 AM (late)' },
    { value: '08:45', label: '8:45 AM (late)' },
    { value: '09:00', label: '9:00 AM (late)' },
    { value: '09:15', label: '9:15 AM (late)' },
    { value: '09:30', label: '9:30 AM (late)' },
    { value: '10:00', label: '10:00 AM (late)' },
    { value: '10:30', label: '10:30 AM (late)' },
    { value: '11:00', label: '11:00 AM (late)' },
]

// AM DEPARTURE options
const AM_DEPARTURE_OPTIONS = [
    { value: '11:00', label: '11:00 AM (early)' },
    { value: '11:15', label: '11:15 AM (early)' },
    { value: '11:30', label: '11:30 AM (early)' },
    { value: '11:45', label: '11:45 AM (early)' },
    { value: '12:00', label: '12:00 PM ✓', official: true },
]

// PM ARRIVAL options
const PM_ARRIVAL_OPTIONS = [
    { value: '13:00', label: '1:00 PM ✓', official: true },
    { value: '13:15', label: '1:15 PM (late)' },
    { value: '13:30', label: '1:30 PM (late)' },
    { value: '13:45', label: '1:45 PM (late)' },
    { value: '14:00', label: '2:00 PM (late)' },
    { value: '14:30', label: '2:30 PM (late)' },
    { value: '15:00', label: '3:00 PM (late)' },
]

// PM DEPARTURE options
const PM_DEPARTURE_OPTIONS = [
    { value: '15:00', label: '3:00 PM (early)' },
    { value: '15:30', label: '3:30 PM (early)' },
    { value: '16:00', label: '4:00 PM (early)' },
    { value: '16:15', label: '4:15 PM (early)' },
    { value: '16:30', label: '4:30 PM (early)' },
    { value: '16:45', label: '4:45 PM (early)' },
    { value: '17:00', label: '5:00 PM ✓', official: true },
    { value: '17:30', label: '5:30 PM' },
    { value: '18:00', label: '6:00 PM' },
]

interface DTRLog {
    id: string
    log_date: string
    am_arrival: string | null
    am_departure: string | null
    pm_arrival: string | null
    pm_departure: string | null
    status: string
    remarks?: string | null
}

interface DTRLogDialogProps {
    open: boolean
    onClose: () => void
    staffId: string
    staffName?: string
    existingLog?: DTRLog | null
    preselectedDate?: string
    onSuccess: () => void
}

export function DTRLogDialog({
    open,
    onClose,
    staffId,
    staffName,
    existingLog,
    preselectedDate,
    onSuccess
}: DTRLogDialogProps) {
    const [date, setDate] = useState('')
    const [amIn, setAmIn] = useState('08:00')
    const [amOut, setAmOut] = useState('12:00')
    const [pmIn, setPmIn] = useState('13:00')
    const [pmOut, setPmOut] = useState('17:00')
    const [remarks, setRemarks] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Initialize form when existingLog or preselectedDate changes
    useEffect(() => {
        if (existingLog) {
            setDate(existingLog.log_date)
            setAmIn(existingLog.am_arrival?.substring(0, 5) || '08:00')
            setAmOut(existingLog.am_departure?.substring(0, 5) || '12:00')
            setPmIn(existingLog.pm_arrival?.substring(0, 5) || '13:00')
            setPmOut(existingLog.pm_departure?.substring(0, 5) || '17:00')
            setRemarks(existingLog.remarks || '')
        } else if (preselectedDate) {
            setDate(preselectedDate)
            setAmIn('08:00')
            setAmOut('12:00')
            setPmIn('13:00')
            setPmOut('17:00')
            setRemarks('')
        }
    }, [existingLog, preselectedDate, open])

    // Calculation logic as requested
    const undertime = useMemo(() => {
        let undertimeMinutes = 0

        // AM late arrival
        if (amIn > '08:00') {
            const [h, m] = amIn.split(':').map(Number)
            undertimeMinutes += (h * 60 + m) - (8 * 60)
        }

        // AM early departure
        if (amOut < '12:00') {
            const [h, m] = amOut.split(':').map(Number)
            undertimeMinutes += (12 * 60) - (h * 60 + m)
        }

        // PM late arrival
        if (pmIn > '13:00') {
            const [h, m] = pmIn.split(':').map(Number)
            undertimeMinutes += (h * 60 + m) - (13 * 60)
        }

        // PM early departure
        if (pmOut < '17:00') {
            const [h, m] = pmOut.split(':').map(Number)
            undertimeMinutes += (17 * 60) - (h * 60 + m)
        }

        return {
            hours: Math.floor(undertimeMinutes / 60),
            minutes: undertimeMinutes % 60
        }
    }, [amIn, amOut, pmIn, pmOut])

    const handleSave = async () => {
        if (!date) {
            toast.error('Please select a date')
            return
        }

        setIsSaving(true)
        try {
            const res = await adminLogDTR({
                staff_id: staffId,
                date,
                am_arrival: amIn,
                am_departure: amOut,
                pm_arrival: pmIn,
                pm_departure: pmOut,
                remarks: remarks || undefined
            })

            if (res.success) {
                toast.success(existingLog ? 'DTR entry updated' : 'DTR entry saved')
                onSuccess()
                onClose()
            } else {
                toast.error(res.error || 'Failed to save entry')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            {existingLog ? 'Edit DTR Entry' : 'Log DTR Entry'}
                        </div>
                    </DialogTitle>
                    {staffName && (
                        <div className="text-sm font-semibold text-foreground mt-1 px-0.5">
                            {staffName}
                        </div>
                    )}
                    <DialogDescription className="mt-1">
                        Official Office Hours: 8:00 AM – 5:00 PM
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Date Selection */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Date for Log Entry
                        </Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Morning Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                Morning Session
                            </span>
                            <div className="h-px w-full bg-border" />
                        </div>

                        <p className="text-[11px] text-muted-foreground italic">
                            Official: 8:00 AM — 12:00 PM
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Time In (AM)</Label>
                                <Select value={amIn} onValueChange={setAmIn}>
                                    <SelectTrigger className={cn(amIn > '08:00' && "border-amber-200 bg-amber-50/30 text-amber-700")}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AM_ARRIVAL_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Time Out (AM)</Label>
                                <Select value={amOut} onValueChange={setAmOut}>
                                    <SelectTrigger className={cn(amOut < '12:00' && "border-amber-200 bg-amber-50/30 text-amber-700")}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AM_DEPARTURE_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Afternoon Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                Afternoon Session
                            </span>
                            <div className="h-px w-full bg-border" />
                        </div>

                        <p className="text-[11px] text-muted-foreground italic">
                            Official: 1:00 PM — 5:00 PM
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Time In (PM)</Label>
                                <Select value={pmIn} onValueChange={setPmIn}>
                                    <SelectTrigger className={cn(pmIn > '13:00' && "border-amber-200 bg-amber-50/30 text-amber-700")}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PM_ARRIVAL_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Time Out (PM)</Label>
                                <Select value={pmOut} onValueChange={setPmOut}>
                                    <SelectTrigger className={cn(pmOut < '17:00' && "border-amber-200 bg-amber-50/30 text-amber-700")}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PM_DEPARTURE_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Undertime Display */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">
                            Calculated Undertime:
                        </span>
                        <span className={cn(
                            'text-sm font-bold',
                            (undertime.hours > 0 || undertime.minutes > 0)
                                ? 'text-amber-600'
                                : 'text-green-600'
                        )}>
                            {undertime.hours > 0 || undertime.minutes > 0
                                ? `${undertime.hours}h ${undertime.minutes}m`
                                : 'No undertime ✓'
                            }
                        </span>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-2">
                        <Label className="text-xs">Remarks (optional)</Label>
                        <Input
                            placeholder="e.g. Official Business, Half day, etc."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="text-sm"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                        {isSaving && <Clock className="w-4 h-4 animate-spin" />}
                        {!isSaving && <Save className="w-4 h-4" />}
                        {existingLog ? 'Update Entry' : 'Save DTR Entry'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
