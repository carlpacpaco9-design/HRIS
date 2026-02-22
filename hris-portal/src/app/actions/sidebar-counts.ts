'use server'

import { createClient } from '@/utils/supabase/server'
import { Role, isHRManager, isDivisionChief } from '@/lib/roles'

export async function getSidebarCounts(role: Role, userId: string, userDivision: string) {
    const supabase = await createClient()

    let pendingApprovals = 0
    let ipcrsAwaitingAction = 0

    if (isHRManager(role)) {
        // HR sees all pending leaves
        const { count: leaves } = await supabase.from('leave_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending_approval')

        // HR sees all submitted DPCRs? Wait, "IPCRs awaiting action" for HR means reviewed IPCRs that need finalization.
        // The spec says:
        // // leave + IPCR awaiting HR action
        // // submitted (for chief)
        // // or reviewed (for HR)
        const { count: hrIpcrs } = await supabase.from('ipcr_forms')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'reviewed') // Waiting for HR finalization

        pendingApprovals = leaves || 0
        ipcrsAwaitingAction = hrIpcrs || 0
    } else if (isDivisionChief(role)) {
        // Division chief sees pending leaves for their division
        const { data: divLeaves } = await supabase.from('leave_requests')
            .select('id, profiles!inner(division)')
            .eq('status', 'pending_approval')
            .eq('profiles.division', userDivision)

        // Division chief sees submitted IPCRs for their division
        const { data: divIpcrs } = await supabase.from('ipcr_forms')
            .select('id, profiles!inner(division)')
            .eq('status', 'submitted')
            .eq('profiles.division', userDivision)

        pendingApprovals = divLeaves?.length || 0
        ipcrsAwaitingAction = divIpcrs?.length || 0
    }

    return {
        pendingApprovals,
        ipcrsAwaitingAction
    }
}
