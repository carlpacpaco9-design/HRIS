import { createClient } from '@/utils/supabase/server'
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Skeleton } from '@/components/ui/skeleton'

// Actions
import { getLeaveBalances } from '@/app/actions/leaves'
import { getDevelopmentPlans } from '@/app/actions/development-plan'
import { getUpcomingEvents, getOverdueEvents, syncEventStatuses } from '@/app/actions/spms-calendar'
import { getIPCRData } from '@/app/actions/ipcr'
import { getRecentAwards } from '@/app/actions/rewards'
import {
    getDashboardSummary,
    getOfficeRatingTrend,
    getSPMSCycleCompletion,
    getDTRComplianceTrend,
    getRecentActivityFeed,
} from '@/app/actions/dashboard'
import { getMonthHistory } from '@/app/actions/dtr'

// Components
import { KpiStatsGrid } from '@/components/dashboard/kpi-stats-grid'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { QuickAccess } from '@/components/dashboard/quick-access'
import { SPMSDeadlinesWidget } from '@/components/dashboard/spms-deadlines-widget'
import { AttendanceWidget, AttendanceDay } from '@/components/dashboard/attendance-widget'
import { RewardsWidget } from '@/components/dashboard/rewards-widget'
import { RatingTrendChart } from '@/components/dashboard/rating-trend-chart'
import { SPMSCycleGauge } from '@/components/dashboard/spms-cycle-gauge'
import { DTRComplianceChart } from '@/components/dashboard/dtr-compliance-chart'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Unauthorized</div>

    // 1. Fetch profile + active period first (needed for role flags)
    const [profileResult, activePeriodResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('rating_periods').select('id, name').eq('is_active', true).maybeSingle(),
    ])

    const profile = profileResult.data
    const activePeriod = activePeriodResult.data

    const userRole = profile?.role || 'project_staff'
    const userName = profile?.full_name || user.email || 'User'
    const firstName = userName.split(' ')[0]
    const divisionId = profile?.division_id ?? undefined

    // 2. Role-capability flags
    const canViewCharts = ['head_of_office', 'admin_staff', 'division_chief'].includes(userRole)
    const canViewRewards = ['head_of_office', 'admin_staff'].includes(userRole)
    const canViewOPCR = ['head_of_office', 'admin_staff', 'division_chief'].includes(userRole)
    const isDivisionChart = userRole === 'division_chief' // DTR but not full SPMS gauge

    // 3. Fetch all dashboard data in parallel
    // Kick off sync + upcoming events sequentially, parallel with everything else
    const upcomingEventsPromise = syncEventStatuses()
        .then(() => getUpcomingEvents(14))
        .catch(() => ({ data: [] }))

    const [
        dashboardSummary,
        ratingTrendData,
        spmsCompletionData,
        dtrTrendData,
        recentActivity,
        upcomingEventsResult,
        overdueEventsResult,
        recentAwards,
        attendanceLogs,
        leaveBalance,
        devPlansResult,
        ipcrData,
    ] = await Promise.all([
        getDashboardSummary(userRole, user.id, divisionId, activePeriod?.id),
        canViewCharts ? getOfficeRatingTrend(divisionId) : Promise.resolve([]),
        (canViewCharts && !isDivisionChart) ? getSPMSCycleCompletion(activePeriod?.id) : Promise.resolve([]),
        canViewCharts ? getDTRComplianceTrend(divisionId) : Promise.resolve([]),
        getRecentActivityFeed(userRole, 10),
        upcomingEventsPromise,
        getOverdueEvents().catch(() => ({ data: [] })),
        canViewRewards ? getRecentAwards(5).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        getMonthHistory().catch(() => []),
        getLeaveBalances(user.id).catch(() => null),
        getDevelopmentPlans({ status: 'in_progress' }).catch(() => ({ data: [] })),
        getIPCRData().catch(() => ({ cycle: null, commitment: null })),
    ])

    const upcomingEvents = (upcomingEventsResult as any)?.data || []
    const overdueEvents = (overdueEventsResult as any)?.data || []
    const devPlansCount = (devPlansResult as any)?.data?.length || 0
    const recentAwardsList = (recentAwards as any)?.data || []
    const { commitment } = ipcrData

    const ipcrStatus = commitment?.status
        ? commitment.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
        : 'Not Started'

    const showAlertBar = ['head_of_office', 'division_chief', 'admin_staff'].includes(userRole)
        && (dashboardSummary.pendingCounts.pendingLeaves > 0 || overdueEvents.length > 0)

    // Greeting
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    return (
        <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500 pb-10">

            {/* ── HEADER ── */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2 border-b border-gray-100 pb-6 w-full">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        {greeting}, {firstName}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {userRole.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} · Provincial Assessor&apos;s Office
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <p className="text-sm text-muted-foreground font-medium">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {activePeriod ? (
                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            Rating Period: {activePeriod.name}
                        </div>
                    ) : (
                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                            No Active Rating Period
                        </div>
                    )}
                </div>
            </div>

            {/* ── ALERT BAR ── */}
            {showAlertBar && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 w-full">
                    <div className="bg-amber-100 p-1.5 rounded-full shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                    </div>
                    <div className="text-sm text-amber-800 font-medium flex-1">
                        {dashboardSummary.pendingCounts.pendingLeaves > 0 && (
                            <span>You have <span className="font-bold">{dashboardSummary.pendingCounts.pendingLeaves}</span> pending leave{dashboardSummary.pendingCounts.pendingLeaves > 1 ? 's' : ''} awaiting approval. </span>
                        )}
                        {overdueEvents.length > 0 && (
                            <span><span className="font-bold">{overdueEvents.length}</span> SPMS deadline{overdueEvents.length > 1 ? 's are' : ' is'} overdue.</span>
                        )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                        {dashboardSummary.pendingCounts.pendingLeaves > 0 && (
                            <Link href="/dashboard/leaves">
                                <Button size="sm" variant="ghost" className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 h-8 text-xs font-semibold">
                                    Review Leaves →
                                </Button>
                            </Link>
                        )}
                        {overdueEvents.length > 0 && (
                            <Link href="/dashboard/spms-calendar">
                                <Button size="sm" variant="ghost" className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 h-8 text-xs font-semibold">
                                    View Calendar →
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* ── KPI CARDS ── */}
            <KpiStatsGrid
                userRole={userRole}
                summary={dashboardSummary}
                leaveBalance={leaveBalance}
                ipcrStatus={ipcrStatus}
                devPlansCount={devPlansCount}
            />

            {/* ── MAIN GRID — role-specific layout ── */}

            {/* PROVINCIAL ASSESSOR / ADMINISTRATIVE STAFF */}
            {(userRole === 'head_of_office' || userRole === 'admin_staff') && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                        {/* Left 2/3 — charts */}
                        <div className="lg:col-span-2 space-y-4">
                            <RatingTrendChart data={ratingTrendData} userRole={userRole} />
                            <DTRComplianceChart data={dtrTrendData} />
                        </div>
                        {/* Right 1/3 — gauges & widgets */}
                        <div className="space-y-4">
                            <SPMSCycleGauge data={spmsCompletionData} />

                            {/* Attendance Widget for Administrative Staff/Provincial Assessor */}
                            {(() => {
                                const now = new Date()
                                const currentMonth = now.getMonth() + 1
                                const currentYear = now.getFullYear()
                                const todayDate = now.getDate()

                                const attendanceDays: AttendanceDay[] = attendanceLogs.map(log => {
                                    const logDate = new Date(log.date)
                                    const dayNum = logDate.getDate()
                                    const isToday = dayNum === todayDate &&
                                        logDate.getMonth() + 1 === currentMonth &&
                                        logDate.getFullYear() === currentYear
                                    const isLate = log.am_in ? log.am_in > '08:00:00' : false
                                    let status: any = 'present'
                                    if (isLate) status = 'late'
                                    if (isToday) status = 'today-present'
                                    return {
                                        date: dayNum,
                                        status: status,
                                        timeIn: log.am_in ? log.am_in.substring(0, 5) : undefined,
                                        timeOut: log.pm_out ? log.pm_out.substring(0, 5) : undefined
                                    }
                                })

                                return (
                                    <AttendanceWidget
                                        month={currentMonth}
                                        year={currentYear}
                                        attendanceDays={attendanceDays}
                                        employeeId={user.id}
                                    />
                                )
                            })()}

                            <SPMSDeadlinesWidget upcomingEvents={upcomingEvents} overdueEvents={overdueEvents} />
                            {canViewRewards && <RewardsWidget recentAwards={recentAwardsList} />}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ActivityFeed data={recentActivity} />
                        <QuickAccess userRole={userRole} pendingCounts={dashboardSummary.pendingCounts} />
                    </div>
                </>
            )}

            {/* (pmt_member section removed — admin_staff covers this view) */}

            {/* DIVISION CHIEF */}
            {userRole === 'division_chief' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <RatingTrendChart data={ratingTrendData} userRole={userRole} divisionName={profile?.division_name} />
                        <DTRComplianceChart data={dtrTrendData} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ActivityFeed data={recentActivity} />
                        <div className="space-y-4">
                            <QuickAccess userRole={userRole} pendingCounts={dashboardSummary.pendingCounts} />
                            <SPMSDeadlinesWidget upcomingEvents={upcomingEvents} overdueEvents={overdueEvents} />
                        </div>
                    </div>
                </>
            )}

            {/* PROJECT STAFF */}
            {userRole === 'project_staff' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                    {/* LEFT COLUMN — takes 2/3 width */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <ActivityFeed data={recentActivity} />
                        {(() => {
                            const now = new Date()
                            const currentMonth = now.getMonth() + 1
                            const currentYear = now.getFullYear()
                            const todayDate = now.getDate()

                            // Transform logs to AttendanceDay format
                            const attendanceDays: AttendanceDay[] = attendanceLogs.map(log => {
                                const logDate = new Date(log.date)
                                const dayNum = logDate.getDate()
                                const isToday = dayNum === todayDate &&
                                    logDate.getMonth() + 1 === currentMonth &&
                                    logDate.getFullYear() === currentYear

                                // Late logic: 8:00 AM grace period
                                const isLate = log.am_in ? log.am_in > '08:00:00' : false

                                let status: any = 'present'
                                if (isLate) status = 'late'
                                if (isToday) status = 'today-present' // Or 'present' handled by widget style override

                                return {
                                    date: dayNum,
                                    status: status,
                                    timeIn: log.am_in ? log.am_in.substring(0, 5) : undefined,
                                    timeOut: log.pm_out ? log.pm_out.substring(0, 5) : undefined
                                }
                            })

                            return (
                                <AttendanceWidget
                                    month={currentMonth}
                                    year={currentYear}
                                    attendanceDays={attendanceDays}
                                    employeeId={user.id}
                                />
                            )
                        })()}
                    </div>

                    {/* RIGHT COLUMN — takes 1/3 width */}
                    <div className="flex flex-col gap-4">
                        <QuickAccess userRole={userRole} pendingCounts={dashboardSummary.pendingCounts} />
                        <SPMSDeadlinesWidget upcomingEvents={upcomingEvents} overdueEvents={overdueEvents} />
                    </div>
                </div>
            )}
        </div>
    )
}
