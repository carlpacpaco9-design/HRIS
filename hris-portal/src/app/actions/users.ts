'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { determineRole, Division } from '@/lib/office-structure'
import { ROLES } from '@/lib/roles'
import { logActivity } from '@/lib/audit-logger'

async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== ROLES.ADMIN_STAFF && profile?.role !== ROLES.HEAD_OF_OFFICE) {
        throw new Error('Forbidden')
    }
    return user
}

export async function getUsers() {
    try {
        await requireAdmin()
        const supabase = await createClient()
        const { data: profiles, error } = await supabase.from('profiles').select('*').order('full_name')
        if (error) throw error

        const adminClient = createAdminClient()
        const { data: { users } } = await adminClient.auth.admin.listUsers()

        const mapped = profiles?.map(p => {
            const au = users.find(u => u.id === p.id)
            return {
                ...p,
                email: au?.email || ''
            }
        }) || []

        return { success: true, data: mapped }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function createUser(input: {
    email: string
    password: string
    full_name: string
    role: string
    division: string
    position: string
    id_number: string
}) {
    try {
        await requireAdmin()
        const adminClient = createAdminClient()

        // 1. Create auth user
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: input.email,
            password: input.password,
            email_confirm: true,
            user_metadata: {
                full_name: input.full_name
            }
        })

        if (authError || !authData.user) {
            return { success: false, error: authError?.message ?? 'Failed to create user' }
        }

        // 2. Assign Role automatically if not explicit
        const assignedRole = (input.role === 'division_chief' || input.role === 'head_of_office')
            ? input.role
            : determineRole(input.position, input.division as Division)

        // 3. Create profile record
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
                id: authData.user.id,
                full_name: input.full_name,
                role: assignedRole,
                division: input.division,
                position: input.position, // position is the correct column based on initial_schema
                employee_number: input.id_number,
                is_active: true
            })

        if (profileError) {
            await adminClient.auth.admin.deleteUser(authData.user.id)
            return { success: false, error: profileError.message }
        }

        // 4. Initialize Leave Balances
        const currentYear = new Date().getFullYear();
        await adminClient
            .from('leave_balances')
            .insert({
                employee_id: authData.user.id,
                year: currentYear,
                vacation_leave_total: 15,
                vacation_leave_used: 0,
                sick_leave_total: 15,
                sick_leave_used: 0,
                special_leave_total: 5,
                special_leave_used: 0,
                emergency_leave_total: 3,
                emergency_leave_used: 0
            })

        await logActivity('CREATE_USER', 'Profile', authData.user.id, { created_email: input.email })
        revalidatePath('/dashboard/admin/users')
        return { success: true, data: authData.user }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function updateUser(userId: string, input: {
    role: string
    division: string
    position: string
}) {
    try {
        await requireAdmin()
        const adminClient = createAdminClient()

        const { error } = await adminClient
            .from('profiles')
            .update({
                role: input.role,
                division: input.division,
                position: input.position
            })
            .eq('id', userId)

        if (error) return { success: false, error: error.message }

        await logActivity('UPDATE_USER', 'Profile', userId, { updates: input })
        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function deactivateUser(userId: string) {
    try {
        await requireAdmin()
        const adminClient = createAdminClient()

        const { error } = await adminClient
            .from('profiles')
            .update({ is_active: false })
            .eq('id', userId)

        if (error) throw error

        await adminClient.auth.admin.updateUserById(userId, {
            ban_duration: '876600h' // ~100 years
        })

        await logActivity('DEACTIVATE_USER', 'Profile', userId, {})
        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function reactivateUser(userId: string) {
    try {
        await requireAdmin()
        const adminClient = createAdminClient()

        const { error } = await adminClient
            .from('profiles')
            .update({ is_active: true })
            .eq('id', userId)

        if (error) throw error

        await adminClient.auth.admin.updateUserById(userId, {
            ban_duration: 'none'
        })

        await logActivity('REACTIVATE_USER', 'Profile', userId, {})
        revalidatePath('/dashboard/admin/users')
        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function resetUserPassword(userId: string, newPassword: string) {
    try {
        await requireAdmin()
        const adminClient = createAdminClient()

        const { error } = await adminClient.auth.admin.updateUserById(userId, {
            password: newPassword
        })

        if (error) return { success: false, error: error.message }

        await logActivity('RESET_PASSWORD', 'User', userId, {})
        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}
