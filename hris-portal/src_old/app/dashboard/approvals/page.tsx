import { createClient } from '@/utils/supabase/server'
import { getPendingSubmissions, getTeamCommitments } from '@/app/actions/approvals'
import ApprovalsPageClient from './approvals-page-client'

export const dynamic = 'force-dynamic'

export default async function ApprovalsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const pendingSubmissions = await getPendingSubmissions()
    const teamCommitments = await getTeamCommitments()

    // Fetch pending leaves
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, division')
        .eq('id', user.id)
        .single()

    let leaveQuery = supabase
        .from('leave_applications')
        .select(`
            *,
            staff:profiles!user_id(
                full_name, 
                email, 
                division, 
                position_title
            )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

    // Division Chief sees only their division
    if (profile?.role === 'division_chief') {
        // Need to filter on the joined table, but Supabase/PostgREST syntax for filtering on joined columns:
        // .eq('employee.division', profile.division) works if referencing the alias/table correctly.
        // However, filtering on joined tables usually requires !inner join or similar if using 'employee.division' syntax directly in .eq?
        // Actually, Supabase supports filtering on joined resource: .eq('profiles.division', ...)
        // Since I aliased it as 'employee', maybe .eq('employee.division', ...)?
        // Or I can filter in application layer if volume is low.
        // For safety and correctness with Supabase JS:
        // .eq('profiles.division', profile.division) IF I didn't alias.
        // With alias: .eq('employee.division', profile.division) MIGHT work in newer versions, or not.
        // Safe bet: !inner join and filter. 
        // Query: select('*, employee:profiles!user_id!inner(division, ...)') .eq('employee.division', profile.division)

        // Let's try the !inner approach to be safe for filtering.
        leaveQuery = supabase
            .from('leave_applications')
            .select(`
                *,
                staff:profiles!user_id!inner(
                    full_name, 
                    email, 
                    division, 
                    position_title
                )
            `)
            .eq('status', 'pending')
            .eq('staff.division', profile.division)
            .order('created_at', { ascending: true })
        // Note: position_title mapping to position in client
    }

    const { data: pendingLeaves } = await leaveQuery

    // Map fields to match client expectation
    const formattedLeaves = pendingLeaves?.map((l: any) => ({
        ...l,
        staff: {
            ...l.staff,
            position: l.staff.position_title || l.staff.position // Handle both
        }
    })) || []

    return (
        <ApprovalsPageClient
            pendingSubmissions={pendingSubmissions}
            teamCommitments={teamCommitments}
            pendingLeaves={formattedLeaves}
        />
    )
}

