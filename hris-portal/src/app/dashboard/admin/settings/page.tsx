import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { isHRManager, Role } from '@/lib/roles'
import { AdminPanelClient } from './admin-panel-client'
import { getAuditLogs } from '@/app/actions/admin'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Admin Panel | PAO HRMS'
}

export default async function AdminPanelPage({
    searchParams
}: {
    searchParams: { filter?: string; page?: string }
}) {
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

    const filter = searchParams.filter || 'all'
    const page = parseInt(searchParams.page || '1', 10)

    const logsRes = await getAuditLogs(filter, page)
    const logs = logsRes.success ? (logsRes.data || []) : []
    const totalCount = logsRes.success ? (logsRes.count || 0) : 0

    return (
        <PageContainer title="Admin Panel" description="System configuration and utilities">
            <AdminPanelClient initialLogs={logs} totalCount={totalCount} currentFilter={filter} currentPage={page} />
        </PageContainer>
    )
}
