import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileClient } from './profile-client'
import PageContainer from '@/components/layout/page-container'

export default async function MyProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/dashboard')
    }

    // Fetch Leave Balances
    const currentYear = new Date().getFullYear()
    const { data: leaveBalanceData } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', user.id)
        .eq('year', currentYear)
        .single()

    // Fetch Leave Requests (last 5)
    const { data: recentLeaves } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    // Fetch IPCR History (finalized)
    const { data: ipcrHistory } = await supabase
        .from('ipcr_forms')
        .select('*, spms_cycles(name)')
        .eq('employee_id', user.id)
        .eq('status', 'finalized')
        .order('created_at', { ascending: false })

    return (
        <PageContainer title="My Profile">
            <ProfileClient
                profile={profile}
                leaveBalance={leaveBalanceData}
                recentLeaves={recentLeaves || []}
                ipcrHistory={ipcrHistory || []}
                isOwnProfile={true}
                canEdit={false}
            />
        </PageContainer>
    )
}
