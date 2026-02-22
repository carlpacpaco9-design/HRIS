'use client'

import { useState, useEffect } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { approveLeave, rejectLeave, LeaveRequest } from '@/app/actions/leaves'
import { format } from 'date-fns'

export function ApproveLeaveDialog({
    isOpen,
    onOpenChange,
    leave,
    mode,
    onSave
}: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    leave: LeaveRequest | null
    mode: 'approve' | 'reject'
    onSave: () => void
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [remarks, setRemarks] = useState('')

    useEffect(() => {
        if (isOpen) {
            setRemarks('')
        }
    }, [isOpen])

    const handleAction = async () => {
        if (!leave) return

        if (mode === 'reject' && !remarks.trim()) {
            toast.error('Please specify a reason for rejection')
            return
        }

        setIsLoading(true)

        let res
        if (mode === 'approve') {
            res = await approveLeave(leave.id, remarks)
        } else {
            res = await rejectLeave(leave.id, remarks)
        }

        setIsLoading(false)

        if (res.success) {
            toast.success(`Leave ${mode === 'approve' ? 'approved' : 'rejected'}`)
            onOpenChange(false)
            onSave()
        } else {
            toast.error(res.error || `Failed to ${mode} leave`)
        }
    }

    if (!leave) return null

    const periodStr = `${format(new Date(leave.date_from), 'MMM d')} – ${format(new Date(leave.date_to), 'MMM d, yyyy')}`

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'approve' ? 'Approve' : 'Reject'} Leave Request</DialogTitle>
                    <DialogDescription>
                        {mode === 'approve' ? 'Review and approve this leave request.' : 'Provide a reason for rejecting this leave request.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="bg-slate-50 p-4 rounded-md border text-sm">
                        <p className="font-medium text-slate-900 mb-1">{leave.profiles?.full_name}</p>
                        <p className="text-slate-600 mb-2">{leave.leave_type}</p>
                        <p className="text-slate-700">Period: <span className="font-medium">{periodStr} ({leave.working_days} days)</span></p>
                        <div className="mt-2 pt-2 border-t">
                            <span className="text-slate-500 block text-xs mb-1">Reason for leave:</span>
                            <p className="text-slate-700 italic">{leave.reason}</p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Remarks {mode === 'reject' && <span className="text-red-500">*</span>}</Label>
                        <Textarea
                            className="resize-none"
                            rows={3}
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            placeholder={mode === 'reject' ? "Reason for rejection (required)..." : "Optional notes..."}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleAction}
                        disabled={isLoading || (mode === 'reject' && !remarks.trim())}
                        className={mode === 'reject' ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Processing...' : (mode === 'approve' ? 'Approve' : 'Reject')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
