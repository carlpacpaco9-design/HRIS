'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. Get Current User Profile
export async function getProfile() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('User not authenticated')
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        // If no profile exists, return basic user info to prevent crash
        return {
            id: user.id,
            email: user.email,
            full_name: '',
            role: 'project_staff',
            department: '',
            position_title: '',
            supervisor_id: null,
            avatar_url: ''
        }
    }

    return profile
}

// 2. Get Potential Supervisors (Based on Hierarchy)
export async function getPotentialSupervisors() {
    const supabase = await createClient()

    // Get current user to check their role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const userRole = currentUserProfile?.role || 'project_staff'
    let targetRoles: string[] = []

    // Define Hierarchy
    if (userRole === 'project_staff') {
        // Staff report to Division Chiefs or directly to Provincial Assessor
        targetRoles = ['division_chief', 'head_of_office']
    } else if (userRole === 'division_chief') {
        // Chiefs report to the Provincial Assessor
        targetRoles = ['head_of_office']
    } else if (userRole === 'head_of_office') {
        // Provincial Assessor reports to nobody
        return []
    } else {
        // Fallback/Admin
        targetRoles = ['division_chief', 'head_of_office', 'admin_staff']
    }

    const { data: supervisors, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, position_title')
        .in('role', targetRoles)
        .neq('id', user.id) // Don't show self
        .order('full_name')

    if (error) {
        console.error('Error fetching supervisors:', error)
        return []
    }

    return supervisors
}

// 3. Update Profile Action
export async function updateProfile(formData: FormData) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Unauthorized' }
    }

    const full_name = formData.get('full_name') as string
    const position_title = formData.get('position_title') as string
    const department = formData.get('department') as string
    const supervisor_id = formData.get('supervisor_id') as string
    const role = formData.get('role') as string

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name,
            position_title,
            department,
            role,
            supervisor_id: supervisor_id === 'none' ? null : supervisor_id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

    if (error) {
        console.error('Update Error:', error)
        return { error: 'Failed to update profile' }
    }

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard') // Update sidebar name as well

    return { success: 'Profile updated successfully' }
}
