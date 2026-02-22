'use client'

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, Clock, CalendarDays, MessageSquare } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { approveLeaveApplication, rejectLeaveApplication } from "@/app/actions/leaves"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type LeaveRequest = {
    id: string
    leave_type: string
    start_date: string
    end_date: string
    reason: string
    created_at: string
    staff: {
        full_name: string
        division: string
        position: string
        email: string
    }
}

export function LeaveApprovalsTab({ leaves }: { leaves: LeaveRequest[] }) {
    const [isProcessing, setIsProcessing] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")

    const handleApprove = async (id: string, remarks?: string) => {
        setIsProcessing(id)
        const res = await approveLeaveApplication(id, remarks)
        setIsProcessing(null)

        if ('success' in res && res.success) {
            toast.success("Leave application approved")
        } else {
            const errorMsg = 'error' in res ? res.error : "Failed to approve leave"
            toast.error(errorMsg)
        }
    }

    const handleReject = async (id: string) => {
        if (!rejectionReason.trim()) {
            toast.error("Rejection reason is required")
            return
        }

        setIsProcessing(id)
        const res = await rejectLeaveApplication(id, rejectionReason)
        setIsProcessing(null)

        if ('success' in res && res.success) {
            toast.success("Leave application rejected")
            setRejectionReason("")
        } else {
            const errorMsg = 'error' in res ? res.error : "Failed to reject leave"
            toast.error(errorMsg)
        }
    }

    if (leaves.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg border-slate-200 bg-slate-50">
                <div className="bg-green-100 p-3 rounded-full mb-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                <p className="text-slate-500 max-w-sm mt-1">
                    There are no pending leave applications to review at this time.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {leaves.map((leave) => (
                <Card key={leave.id} className="overflow-hidden">
                    <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                            {/* Left: Staff Info */}
                            <div className="bg-slate-50 p-6 md:w-1/3 border-r border-slate-100 flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-slate-200">
                                        <AvatarFallback className="bg-white text-slate-700 font-semibold">
                                            {getInitials(leave.staff.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-semibold text-slate-900">{leave.staff.full_name}</div>
                                        <div className="text-xs text-slate-500">{leave.staff.position}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500">
                                    <div className="font-medium text-slate-700 mb-1">Division</div>
                                    {leave.staff.division || 'Unassigned'}
                                </div>
                                <div className="mt-auto pt-4 border-t border-slate-200 text-xs text-slate-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Filed {format(parseISO(leave.created_at), 'MMM d, yyyy h:mm a')}
                                </div>
                            </div>

                            {/* Right: Leave Details & Actions */}
                            <div className="p-6 md:w-2/3 flex flex-col justify-between gap-6">
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <Badge variant="outline" className="mb-2 border-blue-200 bg-blue-50 text-blue-700">
                                                {leave.leave_type}
                                            </Badge>
                                            <div className="flex items-center gap-2 text-slate-900 font-medium text-lg">
                                                <CalendarDays className="h-5 w-5 text-slate-400" />
                                                <span>
                                                    {format(parseISO(leave.start_date), 'MMM d')} – {format(parseISO(leave.end_date), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-100 rounded-md p-3 text-sm text-amber-900 flex items-start gap-2">
                                        <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 opacity-50" />
                                        "{leave.reason}"
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end border-t border-slate-100 pt-4">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                                                <XCircle className="mr-2 h-4 w-4" /> Reject
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Reject Leave Request</DialogTitle>
                                                <DialogDescription>
                                                    Please provide a reason for rejecting this leave application. The staff member will be notified.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4">
                                                <Label htmlFor="reason" className="mb-2 block">Reason for Rejection</Label>
                                                <Textarea
                                                    id="reason"
                                                    placeholder="e.g., Critical deadline overlap, insufficient leave balance..."
                                                    value={rejectionReason}
                                                    onChange={e => setRejectionReason(e.target.value)}
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => handleReject(leave.id)}
                                                    disabled={isProcessing === leave.id}
                                                >
                                                    {isProcessing === leave.id ? 'Processing...' : 'Reject Application'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button className="bg-green-600 hover:bg-green-700 text-white">
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80">
                                            <div className="space-y-4">
                                                <h4 className="font-medium leading-none">Confirm Approval</h4>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="remarks">Remarks (Optional)</Label>
                                                    <Input
                                                        id="remarks"
                                                        placeholder="e.g., Approved, enjoy your leave"
                                                        onKeyDown={async (e) => {
                                                            if (e.key === 'Enter') {
                                                                await handleApprove(leave.id, (e.target as any).value)
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <Button
                                                    className="w-full bg-green-600 hover:bg-green-700"
                                                    onClick={async () => {
                                                        const input = document.getElementById('remarks') as HTMLInputElement
                                                        await handleApprove(leave.id, input.value)
                                                    }}
                                                    disabled={isProcessing === leave.id}
                                                >
                                                    {isProcessing === leave.id ? 'Approving...' : 'Confirm Approval'}
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
