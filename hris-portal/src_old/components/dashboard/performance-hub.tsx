'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeftRight, FileText, CheckCircle2, Clock, Users, Star, ArrowRight, ArrowUpRight } from "lucide-react"
import Link from 'next/link'
import { IPCRCommitment } from "@/types/dashboard"
import { cn } from "@/lib/utils"

const getStatusColor = (status: string) => {
    switch (status) {
        case 'draft': return 'text-slate-500 bg-slate-100 border-slate-200'
        case 'pending_approval': return 'text-amber-600 bg-amber-50 border-amber-200'
        case 'approved': return 'text-blue-600 bg-blue-50 border-blue-200'
        case 'rated': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
        default: return 'text-slate-500 bg-slate-100 border-slate-200'
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

interface PerformanceHubProps {
    commitment: IPCRCommitment | null
    pendingApprovals: number
    teamRated: number
    userRole?: string
}

export const PerformanceHub = ({ commitment, pendingApprovals, teamRated, userRole = 'project_staff' }: PerformanceHubProps) => {
    // Determine if user is a manager/supervisor type who needs the full hub
    // 'project_staff' sees only their own IPCR.
    // 'admin_staff', 'division_chief', 'head_of_office' see the full hub.
    const isManagerial = ['division_chief', 'head_of_office', 'admin_staff'].includes(userRole)

    return (
        <Card className="shadow-[0_2px_20px_-5px_#0651ed10] border-slate-200/60 overflow-hidden">
            <div className="flex divide-x divide-slate-100 dark:divide-slate-800 flex-col md:flex-row">

                {/* SECTION 1: MY PERFORMANCE (Flex-1, expands if it's the only child) */}
                <div className="flex-1 p-6 relative group bg-gradient-to-br from-white to-slate-50/50">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                My Verification
                            </p>
                            <h3 className="text-lg font-bold text-slate-900">IPCR Status</h3>
                        </div>
                        <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border", getStatusColor(commitment?.status || 'draft'))}>
                            {getStatusLabel(commitment?.status || 'draft')}
                        </span>
                    </div>

                    <div className="flex items-end gap-3 mb-8">
                        <div className="flex-1">
                            <span className="text-3xl font-black text-slate-900 leading-none block">
                                {commitment?.spms_targets?.length || 0}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 mt-1 block">Targets Set</span>
                        </div>
                        {commitment?.final_rating && (
                            <div className="text-right">
                                <span className="flex items-center justify-end gap-1 text-2xl font-black text-yellow-500 leading-none">
                                    {commitment.final_rating.toFixed(2)} <Star className="h-4 w-4 fill-current" />
                                </span>
                                <span className="text-xs font-semibold text-slate-400 mt-1 block">Final Rating</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto">
                        <Link href="/dashboard/ipcr">
                            <Button className="w-full justify-between h-10 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs group-hover:translate-x-1 transition-transform">
                                Manage IPCR <ArrowRight className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* SECTION 2: APPROVALS & TEAM (Managers Only) */}
                {isManagerial && (
                    <div className="md:w-[32%] p-6 bg-white flex flex-col justify-between group hover:bg-slate-50/50 transition-colors">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                Pending Actions
                            </p>
                            <div className="mt-4 flex items-baseline gap-1.5">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">{pendingApprovals}</span>
                                <span className="text-xs font-medium text-slate-500">requests</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                Submissions awaiting your review and approval for this rating period.
                            </p>
                        </div>

                        <div className="mt-6">
                            <Link href="/dashboard/approvals">
                                <Button variant="outline" className="w-full justify-between h-9 text-slate-600 font-medium text-xs border-slate-200 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50">
                                    Review <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* SECTION 3: TEAM PROGRESS (Managers Only) */}
                {isManagerial && (
                    <div className="md:w-[28%] p-6 bg-slate-50/30 flex flex-col justify-between">
                        <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                Team Pulse
                            </p>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                                        <span>Completion</span>
                                        <span>{teamRated}/{teamRated + pendingApprovals}</span>
                                    </div>
                                    <Progress value={teamRated > 0 && (teamRated + pendingApprovals) > 0 ? (teamRated / (teamRated + pendingApprovals)) * 100 : 0} className="h-1.5 bg-slate-200" />
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Submission Period is Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}

