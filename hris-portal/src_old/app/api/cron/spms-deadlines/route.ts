import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { buildNotificationContent, notifyMultipleUsers } from '@/lib/notifications'

/**
 * GET /api/cron/spms-deadlines
 *
 * Called by Vercel Cron daily at 08:00 PH time (00:00 UTC).
 * Finds SPMS calendar events due within 7 days and notifies responsible users.
 * Protected by CRON_SECRET environment variable.
 */
export async function GET(request: NextRequest) {
    // ── Auth guard ──────────────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization')
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // ── Compute date window ─────────────────────────────────────────────────
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const deadline = new Date(today)
    deadline.setDate(deadline.getDate() + 7)

    const toISODate = (d: Date) => d.toISOString().split('T')[0]

    // ── Fetch upcoming events in window ─────────────────────────────────────
    const { data: events, error: eventsError } = await supabase
        .from('spms_calendar_events')
        .select('*')
        .eq('status', 'upcoming')
        .gte('due_date', toISODate(today))
        .lte('due_date', toISODate(deadline))

    if (eventsError) {
        console.error('[cron/spms-deadlines] Events query error:', eventsError.message)
        return NextResponse.json({ error: eventsError.message }, { status: 500 })
    }

    if (!events || events.length === 0) {
        return NextResponse.json({ notified: 0, message: 'No upcoming deadlines in 7-day window' })
    }

    let totalNotified = 0

    for (const event of events) {
        // Determine responsible roles — fall back to all roles if not specified
        const responsibleRoles: string[] =
            event.responsible_roles && event.responsible_roles.length > 0
                ? event.responsible_roles
                : ['head_of_office', 'division_chief', 'admin_staff', 'project_staff']

        const { data: users } = await supabase
            .from('profiles')
            .select('id, email, full_name, role')
            .in('role', responsibleRoles)

        if (!users || users.length === 0) continue

        const daysLeft = Math.max(
            1,
            Math.ceil(
                (new Date(event.due_date).setHours(23, 59, 59, 0) - Date.now()) / 86_400_000
            )
        )

        const { title, message } = buildNotificationContent('spms.deadline', {
            eventTitle: event.title,
            dueDate: new Date(event.due_date).toLocaleDateString('en-PH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            daysLeft: String(daysLeft),
            submitTo: event.submit_to ?? '',
        })

        await notifyMultipleUsers(
            users.map((u: any) => ({ id: u.id, email: u.email ?? '', full_name: u.full_name ?? '' })),
            {
                type: 'spms.deadline',
                title,
                message,
                entity_type: 'spms_calendar',
                entity_id: event.id,
                action_url: '/dashboard/spms-calendar',
            }
        )

        totalNotified += users.length
    }

    return NextResponse.json({ notified: totalNotified, events: events.length })
}
