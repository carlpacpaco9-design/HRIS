import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { getIPCRForms } from '@/app/actions/ipcr'
import { IPCRClient } from './ipcr-client'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'IPCR | PAO HRMS'
}

export default async function IPCRPage() {
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

    // Get active SPMS cycle
    const { data: activeCycle } = await supabase
        .from('spms_cycles')
        .select('*')
        .eq('is_active', true)
        .single()

    // Get all forms for the current user's role context
    const { data: forms } = await getIPCRForms()

    // Check if current user already has an IPCR in the active cycle
    let existingIpcrId = null
    if (activeCycle && forms) {
        const existing = forms.find(
            (f: any) => f.employee_id === user.id && f.spms_cycle_id === activeCycle.id
        )
        if (existing) {
            existingIpcrId = existing.id
        }
    }

    return (
        <PageContainer title="IPCR - Performance Commitment and Review">
            <IPCRClient
                activeCycle={activeCycle || null}
                forms={forms || []}
                role={profile.role}
                currentUserId={user.id}
                existingIpcrId={existingIpcrId}
            />
        </PageContainer>
    )
}
