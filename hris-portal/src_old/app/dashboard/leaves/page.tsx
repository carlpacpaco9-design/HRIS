import { getLeaveBalances, getLeaveApplications } from '@/app/actions/leaves'
import LeavesPageClient from './leaves-page-client'
import { createClient } from "@/utils/supabase/server"

export const dynamic = 'force-dynamic'

export default async function LeavesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const [balances, applications, profileRes] = await Promise.all([
        getLeaveBalances(),
        getLeaveApplications(),
        supabase.from('profiles').select('full_name').eq('id', user?.id).single()
    ])

    return (
        <LeavesPageClient
            balances={balances}
            applications={applications}
            profile={profileRes.data}
        />
    )
}

