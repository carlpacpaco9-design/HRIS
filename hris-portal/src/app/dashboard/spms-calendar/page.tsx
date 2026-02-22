import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { getSPMSCycles } from '@/app/actions/spms-calendar'
import { CalendarClient } from './calendar-client'
import { isHRManager, Role } from '@/lib/roles'

export default async function SpmsCalendarPage() {
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
    const canManage = isHRManager(role)

    const res = await getSPMSCycles()

    return (
        <PageContainer title="SPMS Calendar">
            <CalendarClient
                cycles={res.success ? res.data || [] : []}
                canManage={canManage}
            />
        </PageContainer>
    )
}
