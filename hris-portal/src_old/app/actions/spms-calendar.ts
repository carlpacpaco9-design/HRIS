'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/audit-logger"
import {
    CalendarEventType,
    CalendarEventStatus,
    SPMSCalendarEvent,
    SPMSCalendarEventInput,
    ComplianceSummary
} from "@/types/spms-calendar"

/**
 * Helper to get authenticated user and profile
 */
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
    return { user, profile, supabase }
}

// ── QUERIES ──────────────────────────────────────

/**
 * Get all calendar events visible to current user
 * Administrative Staff/Provincial Assessor/PMT: see all events
 * Division Chief/Staff: see events relevant to their role
 */
export async function getCalendarEvents(filters?: {
    rating_period_id?: string
    activity_type?: CalendarEventType
    status?: CalendarEventStatus
    month?: number
    year?: number
}) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        let query = supabase
            .from('spms_calendar_events')
            .select(`
                *,
                rating_period:rating_periods(name),
                created_by_profile:profiles!spms_calendar_events_created_by_fkey(full_name)
            `)
            .order('due_date', { ascending: true })

        // Role-based filtering: Division Chief and Staff see only their relevant events
        if (!['admin_staff', 'head_of_office'].includes(profile.role)) {
            query = query.contains('responsible_roles', [profile.role])
        }

        if (filters?.rating_period_id && filters.rating_period_id !== 'all') {
            query = query.eq('rating_period_id', filters.rating_period_id)
        }
        if (filters?.activity_type && filters.activity_type !== ('all' as any)) {
            query = query.eq('activity_type', filters.activity_type)
        }
        if (filters?.status && filters.status !== ('all' as any)) {
            query = query.eq('status', filters.status)
        }
        if (filters?.month !== undefined && filters?.year !== undefined) {
            const monthStr = String(filters.month).padStart(2, '0')
            const startDate = `${filters.year}-${monthStr}-01`
            const endDate = new Date(filters.year, filters.month, 0)
            const endDateStr = `${filters.year}-${monthStr}-${String(endDate.getDate()).padStart(2, '0')}`
            query = query.gte('due_date', startDate).lte('due_date', endDateStr)
        }

        const { data, error } = await query
        if (error) throw error

        return { data: data as SPMSCalendarEvent[] }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Get events for a specific month (for calendar view)
 */
export async function getEventsByMonth(month: number, year: number) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        const monthStr = String(month).padStart(2, '0')
        const startDate = `${year}-${monthStr}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`

        let query = supabase
            .from('spms_calendar_events')
            .select(`
                *,
                rating_period:rating_periods(name),
                created_by_profile:profiles!spms_calendar_events_created_by_fkey(full_name)
            `)
            .gte('due_date', startDate)
            .lte('due_date', endDate)
            .order('due_date', { ascending: true })

        if (!['admin_staff', 'head_of_office'].includes(profile.role)) {
            query = query.contains('responsible_roles', [profile.role])
        }

        const { data, error } = await query
        if (error) throw error

        return { data: data as SPMSCalendarEvent[] }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Get upcoming events within next N days
 * Used by dashboard widget
 */
export async function getUpcomingEvents(daysAhead: number = 30) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        const futureDate = new Date(today)
        futureDate.setDate(today.getDate() + daysAhead)
        const futureDateStr = futureDate.toISOString().split('T')[0]

        let query = supabase
            .from('spms_calendar_events')
            .select(`
                *,
                rating_period:rating_periods(name),
                created_by_profile:profiles!spms_calendar_events_created_by_fkey(full_name)
            `)
            .gte('due_date', todayStr)
            .lte('due_date', futureDateStr)
            .neq('status', 'completed')
            .order('due_date', { ascending: true })

        if (!['admin_staff', 'head_of_office'].includes(profile.role)) {
            query = query.contains('responsible_roles', [profile.role])
        }

        const { data, error } = await query
        if (error) throw error

        return { data: data as SPMSCalendarEvent[] }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Get overdue events
 * Events where due_date < today and status != 'completed'
 */
