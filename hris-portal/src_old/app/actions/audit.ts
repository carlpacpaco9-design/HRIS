'use server'

import { createClient } from "@/utils/supabase/server"
import { formatDistanceToNow } from "date-fns"

export async function getAuditLogs(page: number = 1, limit: number = 20, searchTerm: string = '') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // Role check - Only admin can view logs
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin_staff' && profile?.role !== 'head_of_office') {
        throw new Error("Access Denied: Admin only")
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
        .from('audit_logs')
        .select(`
            *,
            profiles:user_id (
                full_name,
                department
            )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

    if (searchTerm) {
        // Since we join with profiles, we might need a more complex filter 
        // if we want to search by profile name. 
        // For now, filtering by action type.
        query = query.ilike('action', `%${searchTerm}%`)
    }

    const { data, count, error } = await query

    if (error) {
        return { error: error.message, logs: [], count: 0 }
    }

    return {
        logs: data || [],
        count: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
    }
}

// New Action for Dashboard Feed
export async function getRecentActivity(limit: number = 5) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Get user role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, department')
        .eq('id', user.id)
        .single()

    let query = supabase
        .from('audit_logs')
        .select(`
            id,
            action,
            created_at,
            details,
            profiles:user_id (
                full_name,
                role
            )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

    // Filtering logic
    if (profile?.role === 'admin_staff' || profile?.role === 'head_of_office') {
        // Admins see everything
    } else if (profile?.role === 'head_of_office' || profile?.role === 'division_chief') {
        // Heads see their department (This requires joining profiles on the query filter which is tricky in Supabase basic syntax without RPC)
        // Alternative: Fetch logs where user_id is in list of department members.
        // For performance simplicty in this MVP: Just show their own logs for now, or all if we treat audit logs as public 'feed'.
        // Let's restricting to their own logs to be safe and avoid "Rogue Feed".
        query = query.eq('user_id', user.id)
    } else {
        // Employees see only their own logs
        query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (error) return []

    // Format for FE
    return data.map((log: any) => {
        const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true })
        const userName = log.profiles?.full_name || 'Unknown User'
        const userInitial = userName.charAt(0).toUpperCase()

        // Map Action to Readable String
        let actionText = log.action
        let color = "bg-slate-100 text-slate-600"

        if (log.action.includes('LOGIN')) {
            actionText = "logged into the system."
            color = "bg-green-100 text-green-600"
        } else if (log.action.includes('submit')) {
            actionText = "submitted a request."
            color = "bg-blue-100 text-blue-600"
        } else if (log.action.includes('IPCR')) {
            actionText = "updated their IPCR."
            color = "bg-purple-100 text-purple-600"
        } else if (log.action.includes('DTR')) {
            actionText = "updated their Daily Time Record."
            color = "bg-amber-100 text-amber-600"
        }

        return {
            id: log.id,
            user: userName,
            action: actionText,
            time: timeAgo,
            initial: userInitial,
            color: color
        }
    })
}
