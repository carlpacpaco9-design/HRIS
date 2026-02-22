'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Loader2, FileText, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface LeaveApplication {
    id: string
    leave_type: string
    number_of_days: number
    inclusive_dates: string
    details_of_leave: string
    status: string
    profiles: {
        full_name: string
    }
}

export function LeaveApprovalDashboard() {
    const [applications, setApplications] = useState<LeaveApplication[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [actingId, setActingId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchApplications()
    }, [])

    async function fetchApplications() {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('leave_applications')
            .select(`
        *,
        profiles:employee_id (full_name)
      `)
            .eq('status', 'Pending')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setApplications(data as any[])
        }
        setIsLoading(false)
    }

    const handleApprove = async (id: string) => {
        setActingId(id)
        try {
            // Direct call to RPC for atomic transaction
            const { error } = await supabase.rpc('approve_leave_application', { p_application_id: id })

            if (error) throw error

            toast.success("Leave application approved and credits deducted.")
            setApplications(prev => prev.filter(app => app.id !== id))
        } catch (err: any) {
            toast.error(err.message || "Approval failed")
        } finally {
            setActingId(null)
        }
    }

    const handleDisapprove = async (id: string) => {
        const remarks = window.prompt("Reason for disapproval:")
        if (remarks === null) return

        setActingId(id)
        try {
            const { error } = await supabase
                .from('leave_applications')
                .update({ status: 'Disapproved', remarks })
                .eq('id', id)

            if (error) throw error

            toast.success("Application disapproved.")
            setApplications(prev => prev.filter(app => app.id !== id))
        } catch (err: any) {
            toast.error(err.message || "Action failed")
        } finally {
            setActingId(null)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Pending Leave Requests
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : applications.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed rounded-xl">
                        <p className="text-muted-foreground italic">No leave requests requiring approval.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Leave Type</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Days</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-bold">{app.profiles.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-muted/50 uppercase text-[10px]">
                                            {app.leave_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {app.inclusive_dates}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {app.number_of_days}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDisapprove(app.id)}
                                                disabled={actingId === app.id}
                                                className="text-red-500 hover:bg-red-50"
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Disapprove
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(app.id)}
                                                disabled={actingId === app.id}
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                {actingId === app.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                )}
                                                Approve
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
