'use server'

import { createClient } from '@/utils/supabase/server'
import { formatDistanceToNow, subMonths, startOfMonth, endOfMonth, format } from 'date-fns'

// ─────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────
async function getAuthContext() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, division_id, full_name')
        .eq('id', user.id)
        .single()

    return { supabase, user, profile }
}

function getAdjectivalRating(avg: number): string {
    if (avg >= 4.500) return 'Outstanding'
    if (avg >= 3.500) return 'Very Satisfactory'
    if (avg >= 2.500) return 'Satisfactory'
    if (avg >= 1.500) return 'Unsatisfactory'
    return 'Poor'
}

// ─────────────────────────────────────────────────────────────
// KPI: PENDING LEAVES
// ─────────────────────────────────────────────────────────────
export async function getPendingLeavesKPI(userRole: string, divisionId?: string) {
    try {
        const { supabase, user } = await getAuthContext()

        if (userRole === 'project_staff') {
            const { data } = await supabase
                .from('leave_balances')
                .select('vacation_leave, sick_leave')
                .eq('employee_id', user.id)
                .single()

            const total = (data?.vacation_leave ?? 0) + (data?.sick_leave ?? 0)
            return { count: total, label: 'Leave Balance', sublabel: 'Days remaining' }
        }

        let query = supabase
            .from('leave_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending')

        if (userRole === 'division_chief' && divisionId) {
            // join through profiles
            const { data: divStaff } = await supabase
                .from('profiles')
                .select('id')
                .eq('division_id', divisionId)
            const staffIds = (divStaff || []).map((m: any) => m.id)
            query = query.in('employee_id', staffIds)
        }

        const { count } = await query
        return {
            count: count ?? 0,
            label: 'Pending Leaves',
            sublabel: count && count > 0 ? 'Awaiting your approval' : 'All clear',
        }
    } catch {
        return { count: 0, label: 'Pending Leaves', sublabel: '—' }
    }
}

// ─────────────────────────────────────────────────────────────
// KPI: DTR COMPLIANCE
// ─────────────────────────────────────────────────────────────
export async function getDTRComplianceKPI(userRole: string, divisionId?: string) {
    try {
        const { supabase, user } = await getAuthContext()

        const now = new Date()
        const monthStart = startOfMonth(now).toISOString()
        const monthEnd = endOfMonth(now).toISOString()
        const threshold = 15 // records in a month = compliant

        if (userRole === 'project_staff') {
            const { count } = await supabase
                .from('attendance_logs')
                .select('id', { count: 'exact', head: true })
                .eq('employee_id', user.id)
                .gte('check_in', monthStart)
                .lte('check_in', monthEnd)

            const myCount = count ?? 0
            const isCompliant = myCount >= threshold
            return {
                percentage: isCompliant ? 100 : Math.round((myCount / threshold) * 100),
                compliantCount: myCount,
                totalCount: threshold,
                label: 'My DTR Compliance',
                trend: isCompliant ? 'up' as const : 'down' as const,
            }
        }

        // Get all active staff (optionally filtered by division)
        let staffQuery = supabase.from('profiles').select('id').eq('is_active', true)
        if (userRole === 'division_chief' && divisionId) {
            staffQuery = staffQuery.eq('division_id', divisionId)
        }
        const { data: staff } = await staffQuery
        const staffIds = (staff || []).map((e: any) => e.id)
        const total = staffIds.length

        if (total === 0) return { percentage: 0, compliantCount: 0, totalCount: 0, label: 'DTR Compliance', trend: 'stable' as const }

        // Count records per staff this month
        const { data: logs } = await supabase
            .from('attendance_logs')
            .select('employee_id')
            .in('employee_id', staffIds)
            .gte('check_in', monthStart)
            .lte('check_in', monthEnd)

        const staffCounts: Record<string, number> = {}
        for (const log of logs || []) {
            staffCounts[log.employee_id] = (staffCounts[log.employee_id] || 0) + 1
        }
        const compliant = Object.values(staffCounts).filter(c => c >= threshold).length

        const lastMonth = subMonths(now, 1)
        const lmStart = startOfMonth(lastMonth).toISOString()
        const lmEnd = endOfMonth(lastMonth).toISOString()
        const { data: lastLogs } = await supabase
            .from('attendance_logs')
            .select('employee_id')
            .in('employee_id', staffIds)
            .gte('check_in', lmStart)
            .lte('check_in', lmEnd)

        const lastCounts: Record<string, number> = {}
        for (const log of lastLogs || []) {
            lastCounts[log.employee_id] = (lastCounts[log.employee_id] || 0) + 1
        }
        const lastCompliant = Object.values(lastCounts).filter(c => c >= threshold).length
        const currentPct = total > 0 ? Math.round((compliant / total) * 100) : 0
        const lastPct = total > 0 ? Math.round((lastCompliant / total) * 100) : 0

        return {
            percentage: currentPct,
            compliantCount: compliant,
            totalCount: total,
            label: 'DTR Compliance',
            trend: currentPct > lastPct ? 'up' as const : currentPct < lastPct ? 'down' as const : 'stable' as const,
        }
    } catch {
        return { percentage: 0, compliantCount: 0, totalCount: 0, label: 'DTR Compliance', trend: 'stable' as const }
    }
}

