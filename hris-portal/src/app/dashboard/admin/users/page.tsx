import PageContainer from '@/components/layout/page-container'
import { UserManagementClient } from '@/components/admin/users/user-management-client'
import { getUsers } from '@/app/actions/users'
import { redirect } from 'next/navigation'

export default async function UserManagementPage() {
    const result = await getUsers()

    if (!result.success) {
        if (result.error === 'Forbidden') {
            redirect('/dashboard') // Or some unauthorized page
        }
    }

    const users = result.data || []

    return (
        <PageContainer title="">
            <UserManagementClient initialUsers={users} />
        </PageContainer>
    )
}
