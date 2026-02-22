import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-client'
import { getRatingPeriods } from '@/app/actions/ipcr'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin_staff') {
        redirect('/dashboard')
    }

    const { data: activeCycle } = await supabase
        .from('rating_periods')
        .select('*')
        .eq('status', 'active')
        .maybeSingle()

    const { data: allCycles } = await getRatingPeriods()

    return (
        <SettingsClient
            activeCycle={activeCycle}
            allCycles={allCycles || []}
        />
    )
}
