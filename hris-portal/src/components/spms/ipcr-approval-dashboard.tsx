'use client'

import React, { useState } from 'react'
import {
    useIpcrWorkflow,
    IpcrWorkflowItem
} from '@/hooks/use-ipcr-workflow'
import { StatusBadge } from './status-badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import { IpcrTargetForm } from './ipcr-target-form'
import { useIpcrTargets } from '@/hooks/use-ipcr-targets'
import { Eye, CheckCircle, XCircle, Loader2, FileSearch } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function IpcrApprovalDashboard() {
    const { pendingIpcrs, isLoading, approveIpcr, returnIpcr } = useIpcrWorkflow()
    const [inspectingForm, setInspectingForm] = useState<IpcrWorkflowItem | null>(null)
    const { targets, isLoading: isLoadingTargets } = useIpcrTargets(inspectingForm?.id || null)
    const [isActing, setIsActing] = useState(false)

    const handleApprove = async () => {
        if (!inspectingForm) return
        setIsActing(true)
        try {
            await approveIpcr(inspectingForm.id)
            setInspectingForm(null)
        } finally {
            setIsActing(false)
        }
    }

    const handleReturn = async () => {
        if (!inspectingForm) return
        const remarks = window.prompt("Please provide feedback for the employee:")
        if (remarks === null) return // Cancelled

        setIsActing(true)
        try {
            await returnIpcr(inspectingForm.id, remarks)
            setInspectingForm(null)
        } finally {
            setIsActing(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSearch className="w-5 h-5 text-primary" />
                        Performance Review Registry
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Scanning for submitted forms...</p>
                        </div>
                    ) : pendingIpcrs.length === 0 ? (
                        <div className="py-20 text-center border rounded-xl border-dashed">
                            <p className="text-muted-foreground">No pending IPCRs require action at this time.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Member</TableHead>
                                    <TableHead>Evaluation Period</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Avg. Rating</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingIpcrs.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            {item.profiles?.full_name || 'System User'}
                                        </TableCell>
                                        <TableCell>
                                            {item.ipcr_periods?.year} - {item.ipcr_periods?.semester === 1 ? '1st' : '2nd'} Sem
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={item.status} />
                                        </TableCell>
                                        <TableCell>
                                            {item.final_average_rating ? (
                                                <span className="font-bold">{item.final_average_rating.toFixed(2)}</span>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">Commitment Phase</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setInspectingForm(item)}
                                                className="gap-2"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Inspect
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* INSPECTION MODAL */}
            <Dialog open={!!inspectingForm} onOpenChange={(open) => !open && setInspectingForm(null)}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="border-b pb-4 mb-4">
                        <DialogTitle className="flex items-center justify-between pr-8">
                            <div className="flex items-center gap-3">
                                <span>Auditing: {inspectingForm?.profiles?.full_name}</span>
                                <StatusBadge status={inspectingForm?.status || 'Draft'} />
                            </div>
                            <span className="text-sm font-normal text-muted-foreground">
                                {inspectingForm?.ipcr_periods?.year} - {inspectingForm?.ipcr_periods?.semester === 1 ? '1st' : '2nd'} Semester
                            </span>
                        </DialogTitle>
                    </DialogHeader>

                    {isLoadingTargets ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="pb-20">
                            <IpcrTargetForm
                                initialTargets={targets}
                                isReviewPhase={!!inspectingForm?.final_average_rating}
                                readOnly={true}
                                onSubmit={() => { }} // Read-only form shouldn't trigger submit
                            />
                        </div>
                    )}

                    <DialogFooter className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-center gap-4 z-50">
                        <Button
                            variant="destructive"
                            onClick={handleReturn}
                            disabled={isActing}
                            className="min-w-[140px] gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Return for Revision
                        </Button>
                        <Button
                            disabled={isActing}
                            onClick={handleApprove}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px] gap-2"
                        >
                            {isActing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle className="w-4 h-4" />
                            )}
                            Approve Document
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
