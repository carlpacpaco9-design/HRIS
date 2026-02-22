'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Admin Supabase client (bypasses RLS)
function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

import { ROLES } from '@/lib/roles'
import { determineRole, Division } from '@/lib/office-structure'

// ─────────────────────────────────────
// GUARD: Only staff with elevated roles can call these
// ─────────────────────────────────────
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

// ─────────────────────────────────────
// CREATE USER
// ─────────────────────────────────────
export async function createStaff(input: {
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
        const adminClient = getAdminClient()

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
            return {
                success: false,
                error: authError?.message ?? 'Failed to create user'
            }
        }

        // 2. Assign Role automatically if not explicitly division_chief or specialized
        const assignedRole = (input.role === 'division_chief' || input.role === 'head_of_office')
            ? input.role
            : determineRole(input.position, input.division as Division)

        // 3. Create profile record
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: input.email,
                full_name: input.full_name,
                role: assignedRole,
                division: input.division,
                position_title: input.position,
                employee_number: input.id_number,
                is_active: true
            })

        if (profileError) {
            // Rollback auth user if profile fails
            await adminClient.auth.admin.deleteUser(authData.user.id)
            return {
                success: false,
                error: profileError.message
            }
        }

        revalidatePath('/dashboard/admin')
        return { success: true, data: authData.user }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

// ─────────────────────────────────────
// GET ALL USERS
// ─────────────────────────────────────
export async function getAllUsers() {
    try {
        await requireAdmin()
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, division, position_title, employee_number, is_active, created_at')
            .order('full_name', { ascending: true })

        if (error) return { success: false, error: error.message }
        return { success: true, data: data ?? [] }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

// ─────────────────────────────────────
// UPDATE USER ROLE
// ─────────────────────────────────────
export async function updateUserRole(userId: string, role: string) {
    try {
        await requireAdmin()
        const supabase = await createClient()

        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId)

        if (error) return { success: false, error: error.message }
        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

// ─────────────────────────────────────
// UPDATE USER DIVISION
// ─────────────────────────────────────
export async function updateUserDivision(userId: string, division: string) {
    try {
        await requireAdmin()
        const supabase = await createClient()

        const { error } = await supabase
            .from('profiles')
            .update({ division: division }) // Assuming 'division' column
            .eq('id', userId)

        if (error) return { success: false, error: error.message }
        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

// ─────────────────────────────────────
// UPDATE USER POSITION
// ─────────────────────────────────────
export async function updateUserPosition(userId: string, position: string) {
    try {
        await requireAdmin()
        const supabase = await createClient()

        const { error } = await supabase
            .from('profiles')
            .update({ position_title: position })
            .eq('id', userId)

        if (error) return { success: false, error: error.message }
        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

// ─────────────────────────────────────
// TOGGLE USER ACTIVE STATUS
// ─────────────────────────────────────
export async function toggleUserActive(userId: string, isActive: boolean) {
    try {
        await requireAdmin()
        const adminClient = getAdminClient()
        const supabase = await createClient()

        // Update profile
        const { error } = await supabase
            .from('profiles')
            .update({ is_active: isActive })
            .eq('id', userId)

        if (error) throw error

        // Ban/unban in Supabase Auth
        if (!isActive) {
            await adminClient.auth.admin.updateUserById(userId, {
                ban_duration: '876600h' // ~100 years
            })
        } else {
            await adminClient.auth.admin.updateUserById(userId, {
                ban_duration: 'none'
            })
        }

        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

// ─────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────
export async function resetUserPassword(userId: string, newPassword: string) {
    try {
        await requireAdmin()
        const adminClient = getAdminClient()

        const { error } = await adminClient.auth.admin.updateUserById(userId, {
            password: newPassword
        })

        if (error) return { success: false, error: error.message }
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}
