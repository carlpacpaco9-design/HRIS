'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'
import { isHRManager, Role } from '@/lib/roles'

export async function getSPMSCycles() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('spms_cycles')
            .select('*')
            .order('period_start', { ascending: false })

        if (error) throw error

        return { success: true, data: data }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

type CreateCycleInput = {
    name: string
    period_start: string
    period_end: string
    is_active: boolean
}

export async function createSPMSCycle(input: CreateCycleInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        if (input.is_active) {
            await supabase.from('spms_cycles').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000') // Deactivate all
        }

        const { data, error } = await supabase
            .from('spms_cycles')
            .insert({
                name: input.name,
                period_start: input.period_start,
                period_end: input.period_end,
                is_active: input.is_active
            })
            .select('id')
            .single()

        if (error) throw error

        await logActivity('spms_cycle.created', 'spms_cycles', data.id, {})
        revalidatePath('/dashboard/spms-calendar')

        return { success: true, id: data.id }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function updateSPMSCycle(id: string, input: Partial<CreateCycleInput>) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        if (input.is_active) {
            await supabase.from('spms_cycles').update({ is_active: false }).neq('id', id)
        }

        const { error } = await supabase
            .from('spms_cycles')
            .update({
                name: input.name,
                period_start: input.period_start,
                period_end: input.period_end,
                is_active: input.is_active
            })
            .eq('id', id)

        if (error) throw error

        await logActivity('spms_cycle.updated', 'spms_cycles', id, {})
        revalidatePath('/dashboard/spms-calendar')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

export async function setActiveCycle(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) throw new Error('Forbidden')

        await supabase.from('spms_cycles').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000') // Deactivate all

        const { error } = await supabase.from('spms_cycles').update({ is_active: true }).eq('id', id)
        if (error) throw error

        await logActivity('spms_cycle.activated', 'spms_cycles', id, {})
        revalidatePath('/dashboard/spms-calendar')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}
