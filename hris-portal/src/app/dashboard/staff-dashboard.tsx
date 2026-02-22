'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, FileText, CheckCircle2, Clock, CalendarDays, Activity } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const STATUS_BADGES: Record<string, any> = {
    'draft': <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-300">Draft</Badge>,
    'submitted': <Badge className="bg-amber-500 hover:bg-amber-600 text-amber-950 border-none shadow-sm">Submitted</Badge>,
    'reviewed': <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none shadow-sm">Reviewed</Badge>,
    'finalized': <Badge className="bg-green-600 hover:bg-green-700 text-white border-none shadow-sm">Finalized</Badge>,
    'returned': <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none shadow-sm">Returned</Badge>,
}

const LEAVE_STATUS_BADGES: Record<string, any> = {
    'approved': <Badge className="bg-green-500 hover:bg-green-600 text-green-950 border-none">Approved ✓</Badge>,
    'pending_approval': <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pending...</Badge>,
    'rejected': <Badge className="bg-rose-500 hover:bg-rose-600 text-rose-950 border-none">Rejected ×</Badge>,
    'cancelled': <Badge variant="outline" className="text-slate-500 border-slate-300">Cancelled</Badge>
}

export function StaffDashboard({ stats, profile }: { stats: any; profile: any }) {
    const dateStr = format(new Date(), 'EEEE, MMMM d, yyyy')

    const vlRemaining = stats.leaveBalances.vacation_leave_total - stats.leaveBalances.vacation_leave_used
    const slRemaining = stats.leaveBalances.sick_leave_total - stats.leaveBalances.sick_leave_used

    return (
        <div className="space-y-6">
            <div className="flex flex-col mb-4">
                <span className="text-slate-500">{dateStr}</span>
                <span className="text-amber-600 font-medium text-sm mt-1">{profile.position} · {profile.division}</span>
            </div>

            {/* QUICK STATS ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 sm:p-6 flex flex-col items-center sm:items-start text-center sm:text-left">
                        <h3 className="text-3xl font-bold text-slate-900">{vlRemaining}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">VL Left (days)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 sm:p-6 flex flex-col items-center sm:items-start text-center sm:text-left">
                        <h3 className="text-3xl font-bold text-slate-900">{slRemaining}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">SL Left (days)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 sm:p-6 flex flex-col items-center sm:items-start text-center sm:text-left">
                        <h3 className="text-3xl font-bold text-amber-600">{stats.pendingLeaveCount}</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">Pend. Leaves</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 sm:p-6 flex flex-col items-center sm:items-start text-center sm:text-left">
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 truncate w-full" title={stats.myIPCR ? stats.myIPCR.status.toUpperCase() : 'PENDING'}>
                            {stats.myIPCR ? stats.myIPCR.status.toUpperCase() : 'PENDING'}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">IPCR Status</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="flex flex-col space-y-6">
                    {/* MY IPCR THIS CYCLE */}
                    <Card>
                        <CardHeader className="bg-slate-50 border-b pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                My IPCR ({stats.activeCycle?.name})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {stats.myIPCR ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                        <span className="font-medium text-slate-700">Status</span>
                                        {STATUS_BADGES[stats.myIPCR.status]}
                                    </div>
                                    <div className="flex justify-between items-center text-sm px-1">
                                        <span className="text-slate-500">Outputs attached:</span>
                                        <span className="font-bold text-slate-900">{stats.myIPCR.ipcr_outputs?.[0]?.count || 0} items</span>
                                    </div>
                                    <Button asChild className="w-full bg-[#1E3A5F] mt-2">
                                        <Link href="/dashboard/ipcr">{stats.myIPCR.status === 'draft' || stats.myIPCR.status === 'returned' ? 'Continue Editing →' : 'View IPCR →'}</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 mb-4 font-medium">You haven't started your IPCR for this cycle.</p>
                                    <Button asChild className="w-full bg-[#1E3A5F] hover:bg-blue-800">
                                        <Link href="/dashboard/ipcr">Create My IPCR →</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* DTR SUMMARY */}
                    <Card>
                        <CardHeader className="bg-slate-50 border-b pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                My DTR — {format(new Date(), 'MMMM')}
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 text-sm" asChild>
                                <Link href="/dashboard/dtr">View Full DTR →</Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-600 font-medium">Days Logged</span>
                                        <span className="font-bold text-slate-900">{stats.dtrThisMonth.daysLogged} / {stats.dtrThisMonth.workingDaysInMonth}</span>
                                    </div>
                                    <Progress value={(stats.dtrThisMonth.daysLogged / stats.dtrThisMonth.workingDaysInMonth) * 100} className="h-2 bg-slate-100" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100">
                                    <span className="text-rose-700 text-sm font-medium flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> Total Undertime
                                    </span>
                                    <span className="font-bold text-rose-800">
                                        {Math.floor(stats.dtrThisMonth.totalUndertime / 60)} hr {stats.dtrThisMonth.totalUndertime % 60} min
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RECENT LEAVES */}
                <Card className="h-max">
                    <CardHeader className="bg-slate-50 border-b pb-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-green-500" />
                            Recent Leaves
                        </CardTitle>
                        <Button variant="ghost" size="sm" className="h-8 text-sm" asChild>
                            <Link href="/dashboard/leaves">View All →</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {stats.recentLeaves.map((leave: any) => (
                                <div key={leave.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                                    <div>
                                        <div className="font-medium text-slate-900 flex items-center gap-2">
                                            {leave.leave_type}
                                            <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">{leave.working_days}d</span>
                                        </div>
                                        <div className="text-sm text-slate-500 mt-1">
                                            {format(new Date(leave.date_from), 'MMM d')} - {format(new Date(leave.date_to), 'MMM d')}
                                        </div>
                                    </div>
                                    <div>
                                        {LEAVE_STATUS_BADGES[leave.status]}
                                    </div>
                                </div>
                            ))}
                            {stats.recentLeaves.length === 0 && (
                                <div className="p-8 flex flex-col items-center justify-center text-slate-500">
                                    <CalendarDays className="w-10 h-10 text-slate-200 mb-3" />
                                    <p>No recent leave applications.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