export async function getOverdueEvents() {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        let query = supabase
            .from('spms_calendar_events')
            .select(`
                *,
                rating_period:rating_periods(name),
                created_by_profile:profiles!spms_calendar_events_created_by_fkey(full_name)
            `)
            .lt('due_date', todayStr)
            .neq('status', 'completed')
            .order('due_date', { ascending: true })

        if (!['admin_staff', 'head_of_office'].includes(profile.role)) {
            query = query.contains('responsible_roles', [profile.role])
        }

        const { data, error } = await query
        if (error) throw error

        return { data: data as SPMSCalendarEvent[] }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Get single event by ID
 */
export async function getCalendarEventById(id: string) {
    try {
        const { supabase } = await getAuthenticatedUser()

        const { data, error } = await supabase
            .from('spms_calendar_events')
            .select(`
                *,
                rating_period:rating_periods(name),
                created_by_profile:profiles!spms_calendar_events_created_by_fkey(full_name)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return { data: data as SPMSCalendarEvent }
    } catch (err: any) {
        return { error: err.message }
    }
}

// ── MUTATIONS ────────────────────────────────────

/**
 * Create manual calendar event
 * Only Administrative Staff, Provincial Assessor, pmt_member
 */
export async function createCalendarEvent(data: SPMSCalendarEventInput) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        if (!['admin_staff', 'head_of_office'].includes(profile.role)) {
            throw new Error('Only Administrative Staff or Provincial Assessor can create calendar events')
        }

        const { data: event, error } = await supabase
            .from('spms_calendar_events')
            .insert({
                ...data,
                is_system_generated: false,
                status: 'upcoming',
                created_by: profile.id
            })
            .select()
            .single()

        if (error) throw error

        await logActivity('CREATE_CALENDAR_EVENT', 'spms_calendar_event', event.id, { title: data.title })
        revalidatePath('/dashboard/spms-calendar')
        return { data: event }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Update event (manual events only)
 * Cannot modify system-generated events
 */
export async function updateCalendarEvent(id: string, data: Partial<SPMSCalendarEventInput>) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        if (!['admin_staff', 'head_of_office'].includes(profile.role)) {
            throw new Error('Unauthorized')
        }

        // Check if system-generated
        const { data: existing } = await supabase
            .from('spms_calendar_events')
            .select('is_system_generated, title')
            .eq('id', id)
            .single()

        if (existing?.is_system_generated) {
            throw new Error('System-generated events cannot be modified')
        }

        const { error } = await supabase
            .from('spms_calendar_events')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) throw error

        await logActivity('UPDATE_CALENDAR_EVENT', 'spms_calendar_event', id, { title: data.title })
        revalidatePath('/dashboard/spms-calendar')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Mark event as completed
 * Administrative Staff/Provincial Assessor/PMT only
 */
export async function markEventCompleted(id: string) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        if (!['admin_staff', 'head_of_office'].includes(profile.role)) {
            throw new Error('Unauthorized')
        }

        const { error } = await supabase
            .from('spms_calendar_events')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', id)

        if (error) throw error

        await logActivity('COMPLETE_CALENDAR_EVENT', 'spms_calendar_event', id)
        revalidatePath('/dashboard/spms-calendar')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Delete event (manual events only, admin only)
 */
export async function deleteCalendarEvent(id: string) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        if (profile.role !== 'admin_staff') {
            throw new Error('Only Administrative Staff can delete calendar events')
        }

        // Check if system-generated
        const { data: existing } = await supabase
            .from('spms_calendar_events')
            .select('is_system_generated, title')
            .eq('id', id)
            .single()

        if (existing?.is_system_generated) {
            throw new Error('System-generated events cannot be deleted')
        }

        const { error } = await supabase
            .from('spms_calendar_events')
            .delete()
            .eq('id', id)

        if (error) throw error

        await logActivity('DELETE_CALENDAR_EVENT', 'spms_calendar_event', id, { title: existing?.title })
        revalidatePath('/dashboard/spms-calendar')
        return { success: true }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Auto-update overdue events
 * Called on page load — updates status to 'overdue'
 * for all events where due_date < today and status = 'upcoming'
 */
export async function syncEventStatuses() {
    try {
        const { supabase } = await getAuthenticatedUser()

        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        // Update upcoming events that are now past due to 'overdue'
        const { error } = await supabase
            .from('spms_calendar_events')
            .update({ status: 'overdue', updated_at: new Date().toISOString() })
            .lt('due_date', todayStr)
            .eq('status', 'upcoming')

        if (error) {
            console.error('syncEventStatuses error:', error.message)
        }

        return { success: true }
    } catch (err: any) {
        // Non-critical — don't throw
        console.error('syncEventStatuses failed:', err.message)
        return { success: false }
    }
}

/**
 * Get compliance summary
 * Returns counts of completed vs total events per activity_type
 */
export async function getComplianceSummary(rating_period_id: string): Promise<ComplianceSummary[]> {
    try {
        const { supabase } = await getAuthenticatedUser()

        const { data, error } = await supabase
            .from('spms_calendar_events')
            .select('activity_type, status')
            .eq('rating_period_id', rating_period_id)

        if (error) throw error

        const activityTypes: CalendarEventType[] = [
            'planning_commitment',
            'monitoring_coaching',
            'review_evaluation',
            'rewarding_development'
        ]

        return activityTypes.map(type => {
            const events = (data || []).filter((e: any) => e.activity_type === type)
            const total = events.length
            const completed = events.filter((e: any) => e.status === 'completed').length
            return {
                activity_type: type,
                total,
                completed,
                percentage: total > 0 ? Math.round((completed / total) * 100) : 0
            }
        })
    } catch (err: any) {
        return []
    }
}

/**
 * Seed standard SPMS calendar events for a rating period
 * One-time operation — checks for duplicates before inserting
 */
export async function seedCalendarEvents(rating_period_id: string) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        if (!['admin_staff', 'head_of_office'].includes(profile.role)) {
            throw new Error('Unauthorized')
        }

        const standardEvents = [
            // Stage 1: Performance Planning & Commitment
            {
                title: "OPCR Submission for PMT Review",
                activity_type: "planning_commitment" as CalendarEventType,
                due_date: "2026-01-05",
                submit_to: "PMT",
                responsible_roles: ["head_of_office", "division_chief"],
                description: "Submit Office Performance Commitment and Review Form to PMT for review"
            },
            {
                title: "IPCR Submission — January Period",
                activity_type: "planning_commitment" as CalendarEventType,
                due_date: "2026-01-10",
                submit_to: "Provincial Assessor",
                responsible_roles: ["project_staff", "division_chief"],
                description: "Individual Performance Commitment and Review targets submission"
            },
            // Stage 2: Performance Monitoring & Coaching
            {
                title: "Q1 Monitoring Journal Submission",
                activity_type: "monitoring_coaching" as CalendarEventType,
                due_date: "2026-04-05",
                submit_to: "Provincial Assessor",
                responsible_roles: ["division_chief"],
                description: "Submit Q1 Monitoring and Coaching Journal for noting"
            },
            {
                title: "Q2 Monitoring Journal Submission",
                activity_type: "monitoring_coaching" as CalendarEventType,
                due_date: "2026-07-05",
                submit_to: "Provincial Assessor",
                responsible_roles: ["division_chief"],
                description: "Submit Q2 Monitoring and Coaching Journal for noting"
            },
            // Stage 3: Performance Review & Evaluation
            {
                title: "OPCR Review — January Semester",
                activity_type: "review_evaluation" as CalendarEventType,
                due_date: "2026-07-15",
                submit_to: "Provincial Assessor",
                responsible_roles: ["head_of_office", "admin_staff"],
                description: "Review and validate OPCR against targets"
            },
            {
                title: "IPCR Final Submission — January Semester",
                activity_type: "review_evaluation" as CalendarEventType,
                due_date: "2026-07-25",
                submit_to: "Provincial Assessor",
                responsible_roles: ["project_staff", "division_chief"],
                description: "Final IPCR submission with ratings for January-June period"
            },
            // Stage 4: Rewarding & Development
            {
                title: "PMT Submits Top Performers List",
                activity_type: "rewarding_development" as CalendarEventType,
                due_date: "2026-08-15",
                submit_to: "Provincial Assessor",
                responsible_roles: ["admin_staff"],
                description: "PMT identifies and submits list of top performers for PRAISE Awards"
            },
            {
                title: "Office Performance Assessment Submission",
                activity_type: "rewarding_development" as CalendarEventType,
                due_date: "2026-08-15",
                submit_to: "Provincial Assessor",
                responsible_roles: ["head_of_office", "admin_staff"],
                description: "Submit final office performance assessment report"
            },
        ]

        let inserted = 0
        let skipped = 0

        for (const event of standardEvents) {
            // Check for duplicate (match on title + rating_period_id)
            const { data: existing } = await supabase
                .from('spms_calendar_events')
                .select('id')
                .eq('title', event.title)
                .eq('rating_period_id', rating_period_id)
                .maybeSingle()

            if (existing) {
                skipped++
                continue
            }

            const today = new Date()
            const dueDate = new Date(event.due_date)
            const status: CalendarEventStatus = dueDate < today ? 'overdue' : 'upcoming'

            const { error } = await supabase
                .from('spms_calendar_events')
                .insert({
                    ...event,
                    rating_period_id,
                    is_system_generated: true,
                    status
                })

            if (error) {
                console.error(`Failed to insert event "${event.title}":`, error.message)
            } else {
                inserted++
            }
        }

        revalidatePath('/dashboard/spms-calendar')
        return { success: true, inserted, skipped }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Get all rating periods (for filters)
 */
export async function getRatingPeriods() {
    try {
        const { supabase } = await getAuthenticatedUser()
        const { data, error } = await supabase
            .from('rating_periods')
            .select('id, name, status')
            .order('year', { ascending: false })
            .order('semester', { ascending: false })

        if (error) throw error
        return { data }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Get active rating period
 */
export async function getActiveRatingPeriod() {
    try {
        const { supabase } = await getAuthenticatedUser()
        const { data, error } = await supabase
            .from('rating_periods')
            .select('*')
            .eq('status', 'active')
            .single()

        if (error) throw error
        return { data }
    } catch (err: any) {
        return { error: err.message }
    }
}
