import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { getDashboardStats } from '@/app/actions/dashboard'
import { Role, isHRManager, isDivisionChief } from '@/lib/roles'
import { HRDashboard } from './hr-dashboard'
import { ChiefDashboard } from './chief-dashboard'
import { StaffDashboard } from './staff-dashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Dashboard | PAO HRMS'
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, division, full_name')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    const stats = await getDashboardStats(profile.role as Role, user.id, profile.division)

    const hour = new Date().getHours()
    let greeting = `Good evening`
    if (hour < 12) greeting = `Good morning`
    else if (hour < 17) greeting = `Good afternoon`

    // Use the employee's first name
    const firstName = profile.full_name.split(' ')[0]
    const fullGreeting = `${greeting}, ${firstName}! ${hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙'}`

    return (
        <PageContainer title="Dashboard" description={fullGreeting}>
            <div className="flex flex-col space-y-6">
                {stats.type === 'hr' && <HRDashboard stats={stats as any} />}
                {stats.type === 'chief' && <ChiefDashboard stats={stats as any} profile={profile} />}
                {stats.type === 'staff' && <StaffDashboard stats={stats as any} profile={profile} />}
            </div>
        </PageContainer>
    )
}
