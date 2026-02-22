'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const STATUS_BADGES: Record<string, any> = {
    'draft': <Badge variant="outline" className="text-slate-500 bg-slate-50 border-slate-300">Draft ○</Badge>,
    'submitted': <Badge className="bg-amber-500 hover:bg-amber-600 text-amber-950 border-none shadow-sm">Submitted →</Badge>,
    'reviewed': <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none shadow-sm">Reviewed ✓</Badge>,
    'finalized': <Badge className="bg-green-600 hover:bg-green-700 text-white border-none shadow-sm">Finalized ★</Badge>,
    'returned': <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none shadow-sm">Returned ↻</Badge>,
}

export function ChiefDashboard({ stats, profile }: { stats: any; profile: any }) {
    const dateStr = format(new Date(), 'EEEE, MMMM d, yyyy')

    return (
        <div className="space-y-6">
            <div className="flex flex-col mb-4">
                <span className="text-slate-500">{dateStr}</span>
                <span className="text-amber-600 font-medium text-sm mt-1">{profile.division}</span>
            </div>

            {/* QUICK STATS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col space-y-2">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-full w-max">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Div. Staff</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stats.divisionStaffCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col space-y-2">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-full w-max">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pend. Leave</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stats.divisionPendingLeaves}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col space-y-2">
                            <div className="p-3 bg-green-50 text-green-600 rounded-full w-max">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Div. IPCR</p>
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {stats.divisionIPCRProgress.filter((p: any) => p.ipcr_status === 'finalized').length}
                                    <span className="text-slate-400 text-lg"> / {stats.divisionStaffCount}</span>
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DIVISION IPCR PROGRESS */}
                <Card className="md:col-span-1">
                    <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>My Division — IPCR Progress</CardTitle>
                            <CardDescription>Current Cycle: {stats.activeCycle?.name || 'None'}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                        <div className="divide-y">
                            {stats.divisionIPCRProgress.length > 0 ? (
                                stats.divisionIPCRProgress.map((p: any) => (
                                    <div key={p.employee.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                        <div className="font-medium text-slate-900">
                                            {p.employee.full_name}
                                            {p.employee.id === profile.id && <span className="ml-2 text-xs text-slate-400">(You)</span>}
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            {p.ipcr_status ? STATUS_BADGES[p.ipcr_status] : <span className="text-slate-400 italic text-sm">Not Started</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-slate-500">No staff found in this division.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col space-y-6">
                    {/* PENDING ACTIONS FOR ME */}
                    <Card>
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                Pending Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {stats.pendingReviewCount > 0 || stats.divisionPendingLeaves > 0 ? (
                                <div className="space-y-4">
                                    {stats.pendingReviewCount > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-800">{stats.pendingReviewCount} IPCRs awaiting your review</span>
                                            <Button asChild size="sm" variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100">
                                                <Link href="/dashboard/approvals">Review IPCRs →</Link>
                                            </Button>
                                        </div>
                                    )}
                                    {stats.divisionPendingLeaves > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-800">{stats.divisionPendingLeaves} Leave applications pending</span>
                                            <Button asChild size="sm" variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100">
                                                <Link href="/dashboard/approvals">Review Leaves →</Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-green-600 flex flex-col items-center py-4">
                                    <CheckCircle2 className="w-12 h-12 mb-2 opacity-50" />
                                    <span className="font-medium">You're all caught up!</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* MY IPCR STATUS */}
                    <Card>
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                My IPCR ({stats.activeCycle?.name})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {stats.myIPCR ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                                        <span className="font-medium text-slate-700">Status</span>
                                        {STATUS_BADGES[stats.myIPCR.status]}
                                    </div>
                                    <Button asChild className="w-full bg-[#1E3A5F]">
                                        <Link href="/dashboard/ipcr">{stats.myIPCR.status === 'draft' || stats.myIPCR.status === 'returned' ? 'Continue Editing →' : 'View My IPCR →'}</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-slate-500 mb-4">You haven't started your IPCR for this cycle.</p>
                                    <Button asChild className="w-full">
                                        <Link href="/dashboard/ipcr">Create IPCR →</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
