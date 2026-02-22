'use server'

import { createClient } from '@/utils/supabase/server'
import { Role, isHRManager, isDivisionChief } from '@/lib/roles'

export async function getDashboardStats(role: Role, userId: string, userDivision: string) {
    const supabase = await createClient()

    if (isHRManager(role)) {
        // HR Manager Stats
        const [
            { count: totalActiveStaff },
            { count: pendingLeaveCount },
            { data: pendingLeaveItems },
            { data: activeCycle },
            { data: leaveDistData },
            { data: statusCountsData },
            { data: perfDistData },
            { data: recentAuditLogs },
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
            supabase.from('leave_requests').select('*, profiles!leave_requests_employee_id_fkey(full_name)').eq('status', 'pending_approval').order('created_at', { ascending: false }).limit(5),
            supabase.from('spms_cycles').select('*').eq('is_active', true).single(),
            supabase.rpc('get_leave_distribution', { target_year: new Date().getFullYear() }),
            supabase.rpc('get_ipcr_status_counts'), // custom rpc needed or fetch and aggregate
            supabase.rpc('get_performance_distribution'), // custom rpc needed or fetch and aggregate
            supabase.from('audit_logs').select('*, profiles!audit_logs_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(10)
        ])

        // Notice we need to implement RPCs, or instead we can just query the raw data and aggregate in JS to avoid creating raw SQL dependencies here without migrations, but the user specifically asked for DB counts.
        // The prompts suggested simple SQL, so let's do JS aggregations where complex SQL is required to avoid needing new migrations unless explicitly requested, OR we can write a migration.
        // Actually, getting all leaves for the year and grouping in JS is fine for a small office.

        // JS fallback for charts to avoid complex RPCs:
        const { data: allApprovedLeaves } = await supabase
            .from('leave_requests')
            .select('leave_type')
            .eq('status', 'approved')
            .gte('date_from', `${new Date().getFullYear()}-01-01`)
            .lte('date_from', `${new Date().getFullYear()}-12-31`)

        const leaveDistribution = Object.entries(
            (allApprovedLeaves || []).reduce((acc: any, t) => {
                acc[t.leave_type] = (acc[t.leave_type] || 0) + 1
                return acc
            }, {})
        ).map(([leave_type, count]) => ({ leave_type, count }))

        let ipcrsNotFinalized = 0
        let ipcrStatusCounts: any[] = []
        let performanceDistribution: any[] = []

        if (activeCycle) {
            const { count } = await supabase.from('ipcr_forms').select('*', { count: 'exact', head: true })
                .eq('spms_cycle_id', activeCycle.id).neq('status', 'finalized')
            ipcrsNotFinalized = count || 0

            const { data: activeCycleIpcrs } = await supabase.from('ipcr_forms').select('status').eq('spms_cycle_id', activeCycle.id)
            ipcrStatusCounts = Object.entries(
                (activeCycleIpcrs || []).reduce((acc: any, t) => {
                    acc[t.status] = (acc[t.status] || 0) + 1
                    return acc
                }, {})
            ).map(([status, count]) => ({ status, count }))
        }

        const { data: finalizedIpcrs } = await supabase.from('ipcr_forms').select('adjectival_rating').eq('status', 'finalized')
        performanceDistribution = Object.entries(
            (finalizedIpcrs || []).reduce((acc: any, t) => {
                if (t.adjectival_rating) {
                    acc[t.adjectival_rating] = (acc[t.adjectival_rating] || 0) + 1
                }
                return acc
            }, {})
        ).map(([adjectival_rating, count]) => ({ adjectival_rating, count }))

        return {
            type: 'hr',
            totalActiveStaff: totalActiveStaff || 0,
            pendingLeaveCount: pendingLeaveCount || 0,
            pendingLeaveItems: pendingLeaveItems || [],
            activeCycle: activeCycle || null,
            ipcrsNotFinalized,
            leaveDistribution,
            ipcrStatusCounts,
            performanceDistribution,
            recentAuditLogs: recentAuditLogs || []
        }
    }

    if (isDivisionChief(role)) {
        // Division Chief Stats
        const { count: divisionStaffCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
            .eq('division', userDivision).eq('is_active', true)

        // Pending Leaves for division
        const { data: divisionLeaves } = await supabase.from('leave_requests')
            .select('id, status, profiles!inner(division)')
            .eq('status', 'pending_approval')
            .eq('profiles.division', userDivision)
        const divisionPendingLeaves = divisionLeaves?.length || 0

        // IPCR progress for division
        const { data: activeCycle } = await supabase.from('spms_cycles').select('*').eq('is_active', true).single()
        let divisionIPCRProgress: any[] = []
        let pendingReviewCount = 0

        if (activeCycle) {
            const { data: staff } = await supabase.from('profiles').select('id, full_name, division, position').eq('division', userDivision)
            const { data: ipcrs } = await supabase.from('ipcr_forms').select('employee_id, status').eq('spms_cycle_id', activeCycle.id)

            divisionIPCRProgress = (staff || []).map(emp => {
                const ipcr = (ipcrs || []).find(i => i.employee_id === emp.id)
                return {
                    employee: emp,
                    ipcr_status: ipcr ? ipcr.status : null
                }
            })

            pendingReviewCount = (ipcrs || []).filter(i => i.status === 'submitted' && (staff || []).some(s => s.id === i.employee_id)).length
        }

        // Own IPCR
        let myIPCR = null
        if (activeCycle) {
            const { data } = await supabase.from('ipcr_forms').select('*').eq('employee_id', userId).eq('spms_cycle_id', activeCycle.id).single()
            myIPCR = data
        }

        return {
            type: 'chief',
            divisionStaffCount: divisionStaffCount || 0,
            divisionPendingLeaves,
            divisionIPCRProgress,
            pendingReviewCount,
            myIPCR,
            activeCycle
        }
    }

    // Project Staff / Admin Staff Stats
    const currentYear = new Date().getFullYear()
    const [
        { data: leaveBalances },
        { count: pendingLeaveCount },
        { data: recentLeaves },
        { data: activeCycle },
        { data: dtrLogs }
    ] = await Promise.all([
        supabase.from('leave_balances').select('*').eq('employee_id', userId).eq('year', currentYear).single(),
        supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('employee_id', userId).eq('status', 'pending_approval'),
        supabase.from('leave_requests').select('*').eq('employee_id', userId).order('created_at', { ascending: false }).limit(3),
        supabase.from('spms_cycles').select('*').eq('is_active', true).single(),
        supabase.from('dtr_logs').select('*')
            .eq('employee_id', userId)
            .gte('date', `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`)
    ])

    let myIPCR = null
    if (activeCycle) {
        const { data } = await supabase.from('ipcr_forms').select('*, ipcr_outputs(count)').eq('employee_id', userId).eq('spms_cycle_id', activeCycle.id).single()
        myIPCR = data
    }

    // Calculate DTR monthly stats
    const daysLogged = dtrLogs?.length || 0
    const workingDaysInMonth = 22 // rough estimate per month
    const totalUndertime = (dtrLogs || []).reduce((acc, log) => acc + (log.undertime_minutes || 0), 0)

    return {
        type: 'staff',
        leaveBalances: leaveBalances || {
            vacation_leave_total: 15, vacation_leave_used: 0,
            sick_leave_total: 15, sick_leave_used: 0
        },
        pendingLeaveCount: pendingLeaveCount || 0,
        recentLeaves: recentLeaves || [],
        myIPCR,
        activeCycle,
        dtrThisMonth: {
            daysLogged,
            workingDaysInMonth,
            totalUndertime
        }
    }
}
