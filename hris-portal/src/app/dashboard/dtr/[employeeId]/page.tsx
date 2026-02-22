import { getDTRByMonth, Profile, DTRLog } from '@/app/actions/dtr'
import { createClient } from '@/utils/supabase/server'
import { isHRManager, Role } from '@/lib/roles'
import { notFound, redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { DTRDetailView } from '@/components/dtr/dtr-detail-view'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

type Params = Promise<{ employeeId: string }>
type SearchParams = Promise<{ month?: string, year?: string }>

export default async function EmployeeDTRPage(props: {
    params: Params
    searchParams: SearchParams
}) {
    const params = await props.params;
    const employeeId = params.employeeId;
    const searchParams = await props.searchParams;
    const month = searchParams.month;
    const year = searchParams.year;

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Ensure current user is not project staff (can only view /me)
    // And that the page exists for this employee
    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentUserProfile?.role === 'project_staff' && user.id !== employeeId) {
        redirect('/dashboard/dtr/me')
    }

    if (user.id === employeeId) {
        redirect('/dashboard/dtr/me')
    }

    const { data: employeeProfile } = await supabase
        .from('profiles')
        .select('id, full_name, position, division, employee_number')
        .eq('id', employeeId)
        .single()

    if (!employeeProfile) {
        notFound()
    }

    const m = month ? parseInt(month) : new Date().getMonth() + 1
    const y = year ? parseInt(year) : new Date().getFullYear()

    const result = await getDTRByMonth(employeeId, m, y)

    if (!result.success && result.error === 'Forbidden') {
        redirect('/dashboard/dtr') // Probably chief trying to view wrong division
    }

    const logs = result.data || []
    const role = currentUserProfile?.role as Role
    const canEdit = isHRManager(role)
    const canAdminister = isHRManager(role)

    return (
        <PageContainer title={`${employeeProfile.full_name} — Daily Time Record`}>
            <div className="mb-6">
                <Link href="/dashboard/dtr" className="text-sm font-medium text-slate-500 hover:text-[#1E3A5F] flex items-center mb-4">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back to Roster
                </Link>
                <p className="text-slate-500 text-lg">
                    {employeeProfile.position} · {employeeProfile.division}
                </p>
            </div>

            <DTRDetailView
                employee={employeeProfile}
                initialLogs={logs as DTRLog[]}
                initialMonth={m}
                initialYear={y}
                canEdit={canEdit}
                canAdminister={canAdminister}
            />
        </PageContainer>
    )
}
