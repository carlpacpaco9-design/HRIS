'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Calendar as CalendarIcon, FileCheck, ClipboardList, CheckCircle2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { EmptyState } from '@/components/shared/empty-state'

const LEAVE_COLORS: Record<string, string> = {
    'Vacation Leave': '#3B82F6',
    'Sick Leave': '#EF4444',
    'Special Leave': '#8B5CF6',
    'Emergency Leave': '#F59E0B',
    'Maternity Leave': '#EC4899',
    'Leave without Pay': '#6B7280'
}

const DEFAULT_COLOR = '#CBD5E1'

const STATUS_COLORS: Record<string, string> = {
    'draft': '#94A3B8',
    'submitted': '#F59E0B',
    'reviewed': '#3B82F6',
    'finalized': '#22C55E',
    'returned': '#EF4444'
}

const RATING_COLORS: Record<string, string> = {
    'Outstanding': '#EAB308',
    'Very Satisfactory': '#22C55E',
    'Satisfactory': '#3B82F6',
    'Unsatisfactory': '#F59E0B',
    'Poor': '#EF4444'
}

export function HRDashboard({ stats }: { stats: any }) {
    const dateStr = format(new Date(), 'EEEE, MMMM d, yyyy')

    return (
        <div className="space-y-6">
            <div className="text-slate-500">{dateStr}</div>

            {/* QUICK STATS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Staff</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stats.totalActiveStaff}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
                                <CalendarIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pend. Leave</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stats.pendingLeaveCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-full">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Active Cycle</p>
                                <h3 className="text-sm font-bold text-slate-900 truncate max-w-[120px]" title={stats.activeCycle?.name || 'None'}>
                                    {stats.activeCycle?.name || 'None'}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-full">
                                <ClipboardList className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">IPCR Due</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stats.ipcrsNotFinalized}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* PENDING APPROVALS */}
            <Card>
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Pending Approvals</CardTitle>
                        <CardDescription>⏳ {stats.pendingLeaveCount} Leave Requests pending</CardDescription>
                    </div>
                    <Button variant="outline" asChild size="sm">
                        <Link href="/dashboard/approvals">View All →</Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {stats.pendingLeaveItems && stats.pendingLeaveItems.length > 0 ? (
                        <div className="divide-y">
                            {stats.pendingLeaveItems.map((leave: any) => (
                                <div key={leave.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50">
                                    <div>
                                        <div className="font-medium text-slate-900">{leave.profiles?.full_name}</div>
                                        <div className="text-sm text-slate-500">
                                            {leave.leave_type}, {format(new Date(leave.date_from), 'MMM d')} - {format(new Date(leave.date_to), 'MMM d')}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50" asChild size="sm">
                                            <Link href={`/dashboard/approvals`}>Review</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-500">No pending leaves to approve.</div>
                    )}
                </CardContent>
            </Card>

            {/* CHARTS TWO-COLUMN */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Leave Distribution ({new Date().getFullYear()})</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {stats.leaveDistribution?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.leaveDistribution}
                                        dataKey="count"
                                        nameKey="leave_type"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {stats.leaveDistribution.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={LEAVE_COLORS[entry.leave_type] || DEFAULT_COLOR} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <EmptyState icon={CalendarIcon} title="No Data" description="No approved leaves this year yet." />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>IPCR Status ({stats.activeCycle?.name || 'No Active Cycle'})</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {stats.ipcrStatusCounts?.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.ipcrStatusCounts}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="status" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {stats.ipcrStatusCounts.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || DEFAULT_COLOR} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <EmptyState icon={ClipboardList} title="No Data" description="No IPCRs created for active cycle." />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* RATINGS DISTRIBUTION */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Ratings Distribution (All time)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {stats.performanceDistribution?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.performanceDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="adjectival_rating" type="category" width={120} />
                                <Tooltip />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                    {stats.performanceDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={RATING_COLORS[entry.adjectival_rating] || DEFAULT_COLOR} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex text-sm text-slate-500 items-center justify-center">
                            No finalized IPCR data available for distribution.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* RECENT ACTIVITY */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest system audit logs</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.recentAuditLogs && stats.recentAuditLogs.length > 0 ? (
                        <div className="space-y-4">
                            {stats.recentAuditLogs.map((log: any) => (
                                <div key={log.id} className="flex gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-sm">
                                    <div className="text-slate-400 whitespace-nowrap">{format(new Date(log.created_at), 'MMM d, h:mm a')}</div>
                                    <div className="font-medium text-slate-700">{log.profiles?.full_name || 'System'}</div>
                                    <div className="text-slate-600">{log.action_details} ({log.action_type})</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-slate-500">No activity logged.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
