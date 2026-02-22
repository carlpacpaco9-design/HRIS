import { getLeaveRequests, getLeaveBalance } from '@/app/actions/leaves'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { LeaveClient } from './leave-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Leaves | PAO HRMS'
}

export default async function LeavesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    // Fetch all allowed leaves for this user based on their role
    const { data: leaves } = await getLeaveRequests()

    // Fetch current year balance for the logged in user
    const currentYear = new Date().getFullYear()
    const { data: balance } = await getLeaveBalance(user.id, currentYear)

    return (
        <PageContainer title="Leave Management">
            <LeaveClient
                leaves={leaves || []}
                balance={balance || null}
                role={profile.role}
                currentUserId={user.id}
            />
        </PageContainer>
    )
}
