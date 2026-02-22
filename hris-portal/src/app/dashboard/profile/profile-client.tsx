'use client'

import { format } from 'date-fns'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Settings, FileText, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"

type ProfileClientProps = {
    profile: any
    leaveBalance: any
    recentLeaves: any[]
    ipcrHistory: any[]
    isOwnProfile: boolean
    canEdit: boolean
}

export function ProfileClient({
    profile,
    leaveBalance,
    recentLeaves,
    ipcrHistory,
    isOwnProfile,
    canEdit
}: ProfileClientProps) {

    const formatRole = (role: string) => {
        switch (role) {
            case 'head_of_office': return 'Head of Office'
            case 'admin_staff': return 'Administrative Staff'
            case 'division_chief': return 'Division Chief'
            case 'project_staff': return 'Regular Employee'
            case 'pmt_member': return 'PMT Member'
            default: return role
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-500 text-green-950 border-none">Approved</Badge>
            case 'pending_approval': return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pending</Badge>
            case 'rejected': return <Badge className="bg-rose-500 text-rose-950 border-none">Rejected</Badge>
            case 'cancelled': return <Badge variant="outline" className="text-slate-500 border-slate-300">Cancelled</Badge>
            default: return <Badge variant="secondary">{status}</Badge>
        }
    }

    // Determine avatar initials
    const initials = profile.full_name ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?'

    const LeaveBalanceItem = ({ title, available, total }: { title: string, available: number, total: number }) => (
        <div className="flex flex-col bg-slate-50 rounded-lg p-4 border border-slate-100">
            <span className="text-sm font-medium text-slate-500">{title}</span>
            <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">{available}</span>
                <span className="text-sm font-medium text-slate-400">/ {total}</span>
            </div>
        </div>
    )

    const defaultBalance = {
        vacation_leave_total: 15, vacation_leave_used: 0,
        sick_leave_total: 15, sick_leave_used: 0,
        special_leave_total: 5, special_leave_used: 0,
        emergency_leave_total: 3, emergency_leave_used: 0
    }

    const bal = leaveBalance || defaultBalance

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{isOwnProfile ? 'My Profile' : `Profile: ${profile.full_name}`}</h1>
                    <p className="text-slate-500">Employee details and history</p>
                </div>

                {canEdit && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => alert('Editing user is implemented in Admin User Management. Future integration here.')}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit Employee
                        </Button>
                        <Button variant="outline" onClick={() => alert('Leave balance adjustment is part of Admin Panel.')}>
                            <Settings className="w-4 h-4 mr-2" /> Adjust Balances
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Basic Info Card */}
                <div className="md:col-span-1">
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-3xl font-bold shadow-sm ring-4 ring-slate-50 mb-4">
                                {initials}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 text-center">{profile.full_name}</h2>
                            <p className="text-[#1E3A5F] font-medium text-center">{profile.position}</p>
                            <Badge variant="secondary" className="mt-2 text-xs">{profile.division}</Badge>

                            <div className="w-full mt-6 space-y-3">
                                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Role</span>
                                    <span className="font-medium text-slate-900">{formatRole(profile.role)}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Status</span>
                                    <span className="font-medium text-slate-900">{profile.employment_status || 'Permanent'}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Employee #</span>
                                    <span className="font-medium text-slate-900">{profile.employee_number || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Date Hired</span>
                                    <span className="font-medium text-slate-900">{profile.date_hired ? format(new Date(profile.date_hired), 'MMM d, yyyy') : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Salary Grade</span>
                                    <span className="font-medium text-slate-900">{profile.salary_grade || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Contact</span>
                                    <span className="font-medium text-slate-900">{profile.contact_number || 'N/A'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">

                    {/* Leave Balances */}
                    <Card>
                        <CardHeader className="pb-3 border-b border-slate-100">
                            <CardTitle className="text-lg">Leave Balances ({(new Date().getFullYear())})</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <LeaveBalanceItem
                                    title="Vacation Leave"
                                    total={bal.vacation_leave_total}
                                    available={bal.vacation_leave_total - bal.vacation_leave_used}
                                />
                                <LeaveBalanceItem
                                    title="Sick Leave"
                                    total={bal.sick_leave_total}
                                    available={bal.sick_leave_total - bal.sick_leave_used}
                                />
                                <LeaveBalanceItem
                                    title="Special Leave"
                                    total={bal.special_leave_total}
                                    available={bal.special_leave_total - bal.special_leave_used}
                                />
                                <LeaveBalanceItem
                                    title="Emergency"
                                    total={bal.emergency_leave_total}
                                    available={bal.emergency_leave_total - bal.emergency_leave_used}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* IPCR History */}
                    <Card>
                        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">IPCR History</CardTitle>
                                <CardDescription>Finalized performance ratings</CardDescription>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="pl-6">Cycle</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Adjectival</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ipcrHistory.map((ipcr) => (
                                        <TableRow key={ipcr.id}>
                                            <TableCell className="pl-6 font-medium">{ipcr.spms_cycles?.name}</TableCell>
                                            <TableCell>{ipcr.final_average_rating ? ipcr.final_average_rating.toFixed(3) : '—'}</TableCell>
                                            <TableCell>{ipcr.adjectival_rating || '—'}</TableCell>
                                        </TableRow>
                                    ))}
                                    {ipcrHistory.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-6 text-slate-500 text-sm">
                                                <FileText className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                                                No finalized IPCRs found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Recent Leave Requests */}
                    <Card>
                        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Recent Leave Requests</CardTitle>
                                <CardDescription>Last 5 applications</CardDescription>
                            </div>
                            <Clock className="w-5 h-5 text-blue-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="pl-6">Type</TableHead>
                                        <TableHead>Dates</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentLeaves.map((leave) => (
                                        <TableRow key={leave.id}>
                                            <TableCell className="pl-6 font-medium">{leave.leave_type}</TableCell>
                                            <TableCell>
                                                {format(new Date(leave.date_from), 'MMM d, yyyy')} — {format(new Date(leave.date_to), 'MMM d, yyyy')}
                                                <div className="text-xs text-slate-500">{leave.working_days} days</div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(leave.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {recentLeaves.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-6 text-slate-500 text-sm">
                                                No recent leave requests.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
