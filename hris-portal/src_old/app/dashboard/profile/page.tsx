import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './profile-client'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            *,
            division:divisions(name)
        `)
        .eq('id', user.id)
        .single()

    const { data: leaveBalances } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', new Date().getFullYear())
        .maybeSingle()

    const { data: ipcrHistory } = await supabase
        .from('ipcr_forms')
        .select(`
            *,
            rating_period:rating_periods(name)
        `)
        .eq('employee_id', user.id)
        .in('status', ['finalized', 'approved'])
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <ProfileClient
            profile={profile}
            leaveBalances={leaveBalances}
            ipcrHistory={ipcrHistory || []}
        />
    )
}
