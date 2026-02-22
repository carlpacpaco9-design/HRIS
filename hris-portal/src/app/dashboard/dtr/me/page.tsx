import { getDTRByMonth, DTRLog } from '@/app/actions/dtr'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { DTRDetailView } from '@/components/dtr/dtr-detail-view'

// The 'searchParams' are a promise in newer Next.js versions. We must await them before use.
type SearchParams = Promise<{ month?: string, year?: string }>

export default async function OwnDTRPage(props: {
    searchParams: SearchParams
}) {
    const searchParams = await props.searchParams;
    const month = searchParams.month;
    const year = searchParams.year;

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, position, division, employee_number')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    const m = month ? parseInt(month) : new Date().getMonth() + 1
    const y = year ? parseInt(year) : new Date().getFullYear()

    const result = await getDTRByMonth(user.id, m, y)
    const logs = result.data || []

    return (
        <PageContainer title="My Daily Time Record">
            <div className="mb-6">
                <p className="text-slate-500 text-lg">
                    {profile.position} · {profile.division}
                </p>
            </div>

            <DTRDetailView
                employee={profile}
                initialLogs={logs as DTRLog[]}
                initialMonth={m}
                initialYear={y}
                canEdit={false} // Never edit your own DTR via this route
                canAdminister={false} // Label difference down inside
            />
        </PageContainer>
    )
}
