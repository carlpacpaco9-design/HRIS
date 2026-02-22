'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics'
import {
    Users,
    Calendar,
    FileClock,
    ClipboardCheck,
    ArrowRight,
    UserCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * AdminOverviewDashboard Component
 * The high-level command center for HR Administrators.
 */
export function AdminOverviewDashboard() {
    const {
        presentToday,
        totalActive,
        pendingLeaves,
        onLeaveToday,
        pendingIpcr,
        isLoading
    } = useDashboardAnalytics()
    const router = useRouter()

    const kpis = [
        {
            title: "Present Today",
            value: `${presentToday} / ${totalActive}`,
            description: "Active staff on duty",
            icon: <UserCheck className="w-5 h-5 text-emerald-500" />,
            color: "border-emerald-500/20",
            link: "/dashboard/admin/attendance"
        },
        {
            title: "On Leave Today",
            value: onLeaveToday.toString(),
            description: "Approved applications",
            icon: <Calendar className="w-5 h-5 text-blue-500" />,
            color: "border-blue-500/20",
            link: "/dashboard/admin/leave"
        },
        {
            title: "Pending Leaves",
            value: pendingLeaves.toString(),
            description: "Awaiting your review",
            icon: <FileClock className={cn("w-5 h-5", pendingLeaves > 0 ? "text-amber-500" : "text-muted-foreground")} />,
            color: pendingLeaves > 0 ? "border-amber-500/50 bg-amber-50/5" : "border-border",
            link: "/dashboard/admin/leave",
            highlight: pendingLeaves > 0
        },
        {
            title: "Pending IPCRs",
            value: pendingIpcr.toString(),
            description: "Forms to approve",
            icon: <ClipboardCheck className={cn("w-5 h-5", pendingIpcr > 0 ? "text-amber-500" : "text-muted-foreground")} />,
            color: pendingIpcr > 0 ? "border-amber-500/50 bg-amber-50/5" : "border-border",
            link: "/dashboard/admin/ipcr-approvals",
            highlight: pendingIpcr > 0
        }
    ]

    return (
        <div className="space-y-8">
            {/* KPI GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => (
                    <Card
                        key={idx}
                        className={cn(
                            "relative overflow-hidden cursor-pointer transition-all hover:shadow-md border-l-4",
                            kpi.color
                        )}
                        onClick={() => router.push(kpi.link)}
                    >
                        <CardHeader className="pb-2 space-y-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    {kpi.title}
                                </CardTitle>
                                {kpi.icon}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-9 w-20" />
                                    <Skeleton className="h-4 w-28" />
                                </div>
                            ) : (
                                <>
                                    <p className={cn(
                                        "text-3xl font-black tracking-tighter",
                                        kpi.highlight && "text-amber-600"
                                    )}>
                                        {kpi.value}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-[11px] text-muted-foreground">{kpi.description}</p>
                                        <ArrowRight className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* QUICK ACTIONS / ALERTS */}
            {!isLoading && (pendingLeaves > 0 || pendingIpcr > 0) && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500 p-2 rounded-full animate-pulse shadow-lg shadow-amber-500/20">
                            <FileClock className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-900">Immediate Actions Required</p>
                            <p className="text-xs text-amber-700">You have {pendingLeaves + pendingIpcr} total items awaiting administrative approval.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push(pendingLeaves > 0 ? '/dashboard/admin/leave' : '/dashboard/admin/ipcr-approvals')}
                        className="text-xs font-black uppercase tracking-widest text-amber-900 hover:bg-amber-500/10 px-4 py-2 rounded-lg transition-colors"
                    >
                        Address Now
                    </button>
                </div>
            )}
        </div>
    )
}
