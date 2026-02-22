'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'
import {
    MonitoringJournal,
    MonitoringEntryInput,
    MonitoringTaskInput,
    MonitoringJournalStatus
} from '@/types/monitoring'
import { buildNotificationContent, notifyUser, notifyMultipleUsers } from '@/lib/notifications'

// ── HELPERS ──────────────────────────────────────────

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, division_id, full_name')
        .eq('id', user.id)
        .single()

    if (!profile) throw new Error('User profile not found')
    return { user, profile }
}

// ── QUERIES ──────────────────────────────────────────

export async function getMonitoringJournals(filters?: {
    status?: string
    rating_period_id?: string
    division_id?: string
    quarter?: number
}) {
    try {
        const supabase = await createClient()
        const { profile } = await getAuthenticatedUser()

        let query = supabase
            .from('monitoring_journals')
            .select(`
                *,
                rating_period:rating_periods(name),
                division:divisions(name, code),
                conducted_by_profile:profiles!conducted_by(full_name),
                noted_by_profile:profiles!noted_by(full_name),
                entries:monitoring_entries(count),
                tasks:monitoring_tasks(count)
            `)
            .order('created_at', { ascending: false })

        // Role-based visibility
        if (profile.role === 'division_chief') {
            query = query.eq('division_id', profile.division_id)
        } else if (['head_of_office', 'admin_staff'].includes(profile.role)) {
            if (filters?.division_id) {
                query = query.eq('division_id', filters.division_id)
            }
        } else {
            // Regular project staff can't see journals? 
            // The prompt says: "Division Chief: own division only, Head/PMT/Admin: all divisions"
            query = query.eq('id', '00000000-0000-0000-0000-000000000000') // Return empty
        }

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status)
        }
        if (filters?.rating_period_id) {
            query = query.eq('rating_period_id', filters.rating_period_id)
        }
        if (filters?.quarter) {
            query = query.eq('quarter', filters.quarter)
        }

        const { data, error } = await query
        if (error) throw error

        // Transform count results
        const transformedData = data.map((j: any) => ({
            ...j,
            entriesCount: j.entries?.[0]?.count || 0,
            tasksCount: j.tasks?.[0]?.count || 0
        }))

        return { data: transformedData, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function getMonitoringJournalById(id: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('monitoring_journals')
            .select(`
                *,
                rating_period:rating_periods(name),
                division:divisions(name, code),
                conducted_by_profile:profiles!conducted_by(full_name),
                noted_by_profile:profiles!noted_by(full_name),
                entries:monitoring_entries(*),
                tasks:monitoring_tasks(*, action_officer:profiles!action_officer_id(full_name))
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return { data: data as MonitoringJournal, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function checkJournalExists(
    division_id: string,
    rating_period_id: string,
    quarter: number
): Promise<boolean> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('monitoring_journals')
            .select('id')
            .eq('division_id', division_id)
            .eq('rating_period_id', rating_period_id)
            .eq('quarter', quarter)
            .maybeSingle()

        if (error) throw error
        return !!data
    } catch (error) {
        console.error('Error checking journal existence:', error)
        return false
    }
}

export async function getDivisionStaff(division_id: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, position_title')
            .eq('division_id', division_id)
            .order('full_name')

        if (error) throw error
        return data
    } catch (error: any) {
        console.error('Error fetching division staff:', error)
        return []
    }
}

// ── JOURNAL MUTATIONS ────────────────────────────

export async function createMonitoringJournal(data: {
    rating_period_id: string
    division_id: string
    quarter: 1 | 2 | 3 | 4
    conducted_date?: string
}) {
    try {
        const { profile } = await getAuthenticatedUser()

        if (profile.role !== 'division_chief' && profile.role !== 'admin_staff') {
            throw new Error('Only Division Chiefs can create journals')
        }

        const exists = await checkJournalExists(data.division_id, data.rating_period_id, data.quarter)
        if (exists) throw new Error('A journal already exists for this quarter and division')

        const supabase = await createClient()
        const { data: journal, error } = await supabase
            .from('monitoring_journals')
            .insert({
                ...data,
                conducted_by: profile.id,
                status: 'draft'
            })
            .select()
            .single()

        if (error) throw error

        await logActivity('CREATE_MONITORING_JOURNAL', 'monitoring_journal', journal.id, { details: `Created Q${data.quarter} monitoring journal` })

        revalidatePath('/dashboard/monitoring')
        return { data: journal, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function submitMonitoringJournal(id: string) {
    try {
        const { profile } = await getAuthenticatedUser()
        if (profile.role !== 'division_chief' && profile.role !== 'admin_staff') {
            throw new Error('Only Division Chiefs can submit journals')
        }

        const supabase = await createClient()

        // Check requirements: ≥1 entry and ≥1 task
        const { count: entryCount } = await supabase
            .from('monitoring_entries')
            .select('*', { count: 'exact', head: true })
            .eq('journal_id', id)

        const { count: taskCount } = await supabase
            .from('monitoring_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('journal_id', id)

        if ((entryCount || 0) < 1 || (taskCount || 0) < 1) {
            throw new Error('Journal must have at least one monitoring entry and one task before submission')
        }

        const { error } = await supabase
            .from('monitoring_journals')
            .update({ status: 'submitted', updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('status', 'draft')

        if (error) throw error

        await logActivity('SUBMIT_MONITORING_JOURNAL', 'monitoring_journal', id, { details: 'Submitted monitoring journal for notation' })

        revalidatePath('/dashboard/monitoring')
        revalidatePath(`/dashboard/monitoring/${id}`)

        // ── Notification ────────────────────────────────────────────────────
        const { data: journal } = await createClient().then(s =>
            s.from('monitoring_journals')
                .select('quarter, division:divisions(name)')
                .eq('id', id)
                .single()
        )
        const { data: headUsers } = await createClient().then(s =>
            s.from('profiles').select('id, email, full_name').eq('role', 'head_of_office')
        )
        if (headUsers && headUsers.length > 0) {
            const { title, message } = buildNotificationContent('monitoring.submitted', {
                divisionChief: profile.full_name,
                quarter: String((journal as any)?.quarter ?? ''),
                division: (journal as any)?.division?.name ?? '',
            })
            await notifyMultipleUsers(
                headUsers.map((u: any) => ({ id: u.id, email: u.email ?? '', full_name: u.full_name ?? '' })),
                { type: 'monitoring.submitted', title, message, entity_type: 'monitoring', entity_id: id, action_url: `/dashboard/monitoring/${id}` }
            )
        }

        return { error: null }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function noteMonitoringJournal(id: string, noted_by: string) {
    try {
        const { profile } = await getAuthenticatedUser()
        if (profile.role !== 'head_of_office' && profile.role !== 'admin_staff') {
            throw new Error('Only the Provincial Assessor can note journals')
        }

        const supabase = await createClient()
        const { error } = await supabase
            .from('monitoring_journals')
            .update({
                status: 'noted',
                noted_by: noted_by,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('status', 'submitted')

        if (error) throw error

        await logActivity('NOTE_MONITORING_JOURNAL', 'monitoring_journal', id, { details: 'Noted monitoring journal' })

        revalidatePath('/dashboard/monitoring')
        revalidatePath(`/dashboard/monitoring/${id}`)

        // ── Notification ────────────────────────────────────────────────────
        const sb = await createClient()
        const { data: noted } = await sb
            .from('monitoring_journals')
            .select(`quarter, division:divisions(name), creator:profiles!conducted_by(id, full_name, email)`)
            .eq('id', id)
            .single()
        const creator = (noted as any)?.creator
        if (creator) {
            const { title, message } = buildNotificationContent('monitoring.noted', {
                quarter: String((noted as any)?.quarter ?? ''),
                division: (noted as any)?.division?.name ?? '',
                approver: profile.full_name,
            })
            await notifyUser(
                { recipient_id: creator.id, type: 'monitoring.noted', title, message, entity_type: 'monitoring', entity_id: id, action_url: `/dashboard/monitoring/${id}` },
                creator.email ?? '',
                creator.full_name ?? ''
            )
        }

        return { error: null }
    } catch (error: any) {
        return { error: error.message }
    }
}

// ── ENTRY MUTATIONS ──────────────────────────────

export async function addMonitoringEntry(journal_id: string, data: MonitoringEntryInput) {
    try {
        const { profile } = await getAuthenticatedUser()
        const supabase = await createClient()

        // Check if draft
        const { data: journal } = await supabase
            .from('monitoring_journals')
            .select('status')
            .eq('id', journal_id)
            .single()

        if (journal?.status !== 'draft') throw new Error('Can only add entries to draft journals')

        const { data: entry, error } = await supabase
            .from('monitoring_entries')
            .insert({ ...data, journal_id })
            .select()
            .single()

        if (error) throw error

        revalidatePath(`/dashboard/monitoring/${journal_id}`)
        return { data: entry, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function updateMonitoringEntry(entry_id: string, data: Partial<MonitoringEntryInput>) {
    try {
        const supabase = await createClient()
        const { data: entryData } = await supabase
            .from('monitoring_entries')
            .select('journal_id')
            .eq('id', entry_id)
            .single()

        if (!entryData) throw new Error('Entry not found')

        // Check journal status
        const { data: journal } = await supabase
            .from('monitoring_journals')
            .select('status')
            .eq('id', entryData.journal_id)
            .single()

        if (journal?.status !== 'draft') throw new Error('Can only update entries in draft journals')

        const { error } = await supabase
            .from('monitoring_entries')
            .update(data)
            .eq('id', entry_id)

        if (error) throw error

        revalidatePath(`/dashboard/monitoring/${entryData.journal_id}`)
        return { error: null }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteMonitoringEntry(entry_id: string) {
    try {
        const supabase = await createClient()
        const { data: entryData } = await supabase
            .from('monitoring_entries')
            .select('journal_id')
            .eq('id', entry_id)
            .single()

        if (!entryData) throw new Error('Entry not found')

        // Check journal status
        const { data: journal } = await supabase
            .from('monitoring_journals')
            .select('status')
            .eq('id', entryData.journal_id)
            .single()

        if (journal?.status !== 'draft') throw new Error('Can only delete entries from draft journals')

        const { error } = await supabase
            .from('monitoring_entries')
            .delete()
            .eq('id', entry_id)

        if (error) throw error

        revalidatePath(`/dashboard/monitoring/${entryData.journal_id}`)
        return { error: null }
    } catch (error: any) {
        return { error: error.message }
    }
}

// ── TASK MUTATIONS ───────────────────────────────

export async function addMonitoringTask(journal_id: string, data: MonitoringTaskInput) {
    try {
        const supabase = await createClient()

        // Check if draft
        const { data: journal } = await supabase
            .from('monitoring_journals')
            .select('status')
            .eq('id', journal_id)
            .single()

        if (journal?.status !== 'draft') throw new Error('Can only add tasks to draft journals')

        const { data: task, error } = await supabase
            .from('monitoring_tasks')
            .insert({ ...data, journal_id })
            .select()
            .single()

        if (error) throw error

        revalidatePath(`/dashboard/monitoring/${journal_id}`)
        return { data: task, error: null }
    } catch (error: any) {
        return { data: null, error: error.message }
    }
}

export async function updateMonitoringTask(task_id: string, data: Partial<MonitoringTaskInput>) {
    try {
        const supabase = await createClient()
        const { data: taskData } = await supabase
            .from('monitoring_tasks')
            .select('journal_id')
            .eq('id', task_id)
            .single()

        if (!taskData) throw new Error('Task not found')

        // Check journal status
        const { data: journal } = await supabase
            .from('monitoring_journals')
            .select('status')
            .eq('id', taskData.journal_id)
            .single()

        if (journal?.status !== 'draft') throw new Error('Can only update tasks in draft journals')

        const { error } = await supabase
            .from('monitoring_tasks')
            .update(data)
            .eq('id', task_id)

        if (error) throw error

        revalidatePath(`/dashboard/monitoring/${taskData.journal_id}`)
        return { error: null }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteMonitoringTask(task_id: string) {
    try {
        const supabase = await createClient()
        const { data: taskData } = await supabase
            .from('monitoring_tasks')
            .select('journal_id')
            .eq('id', task_id)
            .single()

        if (!taskData) throw new Error('Task not found')

        // Check journal status
        const { data: journal } = await supabase
            .from('monitoring_journals')
            .select('status')
            .eq('id', taskData.journal_id)
            .single()

        if (journal?.status !== 'draft') throw new Error('Can only delete tasks from draft journals')

        const { error } = await supabase
            .from('monitoring_tasks')
            .delete()
            .eq('id', task_id)

        if (error) throw error

        revalidatePath(`/dashboard/monitoring/${taskData.journal_id}`)
        return { error: null }
    } catch (error: any) {
        return { error: error.message }
    }
}