// ─────────────────────────────────────────────────────────────
// KPI: IPCR SUBMISSION
// ─────────────────────────────────────────────────────────────
export async function getIPCRSubmissionKPI(userRole: string, divisionId?: string, ratingPeriodId?: string) {
    try {
        const { supabase, user } = await getAuthContext()

        if (userRole === 'project_staff') {
            let q = supabase
                .from('ipcr_forms')
                .select('status')
                .eq('employee_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)

            if (ratingPeriodId) q = q.eq('rating_period_id', ratingPeriodId)
            const { data } = await q
            const myStatus = data?.[0]?.status || 'not_started'

            return {
                submittedCount: 0,
                totalCount: 0,
                percentage: 0,
                myStatus: myStatus.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            }
        }

        // Get staff list
        let staffQuery = supabase.from('profiles').select('id').eq('is_active', true)
        if (userRole === 'division_chief' && divisionId) {
            staffQuery = staffQuery.eq('division_id', divisionId)
        }
        const { data: staff } = await staffQuery
        const total = staff?.length ?? 0

        // Count submitted IPCRs
        let ipcrQuery = supabase
            .from('ipcr_forms')
            .select('id', { count: 'exact', head: true })
            .in('status', ['submitted', 'reviewed', 'approved', 'finalized'])

        if (ratingPeriodId) ipcrQuery = ipcrQuery.eq('rating_period_id', ratingPeriodId)
        if (userRole === 'division_chief' && divisionId) {
            const staffIds = (staff || []).map((e: any) => e.id)
            ipcrQuery = ipcrQuery.in('employee_id', staffIds)
        }

        const { count: submitted } = await ipcrQuery
        const pct = total > 0 ? Math.round(((submitted ?? 0) / total) * 100) : 0

        return {
            submittedCount: submitted ?? 0,
            totalCount: total,
            percentage: pct,
            myStatus: undefined,
        }
    } catch {
        return { submittedCount: 0, totalCount: 0, percentage: 0, myStatus: undefined }
    }
}

// ─────────────────────────────────────────────────────────────
// KPI: OPCR STATUS
// ─────────────────────────────────────────────────────────────
export async function getOPCRStatusKPI(ratingPeriodId: string) {
    try {
        const { supabase } = await getAuthContext()
        const { data } = await supabase
            .from('opcr_forms')
            .select('status, final_average_rating')
            .eq('rating_period_id', ratingPeriodId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (!data) return { status: 'not_created', finalRating: undefined, adjectivalRating: undefined, exists: false }

        return {
            status: data.status,
            finalRating: data.final_average_rating,
            adjectivalRating: data.final_average_rating ? getAdjectivalRating(data.final_average_rating) : undefined,
            exists: true,
        }
    } catch {
        return { status: 'not_created', finalRating: undefined, adjectivalRating: undefined, exists: false }
    }
}

// ─────────────────────────────────────────────────────────────
// KPI: STAFF PERSONAL
// ─────────────────────────────────────────────────────────────
export async function getStaffPersonalKPIs(employeeId: string, ratingPeriodId: string) {
    try {
        const { supabase } = await getAuthContext()
        const now = new Date()
        const monthStart = startOfMonth(now).toISOString()

        const [leaveRes, dtrRes, ipcrRes, ratingRes] = await Promise.all([
            supabase.from('leave_balances').select('vacation_leave, sick_leave').eq('employee_id', employeeId).single(),
            supabase.from('attendance_logs').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId).gte('check_in', monthStart),
            supabase.from('ipcr_forms').select('status').eq('employee_id', employeeId).eq('rating_period_id', ratingPeriodId).maybeSingle(),
            supabase.from('ipcr_forms').select('final_average_rating').eq('employee_id', employeeId).eq('status', 'finalized').order('created_at', { ascending: false }).limit(1),
        ])

        const vl = leaveRes.data?.vacation_leave ?? 0
        const sl = leaveRes.data?.sick_leave ?? 0
        const dtrCount = dtrRes.count ?? 0
        const rating = ratingRes.data?.[0]?.final_average_rating

        return {
            leaveBalance: vl + sl,
            dtrStatusThisMonth: dtrCount >= 15 ? 'Compliant' : `${dtrCount} records`,
            myIPCRStatus: (ipcrRes.data?.status || 'not_started').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            myLatestRating: rating,
            myLatestAdjectival: rating ? getAdjectivalRating(rating) : undefined,
        }
    } catch {
        return { leaveBalance: 0, dtrStatusThisMonth: '—', myIPCRStatus: 'Not Started', myLatestRating: undefined, myLatestAdjectival: undefined }
    }
}

// ─────────────────────────────────────────────────────────────
// PENDING COUNTS (for Quick Actions badges)
// ─────────────────────────────────────────────────────────────
export async function getPendingCounts(userRole: string, divisionId?: string) {
    try {
        const { supabase, user } = await getAuthContext()

        const divStaffPromise = divisionId
            ? supabase.from('profiles').select('id').eq('division_id', divisionId).then(r => (r.data || []).map((m: any) => m.id))
            : Promise.resolve([] as string[])

        const divStaffIds = await divStaffPromise

        const [leavesRes, ipcrRes, journalsRes, calRes] = await Promise.all([
            // Pending leaves
            (() => {
                let q = supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
                if (userRole === 'division_chief' && divStaffIds.length) q = q.in('employee_id', divStaffIds)
                return q
            })(),
            // Pending IPCR (submitted, awaiting review/approval)
            (() => {
                let q = supabase.from('ipcr_forms').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'reviewed'])
                if (userRole === 'division_chief' && divStaffIds.length) q = q.in('employee_id', divStaffIds)
                return q
            })(),
            // Pending monitoring journals
            (() => {
                let q = supabase.from('monitoring_journals').select('id', { count: 'exact', head: true }).eq('status', 'submitted')
                if (userRole === 'division_chief' && divStaffIds.length) q = q.in('employee_id', divStaffIds)
                return q
            })(),
            // Overdue calendar events
            supabase
                .from('spms_calendar_events')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'overdue'),
        ])

        return {
            pendingLeaves: leavesRes.count ?? 0,
            pendingIPCR: ipcrRes.count ?? 0,
            pendingJournals: journalsRes.count ?? 0,
            overdueCalendarEvents: calRes.count ?? 0,
        }
    } catch {
        return { pendingLeaves: 0, pendingIPCR: 0, pendingJournals: 0, overdueCalendarEvents: 0 }
    }
}

