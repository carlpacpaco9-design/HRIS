'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, FileText, CheckCircle2, Clock, Users, Star } from "lucide-react"
import Link from 'next/link'

const getStatusColor = (status: string) => {
    switch (status) {
        case 'draft': return 'text-slate-500 bg-slate-100 dark:bg-slate-900/40 border-slate-200'
        case 'pending_approval': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200'
        case 'approved': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200'
        case 'rated': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200'
        default: return 'text-slate-500 bg-slate-100 dark:bg-slate-900/40 border-slate-200'
    }
}

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'draft': return 'Draft'
        case 'pending_approval': return 'Pending Approval'
        case 'approved': return 'Approved'
        case 'rated': return 'Rated'
        default: return 'Not Started'
    }
}

import { IPCRCommitment } from "@/types/dashboard"

export const IPCRCard = ({ commitment }: { commitment: IPCRCommitment | null }) => {
    return (
        <Card className="shadow-sm border-slate-200 overflow-hidden relative h-full flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className={`absolute top-0 right-0 p-4 rounded-bl-2xl border-b border-l ${getStatusColor(commitment?.status || 'draft')}`}>
                <FileText className="h-6 w-6" />
            </div>
            <CardHeader className="pb-4 pt-6 px-6">
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">My IPCR Status</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 flex-1 flex flex-col justify-center">
                <div className="text-center py-4">
                    <span className={`text-2xl font-bold px-6 py-3 rounded-full border-2 ${getStatusColor(commitment?.status || 'draft')}`}>
                        {getStatusLabel(commitment?.status || 'draft')}
                    </span>
                </div>

                <div className="mt-10 flex items-center justify-between text-base text-slate-600">
                    <span className="font-medium text-slate-700">{commitment?.spms_targets?.length || 0} Targets Set</span>
                    {commitment?.final_rating ? (
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            {commitment.final_rating.toFixed(2)}
                        </span>
                    ) : (
                        <span className="text-slate-400 italic">No Rating Yet</span>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <Link href="/dashboard/ipcr">
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-11 text-sm font-medium">
                            Go to My IPCR <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

export const ApprovalsCard = ({ pendingApprovals, teamRated }: { pendingApprovals: number, teamRated: number }) => {
    return (
        <Card className="shadow-sm border-slate-200 h-full flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-6 px-6 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</CardTitle>
                <div className="p-2 bg-amber-50 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-500" />
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 flex-1 flex flex-col">
                <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{pendingApprovals}</span>
                    <span className="text-base text-slate-500 font-medium ml-1">submissions</span>
                </div>

                <div className="mt-auto space-y-3 pt-6">
                    <div className="flex justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                        <span>Division Progress</span>
                        <span>{teamRated} Completed</span>
                    </div>
                    <Progress value={teamRated > 0 ? (teamRated / (teamRated + pendingApprovals)) * 100 : 0} className="h-3 bg-slate-100 shadow-inner rounded-full" />
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100">
                    <Link href="/dashboard/approvals">
                        <Button variant="secondary" className="w-full text-slate-700 font-semibold border border-slate-200 bg-white hover:bg-slate-50 h-11 shadow-sm">
                            Review Submissions
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

export const TeamCard = ({ pendingApprovals, teamRated }: { pendingApprovals: number, teamRated: number }) => {
    return (
        <Card className="shadow-sm border-slate-200 h-full flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-6 px-6 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">My Division Overview</CardTitle>
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-500" />
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 flex-1 flex flex-col justify-center">
                <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-emerald-50/80 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100/50 hover:bg-emerald-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-sm border border-emerald-100">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{teamRated}</p>
                                <p className="text-[11px] text-slate-500 uppercase font-bold tracking-tight mt-1">Rated IPCRs</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-amber-50/80 dark:bg-amber-900/20 rounded-2xl border border-amber-100/50 hover:bg-amber-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-full shadow-sm border border-amber-100">
                                <Clock className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{pendingApprovals}</p>
                                <p className="text-[11px] text-slate-500 uppercase font-bold tracking-tight mt-1">Pending Review</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
