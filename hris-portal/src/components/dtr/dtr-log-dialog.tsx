'use client'

import { useState, useEffect } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { calculateUndertime } from '@/lib/dtr-utils'
import { createDTRLog, updateDTRLog, CreateDTRInput, DTRLog } from '@/app/actions/dtr'
import { format } from 'date-fns'

function generateTimeOptions() {
    const options = []
    for (let h = 7; h <= 18; h++) {
        for (const m of [0, 15, 30, 45]) {
            if (h === 18 && m > 0) break
            const hh = h.toString().padStart(2, '0')
            const mm = m.toString().padStart(2, '0')
            const value = `${hh}:${mm}`

            const period = h >= 12 ? 'PM' : 'AM'
            let h12 = h % 12
            if (h12 === 0) h12 = 12
            const label = `${h12}:${mm} ${period}`

            options.push({ value, label })
        }
    }
    return options
}

const TIME_OPTIONS = generateTimeOptions()

export function DTRLogDialog({
    isOpen,
    onOpenChange,
    log, // Existing log if editing
    date, // "YYYY-MM-DD"
    employeeId,
    onSave
}: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    log?: DTRLog | null
    date: string
    employeeId: string
    onSave: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<CreateDTRInput>>({
        am_arrival: '',
        am_departure: '',
        pm_arrival: '',
        pm_departure: '',
        remarks: ''
    })
    const [undertimePreview, setUndertimePreview] = useState({ hours: 0, minutes: 0 })

    useEffect(() => {
        if (isOpen) {
            if (log) {
                setFormData({
                    am_arrival: log.am_arrival?.substring(0, 5) || '',
                    am_departure: log.am_departure?.substring(0, 5) || '',
                    pm_arrival: log.pm_arrival?.substring(0, 5) || '',
                    pm_departure: log.pm_departure?.substring(0, 5) || '',
                    remarks: log.remarks || ''
                })
            } else {
                setFormData({
                    am_arrival: '08:00',
                    am_departure: '12:00',
                    pm_arrival: '13:00',
                    pm_departure: '17:00',
                    remarks: ''
                })
            }
        }
    }, [isOpen, log])

    useEffect(() => {
        if (formData.am_arrival && formData.am_departure && formData.pm_arrival && formData.pm_departure) {
            const u = calculateUndertime(
                formData.am_arrival,
                formData.am_departure,
                formData.pm_arrival,
                formData.pm_departure
            )
            setUndertimePreview(u)
        } else {
            setUndertimePreview({ hours: 0, minutes: 0 })
        }
    }, [formData.am_arrival, formData.am_departure, formData.pm_arrival, formData.pm_departure])

    const handleSave = async () => {
        setIsLoading(true)

        const payload = {
            employee_id: employeeId,
            log_date: date,
            am_arrival: formData.am_arrival || undefined,
            am_departure: formData.am_departure || undefined,
            pm_arrival: formData.pm_arrival || undefined,
            pm_departure: formData.pm_departure || undefined,
            remarks: formData.remarks || undefined
        }

        let res
        if (log && log.id) {
            res = await updateDTRLog(log.id, payload)
        } else {
            res = await createDTRLog(payload as CreateDTRInput)
        }

        setIsLoading(false)

        if (res.success) {
            toast.success("DTR entry saved")
            onOpenChange(false)
            onSave()
        } else {
            toast.error(res.error || "Failed to save entry")
        }
    }

    const formattedDate = date ? format(new Date(date), 'EEEE, MMMM d, yyyy') : ''

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{log ? 'Edit' : 'Log'} DTR Entry</DialogTitle>
                    <DialogDescription className="text-slate-900 font-medium">
                        {formattedDate}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">AM Arrival</Label>
                        <div className="col-span-3">
                            <Select value={formData.am_arrival || ''} onValueChange={v => setFormData({ ...formData, am_arrival: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="--:--" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {TIME_OPTIONS.map(o => <SelectItem key={`am_arr_${o.value}`} value={o.value}>{o.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">AM Departure</Label>
                        <div className="col-span-3">
                            <Select value={formData.am_departure || ''} onValueChange={v => setFormData({ ...formData, am_departure: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="--:--" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {TIME_OPTIONS.map(o => <SelectItem key={`am_dep_${o.value}`} value={o.value}>{o.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">PM Arrival</Label>
                        <div className="col-span-3">
                            <Select value={formData.pm_arrival || ''} onValueChange={v => setFormData({ ...formData, pm_arrival: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="--:--" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {TIME_OPTIONS.map(o => <SelectItem key={`pm_arr_${o.value}`} value={o.value}>{o.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">PM Departure</Label>
                        <div className="col-span-3">
                            <Select value={formData.pm_departure || ''} onValueChange={v => setFormData({ ...formData, pm_departure: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="--:--" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {TIME_OPTIONS.map(o => <SelectItem key={`pm_dep_${o.value}`} value={o.value}>{o.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Remarks</Label>
                        <div className="col-span-3">
                            <Input
                                value={formData.remarks || ''}
                                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                placeholder="Optional notes"
                            />
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 border rounded-md">
                        <div className="text-sm font-medium flex justify-between">
                            <span>Undertime Preview:</span>
                            <span className={undertimePreview.hours > 0 || undertimePreview.minutes > 0 ? "text-red-500 font-bold" : "text-green-600 font-bold"}>
                                {undertimePreview.hours} hrs {undertimePreview.minutes} min
                            </span>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Saving...' : 'Save Entry'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