// ─────────────────────────────────────────────────────────────
// CHART: OFFICE RATING TREND
// ─────────────────────────────────────────────────────────────
export async function getOfficeRatingTrend(divisionId?: string) {
    try {
        const { supabase } = await getAuthContext()

        // Get last 4 rating periods
        const { data: periods } = await supabase
            .from('rating_periods')
            .select('id, name')
            .order('period_from', { ascending: false })
            .limit(4)

        if (!periods || periods.length === 0) return []

        const results = await Promise.all(periods.map(async (period: any) => {
            let q = supabase
                .from('ipcr_forms')
                .select('final_average_rating')
                .eq('rating_period_id', period.id)
                .eq('status', 'finalized')
                .not('final_average_rating', 'is', null)

            if (divisionId) {
                const { data: divStaff } = await supabase.from('profiles').select('id').eq('division_id', divisionId)
                const ids = (divStaff || []).map((m: any) => m.id)
                if (ids.length) q = q.in('employee_id', ids)
            }

            const { data } = await q
            if (!data || data.length === 0) return null

            const avg = data.reduce((sum: number, r: any) => sum + (r.final_average_rating || 0), 0) / data.length

            return {
                period: period.name,
                averageRating: parseFloat(avg.toFixed(2)),
                adjectivalRating: getAdjectivalRating(avg),
                staffCount: data.length,
            }
        }))

        return results.filter(Boolean).reverse() as {
            period: string; averageRating: number; adjectivalRating: string; staffCount: number
        }[]
    } catch {
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// CHART: SPMS CYCLE COMPLETION
// ─────────────────────────────────────────────────────────────
export async function getSPMSCycleCompletion(ratingPeriodId?: string) {
    if (!ratingPeriodId) return []
    try {
        const { supabase } = await getAuthContext()

        const { data: totalStaff } = await supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('is_active', true)

        const total = totalStaff?.length ?? 1

        const [ipcrDraft, ipcrSubmitted, ipcrFinalized, opcrRes, planRes, monitorRes] = await Promise.all([
            supabase.from('ipcr_forms').select('id', { count: 'exact', head: true }).eq('rating_period_id', ratingPeriodId).not('status', 'eq', 'draft'),
            supabase.from('ipcr_forms').select('id', { count: 'exact', head: true }).eq('rating_period_id', ratingPeriodId).in('status', ['submitted', 'reviewed', 'approved', 'finalized']),
            supabase.from('ipcr_forms').select('id', { count: 'exact', head: true }).eq('rating_period_id', ratingPeriodId).eq('status', 'finalized'),
            supabase.from('opcr_forms').select('id, status').eq('rating_period_id', ratingPeriodId).maybeSingle(),
            supabase.from('development_plans').select('id', { count: 'exact', head: true }).eq('rating_period_id', ratingPeriodId),
            supabase.from('monitoring_journals').select('id', { count: 'exact', head: true }).eq('rating_period_id', ratingPeriodId),
        ])

        const stages = [
            {
                stage: 'performance_planning',
                label: 'Stage 1: Performance Planning',
                completed: ipcrDraft.count ?? 0,
                total,
                color: 'bg-blue-500',
            },
            {
                stage: 'performance_monitoring',
                label: 'Stage 2: Monitoring & Coaching',
                completed: monitorRes.count ?? 0,
                total,
                color: 'bg-purple-500',
            },
            {
                stage: 'performance_review',
                label: 'Stage 3: Performance Review',
                completed: ipcrSubmitted.count ?? 0,
                total,
                color: 'bg-amber-500',
            },
            {
                stage: 'performance_rewarding',
                label: 'Stage 4: Reward & Development',
                completed: ipcrFinalized.count ?? 0,
                total,
                color: 'bg-green-500',
            },
            {
                stage: 'opcr',
                label: 'OPCR Submission',
                completed: opcrRes.data?.status && opcrRes.data.status !== 'draft' ? 1 : 0,
                total: 1,
                color: 'bg-primary',
            },
        ]

        return stages.map(s => ({
            ...s,
            percentage: s.total > 0 ? Math.min(100, Math.round((s.completed / s.total) * 100)) : 0,
        }))
    } catch {
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// CHART: DTR COMPLIANCE TREND (last 6 months)
// ─────────────────────────────────────────────────────────────
export async function getDTRComplianceTrend(divisionId?: string) {
    try {
        const { supabase } = await getAuthContext()
        const threshold = 15

        let staffQuery = supabase.from('profiles').select('id').eq('is_active', true)
        if (divisionId) staffQuery = staffQuery.eq('division_id', divisionId)
        const { data: staff } = await staffQuery
        const staffIds = (staff || []).map((e: any) => e.id)
        const total = staffIds.length

        if (total === 0) return []

        const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i))

        const results = await Promise.all(months.map(async (month) => {
            const mStart = startOfMonth(month).toISOString()
            const mEnd = endOfMonth(month).toISOString()

            const { data: logs } = await supabase
                .from('attendance_logs')
                .select('employee_id')
                .in('employee_id', staffIds)
                .gte('check_in', mStart)
                .lte('check_in', mEnd)

            const counts: Record<string, number> = {}
            for (const log of logs || []) {
                counts[log.employee_id] = (counts[log.employee_id] || 0) + 1
            }
            const compliant = Object.values(counts).filter(c => c >= threshold).length

            return {
                month: format(month, 'MMM yyyy'),
                complianceRate: total > 0 ? parseFloat(((compliant / total) * 100).toFixed(1)) : 0,
                compliantStaff: compliant,
                totalStaff: total,
            }
        }))

        return results
    } catch {
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// ACTIVITY FEED
// ─────────────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
    'ipcr.submitted': 'submitted their IPCR',
    'ipcr.approved': 'approved an IPCR',
    'ipcr.returned': 'returned an IPCR for revision',
    'ipcr.finalized': 'finalized an IPCR',
    'leave.submitted': 'filed a leave application',
    'leave.approved': 'approved a leave request',
    'leave.rejected': 'rejected a leave request',
    'opcr.submitted': 'submitted the OPCR',
    'opcr.finalized': 'finalized the OPCR',
    'monitoring.submitted': 'submitted a monitoring journal',
    'monitoring.noted': 'noted a monitoring journal',
    'development_plan.created': 'created a development plan',
    'development_plan.achieved': 'marked a development plan as achieved',
    'reward.created': 'gave an award',
    'reward.awarded': 'confirmed an award given',
    'LOGIN_SUCCESS': 'logged in',
}

export async function getRecentActivityFeed(userRole: string, limit: number = 10) {
    try {
        const { supabase, user } = await getAuthContext()

        let query = supabase
            .from('audit_logs')
            .select(`id, action, created_at, details, profiles:user_id(full_name, role)`)
            .order('created_at', { ascending: false })
            .limit(limit)

        // project_staff and division_chief see their own; head/admin_staff see all
        if (!['head_of_office', 'admin_staff'].includes(userRole)) {
            query = query.eq('user_id', user.id)
        }

        const { data } = await query

        return (data || []).map((log: any) => {
            const userName = log.profiles?.full_name || 'Unknown User'
            const initials = userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
            const actionText = ACTION_LABELS[log.action] ?? log.action.toLowerCase().replace(/_/g, ' ')
            const relativeTime = formatDistanceToNow(new Date(log.created_at), { addSuffix: true })

            return {
                id: log.id,
                action: log.action,
                description: actionText,
                user_name: userName,
                user_initials: initials,
                created_at: log.created_at,
                relative_time: relativeTime,
            }
        })
    } catch {
        return []
    }
}

// ─────────────────────────────────────────────────────────────
// COMBINED DASHBOARD SUMMARY (one round-trip)
// ─────────────────────────────────────────────────────────────
export async function getDashboardSummary(
    userRole: string,
    userId: string,
    divisionId?: string,
    ratingPeriodId?: string,
) {
    const { supabase } = await getAuthContext()
    const today = new Date().toISOString().split('T')[0]

    let totalEmployeesPromise = Promise.resolve({ count: 0 })
    let presentTodayPromise = Promise.resolve({ count: 0 })
    let pendingLeavesPromise = Promise.resolve({ count: 0 })
    let pendingIPCRPromise = Promise.resolve({ count: 0 })

    if (userRole === 'head_of_office' || userRole === 'admin_staff') {
        totalEmployeesPromise = supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).neq('role', 'head_of_office') as any
        presentTodayPromise = supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('date', today) as any
        pendingLeavesPromise = supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval') as any
        pendingIPCRPromise = supabase.from('ipcr_forms').select('*', { count: 'exact', head: true }).eq('status', 'submitted') as any
    } else if (userRole === 'division_chief' && divisionId) {
        totalEmployeesPromise = supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).eq('division_id', divisionId).neq('role', 'head_of_office') as any

        // get staff
        const staffRes = await supabase.from('profiles').select('id').eq('division_id', divisionId)
        const staffIds = staffRes.data?.map(s => s.id) || []

        if (staffIds.length > 0) {
            presentTodayPromise = supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('date', today).in('employee_id', staffIds) as any
            pendingLeavesPromise = supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_recommendation').in('user_id', staffIds) as any
            pendingIPCRPromise = supabase.from('ipcr_forms').select('*', { count: 'exact', head: true }).eq('status', 'submitted').in('employee_id', staffIds) as any
        }
    }

    const [
        pendingLeavesPrev,
        dtrCompliance,
        ipcr,
        opcr,
        pendingCounts,
        personalKPIs,
        totalEmployeesRes,
        presentTodayRes,
        pendingLeavesRes,
        pendingIPCRRes
    ] = await Promise.all([
        getPendingLeavesKPI(userRole, divisionId),
        getDTRComplianceKPI(userRole, divisionId),
        getIPCRSubmissionKPI(userRole, divisionId, ratingPeriodId),
        ratingPeriodId ? getOPCRStatusKPI(ratingPeriodId) : Promise.resolve({ status: 'not_created', exists: false, finalRating: undefined, adjectivalRating: undefined }),
        getPendingCounts(userRole, divisionId),
        userRole === 'project_staff' && ratingPeriodId
            ? getStaffPersonalKPIs(userId, ratingPeriodId)
            : Promise.resolve(null),
        totalEmployeesPromise,
        presentTodayPromise,
        pendingLeavesPromise,
        pendingIPCRPromise
    ])

    return {
        pendingLeaves: pendingLeavesPrev,
        dtrCompliance,
        ipcr,
        opcr,
        pendingCounts,
        personalKPIs,
        dashboardKPIs: {
            totalEmployees: totalEmployeesRes.count || 0,
            presentToday: presentTodayRes.count || 0,
            pendingLeaves: pendingLeavesRes.count || 0,
            pendingIPCR: pendingIPCRRes.count || 0
        }
    }
}
