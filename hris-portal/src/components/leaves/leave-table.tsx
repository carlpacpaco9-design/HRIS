'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'
import { Check, X, Download, ShieldBan } from 'lucide-react'
import { LeaveRequest, cancelLeave } from '@/app/actions/leaves'
import { toast } from 'sonner'
import { FileLeaveDialog } from './file-leave-dialog'
import { ApproveLeaveDialog } from './approve-leave-dialog'
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

type LeaveTableProps = {
    leaves: LeaveRequest[]
    isHRManager: boolean
    isDivisionChief: boolean
    currentUserId: string
    // optionally pass the UI balance so we can provide it to FileLeaveDialog if they file via this component?
    // the spec says we use FileLeaveDialog natively on the page, but let's keep it composable.
}

export function LeaveTable({
    leaves,
    isHRManager,
    currentUserId
}: LeaveTableProps) {
    const router = useRouter()
    const [isApproveOpen, setIsApproveOpen] = useState(false)
    const [approveMode, setApproveMode] = useState<'approve' | 'reject'>('approve')
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null)
    const [isCancelOpen, setIsCancelOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const handleApprove = (leave: LeaveRequest) => {
        setSelectedLeave(leave)
        setApproveMode('approve')
        setIsApproveOpen(true)
    }

    const handleReject = (leave: LeaveRequest) => {
        setSelectedLeave(leave)
        setApproveMode('reject')
        setIsApproveOpen(true)
    }

    const handleCancelClick = (leave: LeaveRequest) => {
        setSelectedLeave(leave)
        setIsCancelOpen(true)
    }

    const confirmCancel = async () => {
        if (!selectedLeave) return
        const res = await cancelLeave(selectedLeave.id)
        if (res.success) {
            toast.success("Leave cancelled successfully")
            router.refresh()
        } else {
            toast.error(res.error || "Failed to cancel leave")
        }
        setIsCancelOpen(false)
    }

    const handleExport = async (leaveId: string, employeeName: string) => {
        setIsExporting(true)
        try {
            const res = await fetch(`/api/leaves/application?leaveId=${leaveId}`)
            if (!res.ok) throw new Error('Export failed')

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `LeaveApplication_${employeeName.replace(/\s+/g, '_')}.docx`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)

            toast.success("Leave application exported")
        } catch (err) {
            toast.error("Failed to export leave application")
        }
        setIsExporting(false)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_approval': return <Badge className="bg-amber-500">Pending</Badge>
            case 'approved': return <Badge className="bg-green-600">Approved</Badge>
            case 'rejected': return <Badge className="bg-rose-500">Rejected</Badge>
            case 'cancelled': return <Badge variant="outline" className="text-slate-500 border-slate-300">Cancelled</Badge>
            default: return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        {isHRManager && <TableHead>Employee</TableHead>}
                        <TableHead>Type</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Filed On</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leaves.map((leave) => {
                        const isOwn = leave.employee_id === currentUserId
                        const isPending = leave.status === 'pending_approval'
                        const isApproved = leave.status === 'approved'

                        const showCancel = (isOwn && isPending) || (isHRManager && (isPending || isApproved))
                        const showHRControls = isHRManager && isPending

                        // Allow export for employee themselves (own leaves) or HR manager (all leaves)
                        const showExport = isOwn || isHRManager

                        return (
                            <TableRow key={leave.id}>
                                {isHRManager && (
                                    <TableCell className="font-medium">
                                        {leave.profiles?.full_name}
                                        <div className="text-xs text-slate-500 font-normal">{leave.profiles?.division}</div>
                                    </TableCell>
                                )}
                                <TableCell>{leave.leave_type}</TableCell>
                                <TableCell>
                                    {format(new Date(leave.date_from), 'MMM d, yyyy')} – {format(new Date(leave.date_to), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>{leave.working_days}</TableCell>
                                <TableCell>{format(new Date(leave.created_at), 'MMM d, yyyy')}</TableCell>
                                <TableCell>{getStatusBadge(leave.status)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {showExport && (
                                            <Button variant="ghost" size="icon" title="Export Form 6" onClick={() => handleExport(leave.id, leave.profiles?.full_name || 'Employee')}>
                                                <Download className="h-4 w-4 text-slate-500" />
                                            </Button>
                                        )}

                                        {showHRControls && (
                                            <>
                                                <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50" size="sm" onClick={() => handleApprove(leave)}>
                                                    <Check className="mr-1 h-3 w-3" /> Approve
                                                </Button>
                                                <Button variant="outline" className="border-rose-600 text-rose-700 hover:bg-rose-50" size="sm" onClick={() => handleReject(leave)}>
                                                    <X className="mr-1 h-3 w-3" /> Reject
                                                </Button>
                                            </>
                                        )}

                                        {showCancel && (
                                            <Button variant="ghost" className="text-slate-500 hover:text-slate-700 hover:bg-slate-100" size="sm" onClick={() => handleCancelClick(leave)}>
                                                <ShieldBan className="mr-1 h-3 w-3" /> Cancel
                                            </Button>
                                        )}

                                        {!showHRControls && !showCancel && (
                                            <span className="text-xs text-slate-400 italic">No actions available</span>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}

                    {leaves.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={isHRManager ? 7 : 6} className="text-center py-8 text-slate-500">
                                No leave requests found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <ApproveLeaveDialog
                isOpen={isApproveOpen}
                onOpenChange={setIsApproveOpen}
                leave={selectedLeave}
                mode={approveMode}
                onSave={() => router.refresh()}
            />

            <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this leave request?
                            {selectedLeave?.status === 'approved' && isHRManager ? ' Note: The deducted balance will be restored for an approved leave.' : ''}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Go Back</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmCancel} className="bg-rose-600 hover:bg-rose-700">
                            Confirm Cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
