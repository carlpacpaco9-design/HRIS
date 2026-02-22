import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'
import PageContainer from '@/components/layout/page-container'

import { getSidebarCounts } from '@/app/actions/sidebar-counts'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, role, division')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    const counts = await getSidebarCounts(profile.role as any, user.id, profile.division)

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
            <Sidebar profile={profile} counts={counts} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header profile={profile} />
                {children}
            </div>
        </div>
    )
}
