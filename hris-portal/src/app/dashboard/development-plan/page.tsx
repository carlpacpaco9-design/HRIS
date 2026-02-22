import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { getDevelopmentPlans } from '@/app/actions/development-plans'
import { DevelopmentPlanClient } from './development-plan-client'
import { isHRManager, Role } from '@/lib/roles'

export default async function DevelopmentPlanPage() {
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
        const { data } = await supabase.from('profiles').select('id, full_name, division').order('full_name')
        employees = data || []
    }

    const res = await getDevelopmentPlans()

    return (
        <PageContainer title="Development Plans">
            <DevelopmentPlanClient
                plans={res.success ? res.data || [] : []}
                employees={employees}
                canCreate={canCreate}
            />
        </PageContainer>
    )
}
