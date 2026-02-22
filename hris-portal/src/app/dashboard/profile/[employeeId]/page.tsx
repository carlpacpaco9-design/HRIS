import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from '../profile-client'
import PageContainer from '@/components/layout/page-container'
import { isHRManager, Role } from '@/lib/roles'

export default async function EmployeeProfilePage({ params }: { params: { employeeId: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!currentUserProfile || !isHRManager(currentUserProfile.role as Role)) {
        redirect('/dashboard') // Only HR can view other profiles this way
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.employeeId)
        .single()

    if (!profile) {
        redirect('/dashboard')
    }

    // Fetch Leave Balances
    const currentYear = new Date().getFullYear()
    const { data: leaveBalanceData } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', params.employeeId)
        .eq('year', currentYear)
        .single()

    // Fetch Leave Requests (last 5)
    const { data: recentLeaves } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', params.employeeId)
        .order('created_at', { ascending: false })
        .limit(5)

    // Fetch IPCR History (finalized)
    const { data: ipcrHistory } = await supabase
        .from('ipcr_forms')
        .select('*, spms_cycles(name)')
        .eq('employee_id', params.employeeId)
        .eq('status', 'finalized')
        .order('created_at', { ascending: false })

    return (
        <PageContainer title={`Profile: ${profile.full_name}`}>
            <ProfileClient
                profile={profile}
                leaveBalance={leaveBalanceData}
                recentLeaves={recentLeaves || []}
                ipcrHistory={ipcrHistory || []}
                isOwnProfile={false}
                canEdit={true} // HR can edit
            />
        </PageContainer>
    )
}
