import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { getDPCRForms } from '@/app/actions/dpcr'
import { DPCRClient } from './dpcr-client'
import { isHRManager, Role } from '@/lib/roles'

export default async function DPCRPage() {
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

    if (!profile || !isHRManager(profile.role as Role)) {
        redirect('/dashboard')
    }

    // Get active SPMS cycle
    const { data: activeCycle } = await supabase
        .from('spms_cycles')
        .select('*')
        .eq('is_active', true)
        .single()

    // Get all forms
    const { data: forms } = await getDPCRForms()

    // Check if there is an DPCR in the active cycle
    let existingDpcrId = null
    if (activeCycle && forms) {
        const existing = forms.find((f: any) => f.spms_cycle_id === activeCycle.id)
        if (existing) {
            existingDpcrId = existing.id
        }
    }

    return (
        <PageContainer title="DPCR - Office Performance Commitment and Review">
            <DPCRClient
                activeCycle={activeCycle || null}
                forms={forms || []}
                existingDpcrId={existingDpcrId}
            />
        </PageContainer>
    )
}
