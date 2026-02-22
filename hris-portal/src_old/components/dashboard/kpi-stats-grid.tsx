'use client'

import { CalendarOff, Clock, FileText, Building2, Star, TrendingUp } from 'lucide-react'
import { KPICard } from './kpi-card'

interface DashboardSummary {
    pendingLeaves: { count: number; label: string; sublabel: string }
    dtrCompliance: { percentage: number; compliantCount: number; totalCount: number; label: string; trend: 'up' | 'down' | 'stable' }
    ipcr: { submittedCount: number; totalCount: number; percentage: number; myStatus?: string }
    opcr: { status: string; finalRating?: number; adjectivalRating?: string; exists: boolean }
    personalKPIs?: {
        leaveBalance: number
        dtrStatusThisMonth: string
        myIPCRStatus: string
        myLatestRating?: number
        myLatestAdjectival?: string
    } | null
    dashboardKPIs: {
        totalEmployees: number
        presentToday: number
        pendingLeaves: number
        pendingIPCR: number
    }
}

interface KpiStatsGridProps {
    userRole: string
    summary: DashboardSummary
    leaveBalance?: any
    ipcrStatus?: string
    devPlansCount?: number
}

function getComplianceColor(pct: number): 'green' | 'amber' | 'red' {
    if (pct >= 90) return 'green'
    if (pct >= 70) return 'amber'
    return 'red'
}

export function KpiStatsGrid({ userRole, summary, leaveBalance, ipcrStatus, devPlansCount }: KpiStatsGridProps) {
    const { pendingLeaves, dtrCompliance, ipcr, opcr, personalKPIs } = summary
    const complianceColor = getComplianceColor(dtrCompliance.percentage)

    const vl = leaveBalance?.vacation_leave ?? 0
    const sl = leaveBalance?.sick_leave ?? 0
    const totalLeave = (vl + sl).toFixed(1)

    switch (userRole) {
        case 'head_of_office':
        case 'admin_staff':
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <KPICard
                        icon={<Building2 size={18} />}
                        iconColor="blue"
                        value={summary.dashboardKPIs.totalEmployees}
                        label="Total Staff"
                        sublabel="Active employees"
                        href="/dashboard/admin/users"
                    />
                    <KPICard
                        icon={<Clock size={18} />}
                        iconColor="green"
                        value={summary.dashboardKPIs.presentToday}
                        label="Today Present"
                        sublabel="Checked in today"
                        href="/dashboard/attendance"
                    />
                    <KPICard
                        icon={<CalendarOff size={18} />}
                        iconColor="amber"
                        value={summary.dashboardKPIs.pendingLeaves}
                        label="Pending Leaves"
                        sublabel="Awaiting approval"
                        href="/dashboard/approvals"
                        badge={summary.dashboardKPIs.pendingLeaves > 0 ? { text: 'Needs action', color: 'amber' } : undefined}
                    />
                    <KPICard
                        icon={<FileText size={18} />}
                        iconColor="blue"
                        value={summary.dashboardKPIs.pendingIPCR}
                        label="Pending IPCRs"
                        sublabel="Awaiting review"
                        href="/dashboard/approvals"
                        badge={summary.dashboardKPIs.pendingIPCR > 0 ? { text: 'Needs action', color: 'blue' } : undefined}
                    />
                </div>
            )

        case 'division_chief':
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <KPICard
                        icon={<Building2 size={18} />}
                        iconColor="blue"
                        value={summary.dashboardKPIs.totalEmployees}
                        label="Team Size"
                        sublabel="Active members"
                    />
                    <KPICard
                        icon={<Clock size={18} />}
                        iconColor="green"
                        value={summary.dashboardKPIs.presentToday}
                        label="Team Present"
                        sublabel="Checked in today"
                    />
                    <KPICard
                        icon={<CalendarOff size={18} />}
                        iconColor="amber"
                        value={summary.dashboardKPIs.pendingLeaves}
                        label="Pending Leaves"
                        sublabel="Awaiting recommendation"
                        href="/dashboard/approvals"
                        badge={summary.dashboardKPIs.pendingLeaves > 0 ? { text: 'Needs action', color: 'amber' } : undefined}
                    />
                    <KPICard
                        icon={<FileText size={18} />}
                        iconColor="blue"
                        value={summary.dashboardKPIs.pendingIPCR}
                        label="Pending IPCRs"
                        sublabel="Awaiting review"
                        href="/dashboard/approvals"
                        badge={summary.dashboardKPIs.pendingIPCR > 0 ? { text: 'Needs action', color: 'blue' } : undefined}
                    />
                </div>
            )

        // (pmt_member case removed — admin_staff uses the head_of_office view)

        default: // employee
            const myRating = personalKPIs?.myLatestRating
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <KPICard
                        icon={<CalendarOff size={18} />}
                        iconColor="blue"
                        value={totalLeave}
                        label="Leave Balance"
                        sublabel={`VL: ${vl} | SL: ${sl}`}
                        href="/dashboard/leaves"
                    />
                    <KPICard
                        icon={<Clock size={18} />}
                        iconColor={complianceColor}
                        value={personalKPIs?.dtrStatusThisMonth ?? `${dtrCompliance.percentage}%`}
                        label="My DTR Compliance"
                        sublabel="This month"
                        trend={dtrCompliance.trend}
                    />
                    <KPICard
                        icon={<FileText size={18} />}
                        iconColor="green"
                        value={personalKPIs?.myIPCRStatus ?? ipcrStatus ?? 'Not Started'}
                        label="My IPCR Status"
                        sublabel="Current rating period"
                        statusBadge={personalKPIs?.myIPCRStatus ?? ipcrStatus}
                        href="/dashboard/ipcr"
                    />
                    <KPICard
                        icon={<Star size={18} />}
                        iconColor="amber"
                        value={myRating ? myRating.toFixed(2) : '—'}
                        label="My Latest Rating"
                        sublabel={personalKPIs?.myLatestAdjectival ?? 'No finalized rating yet'}
                    />
                </div>
            )
    }
}
