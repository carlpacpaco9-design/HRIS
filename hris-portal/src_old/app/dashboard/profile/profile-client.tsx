'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, Edit, Mail, Phone, MapPin, Building, BadgeIcon, CalendarCheck, Clock, FileText, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function ProfileClient({ profile, leaveBalances, ipcrHistory }: { profile: any, leaveBalances: any, ipcrHistory: any[] }) {
    return (
        <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 text-3xl font-bold">
                        {profile?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white capitalize_words">
                            {profile?.full_name}
                        </h1>
                        <p className="text-slate-500 text-lg flex items-center gap-2 mt-1">
                            {profile?.position} <span className="text-slate-300">•</span> {profile?.division?.name || 'Provincial Assessor\'s Office'}
                        </p>
                    </div>
                </div>
                <Button variant="outline" className="gap-2 shrink-0 border-blue-200 hover:bg-blue-50 text-blue-700">
                    <Edit className="w-4 h-4" /> Edit Profile
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="grid grid-cols-[30px_1fr] items-center text-slate-600">
                            <BadgeIcon className="w-4 h-4 text-slate-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400">Employee No.</span>
                                <span className="font-medium text-slate-900">{profile?.employee_id || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-[30px_1fr] items-center text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400">Contact No.</span>
                                <span className="font-medium text-slate-900">{profile?.contact_number || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-[30px_1fr] items-center text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400">Email Address</span>
                                <span className="font-medium text-slate-900">{profile?.email || 'N/A'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Employment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="grid grid-cols-[30px_1fr] items-center text-slate-600">
                            <CalendarDays className="w-4 h-4 text-slate-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400">Date Hired</span>
                                <span className="font-medium text-slate-900">
                                    {profile?.date_hired ? format(new Date(profile.date_hired), 'MMMM d, yyyy') : 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-[30px_1fr] items-center text-slate-600">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400">Employment Status</span>
                                <span className="font-medium text-slate-900">{profile?.employment_status || 'Permanent'}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-[30px_1fr] items-center text-slate-600">
                            <Building className="w-4 h-4 text-slate-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-400">Salary Grade</span>
                                <span className="font-medium text-slate-900">{profile?.salary_grade || 'N/A'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Leave Balances */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-indigo-600" />
                    Leave Balances
                    <span className="text-sm font-normal text-slate-500">({new Date().getFullYear()})</span>
                </h2>
                {leaveBalances ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <BalanceCard title="Vacation" total={leaveBalances.vacation_leave_total} used={leaveBalances.vacation_leave_used} />
                        <BalanceCard title="Sick" total={leaveBalances.sick_leave_total} used={leaveBalances.sick_leave_used} />
                        <BalanceCard title="Special" total={leaveBalances.special_leave_total} used={leaveBalances.special_leave_used} color="violet" />
                        <BalanceCard title="Forced" total={leaveBalances.forced_leave_total} used={leaveBalances.forced_leave_used} color="orange" />
                    </div>
                ) : (
                    <Card className="bg-slate-50 border-dashed">
                        <CardContent className="p-8 text-center text-slate-500">
                            No leave balance records found for the current year. Ensure HR has initialized balances.
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* IPCR History */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Recent IPCR History
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
                    {ipcrHistory.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {ipcrHistory.map(ipcr => (
                                <div key={ipcr.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="font-medium text-slate-900">{ipcr.rating_period?.name}</p>
                                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                                            {ipcr.adjectival_rating || 'Completed'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-slate-900">
                                            {ipcr.final_average_rating ? Number(ipcr.final_average_rating).toFixed(2) : '-'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            No completed IPCR records found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function BalanceCard({ title, total, used, color = "blue" }: { title: string, total: number, used: number, color?: string }) {
    const remaining = total - used;
    return (
        <Card className={`overflow-hidden border-${color}-100`}>
            <div className={`h-1 bg-${color}-500 w-full`} />
            <CardContent className="p-4">
                <p className="text-sm text-slate-500 uppercase tracking-wide font-medium">{title} Leave</p>
                <div className="mt-2 text-3xl font-bold text-slate-900">
                    {remaining} <span className="text-sm font-normal text-slate-500">left</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                    {used} used out of {total}
                </p>
            </CardContent>
        </Card>
    )
}
