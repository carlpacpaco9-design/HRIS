import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { getMonitoringJournals } from '@/app/actions/monitoring'
import { MonitoringClient } from './monitoring-client'
import { isHRManager, isDivisionChief, Role } from '@/lib/roles'

export default async function MonitoringPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, division')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/dashboard')
    }

    const role = profile.role as Role

    const canCreate = isHRManager(role) || isDivisionChief(role)

    let employees: any[] = []

    if (canCreate) {
        let query = supabase.from('profiles').select('id, full_name, division').order('full_name')
        if (isDivisionChief(role)) {
            query = query.eq('division', profile.division)
        }
        const { data } = await query
        employees = data || []
    }

    const { data: cycles } = await supabase.from('spms_cycles').select('*').order('period_start', { ascending: false })

    const res = await getMonitoringJournals()

    return (
        <PageContainer title="Monitoring & Coaching">
            <MonitoringClient
                journals={res.success ? res.data || [] : []}
                employees={employees}
                cycles={cycles || []}
                canCreate={canCreate}
                currentUserId={user.id}
                currentUserRole={role}
                currentUserDivision={profile.division}
            />
        </PageContainer>
    )
}
