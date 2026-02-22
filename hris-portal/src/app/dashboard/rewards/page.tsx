import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { getAwards } from '@/app/actions/rewards'
import { RewardsClient } from './rewards-client'
import { isHRManager, Role } from '@/lib/roles'

export default async function RewardsPage() {
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
        redirect('/dashboard')
    }

    const role = profile.role as Role
    const canCreate = isHRManager(role)

    let employees: any[] = []

    if (canCreate) {
        const { data } = await supabase.from('profiles').select('id, full_name').order('full_name')
        employees = data || []
    }

    const res = await getAwards()

    return (
        <PageContainer title="Rewards & Incentives">
            <RewardsClient
                awards={res.success ? res.data || [] : []}
                employees={employees}
                canCreate={canCreate}
                currentUserRole={role}
            />
        </PageContainer>
    )
}
