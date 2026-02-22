'use client'

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow, isPast, isToday, differenceInDays } from "date-fns"
import { SPMSCalendarEvent } from "@/types/spms-calendar"
import { AlertTriangle, Clock, CheckCircle2, CalendarDays } from "lucide-react"
import Link from "next/link"

interface DeadlineAlertBannerProps {
    daysThreshold?: number
    roles?: string[]
    compact?: boolean
    events: SPMSCalendarEvent[]
}

export function DeadlineAlertBanner({
    daysThreshold = 7,
    roles,
    compact = false,
    events
}: DeadlineAlertBannerProps) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { overdueEvents, upcomingEvents } = useMemo(() => {
        const todayStr = today.toISOString().split('T')[0]

        let filtered = events.filter(e => e.status !== 'completed')

        // Filter by roles if specified
        if (roles && roles.length > 0) {
            filtered = filtered.filter(e =>
                e.responsible_roles.some(r => roles.includes(r))
            )
        }

        const overdue = filtered.filter(e => e.status === 'overdue' || (e.due_date < todayStr && e.status !== 'completed'))

        const futureDate = new Date(today)
        futureDate.setDate(today.getDate() + daysThreshold)
        const futureDateStr = futureDate.toISOString().split('T')[0]

        const upcoming = filtered.filter(e =>
            e.due_date >= todayStr &&
            e.due_date <= futureDateStr &&
            e.status !== 'overdue'
        )

        return { overdueEvents: overdue, upcomingEvents: upcoming }
    }, [events, roles, daysThreshold])

    if (compact) {
        return <CompactBanner overdueEvents={overdueEvents} upcomingEvents={upcomingEvents} daysThreshold={daysThreshold} />
    }

    return <FullBanner overdueEvents={overdueEvents} upcomingEvents={upcomingEvents} daysThreshold={daysThreshold} />
}

function FullBanner({
    overdueEvents,
    upcomingEvents,
    daysThreshold
}: {
    overdueEvents: SPMSCalendarEvent[]
    upcomingEvents: SPMSCalendarEvent[]
    daysThreshold: number
}) {
    if (overdueEvents.length === 0 && upcomingEvents.length === 0) {
        return (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                            All SPMS deadlines are on track
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-400">
                            No overdue or urgent deadlines within the next {daysThreshold} days.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Overdue */}
            {overdueEvents.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                                {overdueEvents.length} overdue SPMS deadline{overdueEvents.length !== 1 ? 's' : ''}
                            </p>
                            <ul className="space-y-1">
                                {overdueEvents.map(e => (
                                    <li key={e.id} className="text-sm text-red-700 dark:text-red-400">
                                        · {e.title} — was due {formatDistanceToNow(new Date(e.due_date + 'T00:00:00'), { addSuffix: true })}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Upcoming */}
            {upcomingEvents.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                                {upcomingEvents.length} deadline{upcomingEvents.length !== 1 ? 's' : ''} approaching within {daysThreshold} days
                            </p>
                            <ul className="space-y-1">
                                {upcomingEvents.map(e => {
                                    const date = new Date(e.due_date + 'T00:00:00')
                                    return (
                                        <li key={e.id} className="text-sm text-amber-700 dark:text-amber-400">
                                            · {e.title} — due {format(date, 'MMM dd, yyyy')} ({formatDistanceToNow(date, { addSuffix: true })})
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function CompactBanner({
    overdueEvents,
    upcomingEvents,
    daysThreshold
}: {
    overdueEvents: SPMSCalendarEvent[]
    upcomingEvents: SPMSCalendarEvent[]
    daysThreshold: number
}) {
    const allUrgent = [...overdueEvents, ...upcomingEvents].slice(0, 3)

    if (allUrgent.length === 0) {
        return (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">All deadlines on track</p>
            </div>
        )
    }

    return (
        <div className="space-y-1.5">
            {allUrgent.map(e => {
                const isOverdue = overdueEvents.some(o => o.id === e.id)
                const date = new Date(e.due_date + 'T00:00:00')
                return (
                    <div
                        key={e.id}
                        className={cn(
                            "flex items-start gap-2 p-2 rounded border-l-[3px]",
                            isOverdue
                                ? "border-l-red-500 bg-red-50/50 dark:bg-red-950/10"
                                : "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10"
                        )}
                    >
                        <div className="flex-1 min-w-0">
                            <p className={cn(
                                "text-xs font-medium truncate",
                                isOverdue ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"
                            )}>
                                {e.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                {isOverdue ? 'Overdue — ' : 'Due: '}
                                {format(date, 'MMM dd, yyyy')}
                            </p>
                        </div>
                    </div>
                )
            })}

            <Link
                href="/dashboard/spms-calendar"
                className="block text-xs text-primary hover:underline font-medium pt-1"
            >
                View all deadlines →
            </Link>
        </div>
    )
}
