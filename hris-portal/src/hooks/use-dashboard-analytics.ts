'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface DashboardStats {
    presentToday: number
    totalActive: number
    pendingLeaves: number
    onLeaveToday: number
    pendingIpcr: number
    isLoading: boolean
    error: string | null
}

/**
 * useDashboardAnalytics Hook
 * Fetches aggregated KPI data for the Admin Dashboard concurrently.
 */
export function useDashboardAnalytics() {
    const [stats, setStats] = useState<DashboardStats>({
        presentToday: 0,
        totalActive: 0,
        pendingLeaves: 0,
        onLeaveToday: 0,
        pendingIpcr: 0,
        isLoading: true,
        error: null
    })

    const supabase = createClient()

    useEffect(() => {
        async function fetchStats() {
            try {
                const today = new Date().toISOString().split('T')[0]
                const todaySearchStr = today // e.g., '2026-02-22'

                const [
                    profilesRes,
                    attendanceRes,
                    leavesPendingRes,
                    onLeaveRes,
                    ipcrRes
                ] = await Promise.all([
                    // 1. Total Active Profiles
                    supabase
                        .from('profiles')
                        .select('id', { count: 'exact', head: true })
                        .eq('is_active', true),

                    // 2. Attendance Today
                    supabase
                        .from('daily_time_records')
                        .select('id', { count: 'exact', head: true })
                        .eq('record_date', today)
                        .not('am_in', 'is', null),

                    // 3. Pending Leaves
                    supabase
                        .from('leave_applications')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'Pending'),

                    // 4. On Leave Today
                    // Approximate check using ilike on the inclusive_dates text field
                    supabase
                        .from('leave_applications')
                        .select('id', { count: 'exact', head: true })
                        .eq('status', 'Approved')
                        .ilike('inclusive_dates', `%${today}%`),

                    // 5. Pending IPCR (Submitted or Reviewed)
                    supabase
                        .from('ipcr_forms')
                        .select('id', { count: 'exact', head: true })
                        .in('status', ['Submitted', 'Reviewed'])
                ])

                setStats({
                    totalActive: profilesRes.count || 0,
                    presentToday: attendanceRes.count || 0,
                    pendingLeaves: leavesPendingRes.count || 0,
                    onLeaveToday: onLeaveRes.count || 0,
                    pendingIpcr: ipcrRes.count || 0,
                    isLoading: false,
                    error: null
                })

            } catch (err: any) {
                setStats(prev => ({ ...prev, isLoading: false, error: err.message }))
            }
        }

        fetchStats()
    }, [])

    return stats
}
