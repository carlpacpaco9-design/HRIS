'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

// 1. Get Admin Overview Stats
export async function getAdminStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // Check permissions
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin_staff' && profile?.role !== 'head_of_office') {
        return { error: "Access Denied" }
    }

    // Get Active Cycle
    const { data: activeCycle } = await supabase
        .from('spms_cycles')
        .select('*')
        .eq('is_active', true)
        .single()

    if (!activeCycle) return { stats: null, error: "No active cycle found" }

    // Aggregate Counts using raw SQL or multiple queries
    // Count Total Staff (approximated by profiles)
    const { count: staffCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    // Count IPCR Statuses for THIS cycle
    const { data: commitments } = await supabase
        .from('spms_commitments')
        .select('status')
        .eq('cycle_id', activeCycle.id)

    const totalStaff = staffCount || 0
    const drafted = commitments?.filter(c => c.status === 'draft').length || 0
    const pending = commitments?.filter(c => c.status === 'pending_approval' || c.status === 'approved').length || 0
    const rated = commitments?.filter(c => c.status === 'rated' || c.status === 'closed').length || 0

    // Submission Rate: (Pending + Rated) / Total Staff
    // Note: This assumes every staff member MUST have a commitment. 
    // In reality, detailed analytics might need a LEFT JOIN from profiles to commitments.
    const submittedCount = pending + rated
    const submissionRate = totalStaff > 0 ? (submittedCount / totalStaff) * 100 : 0

    return {
        stats: {
            totalUsers: totalStaff,
            activeCycle: activeCycle,
            drafted,
            pending,
            rated,
            submissionRate: Math.round(submissionRate)
        }
    }
}

// 2. Get All Commitments for Table
export async function getAllCommitments(statusFilter?: string) {
    const supabase = await createClient()

    const { data: activeCycle } = await supabase
        .from('spms_cycles')
        .select('id')
        .eq('is_active', true)
        .single()

    if (!activeCycle) return []

    let query = supabase
        .from('spms_commitments')
        .select(`
            id,
            status,
            final_rating,
            adjectival_rating,
            profiles:user_id (full_name, department),
            supervisor:supervisor_id (full_name)
        `)
        .eq('cycle_id', activeCycle.id)

    if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
        console.error("Error fetching commitments:", error)
        return []
    }

    return data
}


import { logActivity } from "@/lib/audit-logger"

// 3. Cycle Management
export async function createCycle(title: string, start: string, end: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase
        .from('spms_cycles')
        .insert({
            title,
            start_date: start,
            end_date: end,
            is_active: false // Default to inactive, let user toggle
        })

    if (error) {
        await logActivity('CREATE_CYCLE_FAILED', 'SPMS_CYCLE', 'new', { title, error: error.message })
        return { error: error.message }
    }

    await logActivity('CREATE_CYCLE_SUCCESS', 'SPMS_CYCLE', 'new', { title, start, end })
    revalidatePath('/dashboard/admin')
    return { success: true }
}

export async function toggleCycle(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    // 1. Deactivate all
    await supabase.from('spms_cycles').update({ is_active: false }).neq('id', id)

    // 2. Activate target
    const { error } = await supabase
        .from('spms_cycles')
        .update({ is_active: true })
        .eq('id', id)

    if (error) {
        await logActivity('TOGGLE_CYCLE_FAILED', 'SPMS_CYCLE', id, { error: error.message })
        return { error: error.message }
    }

    await logActivity('TOGGLE_CYCLE_SUCCESS', 'SPMS_CYCLE', id)
    revalidatePath('/dashboard/admin')
    return { success: true }
}
