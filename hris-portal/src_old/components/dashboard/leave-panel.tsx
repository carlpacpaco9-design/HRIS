'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { CalendarIcon, Clock, CheckCircle2, XCircle, FilePlus, AlertCircle } from "lucide-react"
import { submitLeaveApplication, cancelLeaveApplication, LeaveRequest } from "@/app/actions/leaves"
import { LeaveBalanceWidget } from "@/components/dashboard/leave-balance-widget"
import { format } from "date-fns"
import { LeaveForm } from "@/components/leaves/leave-form"
import { SubmitButton } from "@/components/ui/submit-button"

interface LeavePanelProps {
    balances: any
    applications: LeaveRequest[]
}

export function LeavePanel({ balances, applications }: LeavePanelProps) {
    const [isLoading, setIsLoading] = useState(false)


    async function handleCancel(id: string) {
        if (!confirm("Are you sure you want to cancel this application?")) return

        const result = await cancelLeaveApplication(id)
        if ('error' in result) {
            toast.error("Cancel Failed", {
                description: result.error
            })
        } else {
            toast.success("Application Cancelled", {
                description: "Leave application cancelled successfully."
            })
        }
    }

    const pending = applications.filter(a => a.status === 'pending_recommendation' || a.status === 'pending_approval')
    const history = applications.filter(a => a.status !== 'pending_recommendation' && a.status !== 'pending_approval')

    return (
        <div className="grid gap-6 md:grid-cols-12">
            {/* Sidebar / Balance Summary */}
            <div className="md:col-span-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Leave Credits</CardTitle>
                        <CardDescription>Available balances for 2024</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LeaveBalanceWidget balance={balances} />
                    </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-semibold mb-1">Policy Reminder</p>
                                <p>Applications must be submitted at least 5 days before the intended leave date for Vacation Leaves.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="md:col-span-8">
                <Tabs defaultValue="apply" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="apply">Apply for Leave</TabsTrigger>
                        <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    {/* Apply Tab */}
                    <TabsContent value="apply">
                        <Card>
                            <CardHeader>
                                <CardTitle>New Leave Application</CardTitle>
                                <CardDescription>Fill out the details below to request a leave.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <LeaveForm
                                    onSubmit={async (data) => {
                                        setIsLoading(true);
                                        const result = await submitLeaveApplication({
                                            leave_type: data.leave_type,
                                            start_date: data.date_from,
                                            end_date: data.date_to,
                                            reason: data.reason,
                                            is_half_day: data.is_half_day
                                        });
                                        setIsLoading(false);

                                        if ('success' in result) {
                                            toast.success("Application Submitted", {
                                                description: "Your leave application has been submitted for approval."
                                            });
                                        } else {
                                            toast.error("Application Failed", {
                                                description: result.error
                                            });
                                        }
                                    }}
                                    onCancel={() => { }}
                                    isSaving={isLoading}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>



                    {/* Pending Tab */}
                    <TabsContent value="pending">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Applications</CardTitle>
                                <CardDescription>Track the status of your current requests.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {pending.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <FilePlus className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p>No pending applications.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pending.map(app => (
                                            <div key={app.id} className="flex justify-between items-start p-4 border rounded-lg bg-slate-50/50">
                                                <div>
                                                    <div className="font-semibold text-slate-900">{app.leave_type}</div>
                                                    <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                                                        <CalendarIcon className="h-3.5 w-3.5" />
                                                        {format(new Date(app.start_date), 'MMM d, yyyy')} - {format(new Date(app.end_date), 'MMM d, yyyy')}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-2 line-clamp-1">{app.reason}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                        Pending Approval
                                                    </Badge>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs" onClick={() => handleCancel(app.id)}>
                                                        Cancel Request
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Application History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Dates</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Date Filed</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-slate-500 py-8">No history found.</TableCell>
                                            </TableRow>
                                        ) : (
                                            history.map(app => (
                                                <TableRow key={app.id}>
                                                    <TableCell className="font-medium">{app.leave_type}</TableCell>
                                                    <TableCell className="text-slate-600 text-xs">
                                                        {format(new Date(app.start_date), 'MMM d')} - {format(new Date(app.end_date), 'MMM d, yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            app.status === 'approved' ? 'default' :
                                                                app.status === 'rejected' ? 'destructive' : 'secondary'
                                                        }>
                                                            {app.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs text-slate-400">
                                                        {format(new Date(app.created_at || new Date()), 'MMM d, yyyy')}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
