import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { getAdminStats, getAllCommitments } from "@/app/actions/admin"
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client"
import { PageContainer } from "@/components/layout/page-container"

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Role-based Access Control
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin_staff' && profile?.role !== 'head_of_office') {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p className="text-slate-500">Only Administrative Staff or the Provincial Assessor can access this dashboard.</p>
            </div>
        )
    }

    // Fetch Initial Data
    const [statsResult, commitments] = await Promise.all([
        getAdminStats(),
        getAllCommitments()
    ])

    return (
        <PageContainer>
            <AdminDashboardClient
                initialStats={statsResult.stats}
                initialCommitments={commitments}
            />
        </PageContainer>
    )
}
