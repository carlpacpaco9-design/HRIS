import { getAllUsers } from '@/app/actions/admin-users'
import { UserManagementClient } from './user-management-client'
import { PageContainer } from '@/components/layout/page-container'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
    // Permission check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin_staff' && profile?.role !== 'head_of_office') {
        redirect('/dashboard')
    }

    // Fetch data
    const result = await getAllUsers()
    const users = result.success ? (result.data as any[]) : []

    return (
        <PageContainer>
            <UserManagementClient initialUsers={users} />
        </PageContainer>
    )
}
