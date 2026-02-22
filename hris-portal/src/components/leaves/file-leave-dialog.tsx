'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { LEAVE_TYPES, isTrackedLeave, calculateWorkingDays } from '@/lib/leave-utils'
import { fileLeaveRequest, LeaveBalance } from '@/app/actions/leaves'

export function FileLeaveDialog({
    isOpen,
    onOpenChange,
    balance,
    onSave
}: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    balance: LeaveBalance | null
    onSave: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        leave_type: '',
        date_from: '',
        date_to: '',
        reason: ''
    })
    const [workingDays, setWorkingDays] = useState(0)
    const [remainingBalance, setRemainingBalance] = useState<number | null>(null)

    useEffect(() => {
        if (isOpen) {
            setFormData({ leave_type: '', date_from: '', date_to: '', reason: '' })
            setWorkingDays(0)
            setRemainingBalance(null)
        }
    }, [isOpen])

    useEffect(() => {
        if (formData.date_from && formData.date_to) {
            const days = calculateWorkingDays(formData.date_from, formData.date_to)
            setWorkingDays(days)
        } else {
            setWorkingDays(0)
        }
    }, [formData.date_from, formData.date_to])

    useEffect(() => {
        if (formData.leave_type && isTrackedLeave(formData.leave_type) && balance) {
            let rem = 0
            switch (formData.leave_type) {
                case 'Vacation Leave': rem = balance.vacation_leave_total - balance.vacation_leave_used; break;
                case 'Sick Leave': rem = balance.sick_leave_total - balance.sick_leave_used; break;
            }
            setRemainingBalance(rem)
        } else {
            setRemainingBalance(null)
        }
    }, [formData.leave_type, balance])

    const isInsufficient = remainingBalance !== null && workingDays > remainingBalance

    const handleSave = async () => {
        if (!formData.leave_type || !formData.date_from || !formData.date_to || !formData.reason) {
            toast.error('Please fill all required fields')
            return
        }

        if (workingDays <= 0) {
            toast.error('Invalid date range or no working days selected')
            return
        }

        if (isInsufficient) {
            toast.error('Insufficient leave balance')
            return
        }

        setIsLoading(true)

        const res = await fileLeaveRequest(formData)

        setIsLoading(false)

        if (res.success) {
            toast.success('Leave request filed successfully')
            onOpenChange(false)
            onSave()
        } else {
            toast.error(res.error || 'Failed to file leave')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>File Leave Request</DialogTitle>
                    <DialogDescription>Submit a new leave application.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Leave Type <span className="text-red-500">*</span></Label>
                        <Select value={formData.leave_type} onValueChange={v => setFormData({ ...formData, leave_type: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                            <SelectContent>
                                {LEAVE_TYPES.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Date From <span className="text-red-500">*</span></Label>
                            <Input type="date" value={formData.date_from} onChange={e => setFormData({ ...formData, date_from: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Date To <span className="text-red-500">*</span></Label>
                            <Input type="date" value={formData.date_to} onChange={e => setFormData({ ...formData, date_to: e.target.value })} />
                        </div>
                    </div>

                    {formData.leave_type && isTrackedLeave(formData.leave_type) && (
                        <div className={`p-4 rounded-md border text-sm ${isInsufficient ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                            <h4 className="font-semibold mb-1">Balance Check</h4>
                            {remainingBalance !== null ? (
                                <p>Remaining: <span className="font-medium">{remainingBalance} days</span></p>
                            ) : (
                                <p>Remaining: <span className="font-medium italic">Unlimited</span></p>
                            )}
                            <p>Requested: <span className="font-medium">{workingDays} working days</span></p>

                            {isInsufficient && (
                                <p className="text-red-600 font-medium mt-2">
                                    Insufficient balance. {remainingBalance} days remaining, {workingDays} days requested.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label>Reason <span className="text-red-500">*</span></Label>
                        <Textarea
                            className="resize-none"
                            rows={3}
                            value={formData.reason}
                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="State the reason of your leave..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading || isInsufficient}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Submitting...' : 'Submit Leave'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
