import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { AuditLogViewer } from "@/components/admin/audit-log-viewer"
import { ShieldAlert } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Role-based Access Control - Only Admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin_staff' && profile?.role !== 'head_of_office') {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                <ShieldAlert className="h-12 w-12 text-red-500" />
                <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
                <p className="text-slate-500">Only HR Admins can view the system audit logs.</p>
            </div>
        )
    }

    return (
        <div className="p-6 pb-24 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Audit Logs</h1>
                <p className="text-slate-500">Track all critical actions and changes across the application.</p>
            </div>

            <AuditLogViewer />
        </div>
    )
}
