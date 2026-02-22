'use client'

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { SPMSCalendarEvent, CalendarDay } from "@/types/spms-calendar"
import { EventDetailDialog } from "./event-detail-dialog"
import { EventFormDialog } from "./event-form-dialog"
import { getEventsByMonth } from "@/app/actions/spms-calendar"
import { toast } from "sonner"

const EVENT_COLORS: Record<string, string> = {
    planning_commitment: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    monitoring_coaching: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    review_evaluation: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    rewarding_development: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    submission_deadline: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

function buildCalendarDays(month: number, year: number, events: SPMSCalendarEvent[]): CalendarDay[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startDow = firstDay.getDay() // 0=Sun
    const totalDays = lastDay.getDate()

    const days: CalendarDay[] = []

    // Previous month padding
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
    for (let i = startDow - 1; i >= 0; i--) {
        const d = new Date(year, month - 2, prevMonthLastDay - i)
        days.push({ date: d, isCurrentMonth: false, isToday: false, events: [] })
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
        const date = new Date(year, month - 1, d)
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const dayEvents = events.filter(e => e.due_date === dateStr)
        days.push({
            date,
            isCurrentMonth: true,
            isToday: date.getTime() === today.getTime(),
            events: dayEvents
        })
    }

    // Next month padding to complete grid (always 6 rows = 42 cells)
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
        const date = new Date(year, month, d)
        days.push({ date, isCurrentMonth: false, isToday: false, events: [] })
    }

    return days
}

interface CalendarViewProps {
    events: SPMSCalendarEvent[]
    initialMonth: number
    initialYear: number
    userRole: string
    ratingPeriods: any[]
    onEventsChange: (events: SPMSCalendarEvent[]) => void
}

export function CalendarView({
    events,
    initialMonth,
    initialYear,
    userRole,
    ratingPeriods,
    onEventsChange
}: CalendarViewProps) {
    const [month, setMonth] = useState(initialMonth)
    const [year, setYear] = useState(initialYear)
    const [localEvents, setLocalEvents] = useState<SPMSCalendarEvent[]>(events)
    const [selectedEvent, setSelectedEvent] = useState<SPMSCalendarEvent | null>(null)
    const [showDetailDialog, setShowDetailDialog] = useState(false)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [addDialogDate, setAddDialogDate] = useState<string | undefined>()
    const [overflowDay, setOverflowDay] = useState<CalendarDay | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const canManage = ['admin_staff', 'head_of_office'].includes(userRole)

    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()

    const calendarDays = buildCalendarDays(month, year, localEvents)

    const navigateMonth = useCallback(async (direction: 'prev' | 'next') => {
        let newMonth = direction === 'next' ? month + 1 : month - 1
        let newYear = year

        if (newMonth > 12) { newMonth = 1; newYear++ }
        if (newMonth < 1) { newMonth = 12; newYear-- }

        setIsLoading(true)
        setMonth(newMonth)
        setYear(newYear)

        const result = await getEventsByMonth(newMonth, newYear)
        if (result.data) {
            // Merge with existing events (avoid duplicates)
            setLocalEvents(prev => {
                const existingIds = new Set(result.data!.map(e => e.id))
                const filtered = prev.filter(e => !existingIds.has(e.id))
                return [...filtered, ...result.data!]
            })
        }
        setIsLoading(false)
    }, [month, year])

    const goToToday = async () => {
        setMonth(currentMonth)
        setYear(currentYear)
        setIsLoading(true)
        const result = await getEventsByMonth(currentMonth, currentYear)
        if (result.data) {
            setLocalEvents(prev => {
                const existingIds = new Set(result.data!.map(e => e.id))
                const filtered = prev.filter(e => !existingIds.has(e.id))
                return [...filtered, ...result.data!]
            })
        }
        setIsLoading(false)
    }

    const handleEventClick = (e: React.MouseEvent, event: SPMSCalendarEvent) => {
        e.stopPropagation()
        setSelectedEvent(event)
        setShowDetailDialog(true)
    }

    const handleDayCellClick = (day: CalendarDay) => {
        if (!canManage || !day.isCurrentMonth) return
        const dateStr = day.date.toISOString().split('T')[0]
        setAddDialogDate(dateStr)
        setShowAddDialog(true)
    }

    const handleEventUpdated = (updatedEvent: SPMSCalendarEvent) => {
        setLocalEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e))
        onEventsChange(localEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e))
    }

    const handleEventDeleted = (id: string) => {
        setLocalEvents(prev => prev.filter(e => e.id !== id))
        onEventsChange(localEvents.filter(e => e.id !== id))
        setShowDetailDialog(false)
    }

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')} disabled={isLoading}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">
                        {MONTH_NAMES[month - 1]} {year}
                    </h2>
                    {(month !== currentMonth || year !== currentYear) && (
                        <Button variant="outline" size="sm" onClick={goToToday} disabled={isLoading}>
                            Today
                        </Button>
                    )}
                </div>

                <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')} disabled={isLoading}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 px-4 py-2 border-b border-border bg-muted/10 text-[11px]">
                {Object.entries({
                    planning_commitment: 'Planning',
                    monitoring_coaching: 'Monitoring',
                    review_evaluation: 'Review',
                    rewarding_development: 'Rewarding',
                    submission_deadline: 'Deadline',
                    other: 'Other'
                }).map(([type, label]) => (
                    <span key={type} className={cn("px-2 py-0.5 rounded font-medium", EVENT_COLORS[type])}>
                        {label}
                    </span>
                ))}
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-border">
                {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className={cn("grid grid-cols-7", isLoading && "opacity-60 pointer-events-none")}>
                {calendarDays.map((day, idx) => {
                    const visibleEvents = day.events.slice(0, 3)
                    const hiddenCount = day.events.length - 3

                    return (
                        <div
                            key={idx}
                            onClick={() => handleDayCellClick(day)}
                            className={cn(
                                "min-h-[120px] border-b border-r border-border p-1.5 transition-colors",
                                "md:min-h-[120px] min-h-[80px]",
                                day.isCurrentMonth ? "bg-card" : "bg-muted/30",
                                !day.isCurrentMonth && "text-muted-foreground",
                                day.isToday && "ring-2 ring-inset ring-primary bg-primary/5",
                                canManage && day.isCurrentMonth && "cursor-pointer hover:bg-muted/20"
                            )}
                        >
                            {/* Day Number */}
                            <div className="mb-1">
                                {day.isToday ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                        {day.date.getDate()}
                                    </span>
                                ) : (
                                    <span className={cn(
                                        "text-sm font-medium",
                                        !day.isCurrentMonth && "text-muted-foreground/60"
                                    )}>
                                        {day.date.getDate()}
                                    </span>
                                )}
                            </div>

                            {/* Events */}
                            <div className="space-y-0.5">
                                {visibleEvents.map(event => (
                                    <button
                                        key={event.id}
                                        onClick={(e) => handleEventClick(e, event)}
                                        className={cn(
                                            "w-full text-left text-[11px] font-medium truncate rounded px-1.5 py-0.5 block",
                                            "hover:opacity-80 transition-opacity",
                                            EVENT_COLORS[event.activity_type] || EVENT_COLORS.other
                                        )}
                                        title={event.title}
                                    >
                                        {event.title}
                                    </button>
                                ))}

                                {hiddenCount > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setOverflowDay(day)
                                        }}
                                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors pl-1"
                                    >
                                        +{hiddenCount} more
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Overflow Day Popover (simple modal) */}
            {overflowDay && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center"
                    onClick={() => setOverflowDay(null)}
                >
                    <div
                        className="bg-card border border-border rounded-xl shadow-xl p-4 w-72 max-h-80 overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm">
                                {overflowDay.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            </h3>
                            <button
                                onClick={() => setOverflowDay(null)}
                                className="text-muted-foreground hover:text-foreground text-xs"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-1.5">
                            {overflowDay.events.map(event => (
                                <button
                                    key={event.id}
                                    onClick={() => {
                                        setSelectedEvent(event)
                                        setShowDetailDialog(true)
                                        setOverflowDay(null)
                                    }}
                                    className={cn(
                                        "w-full text-left text-xs font-medium rounded px-2 py-1.5 block",
                                        "hover:opacity-80 transition-opacity",
                                        EVENT_COLORS[event.activity_type] || EVENT_COLORS.other
                                    )}
                                >
                                    {event.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Event Detail Dialog */}
            {showDetailDialog && selectedEvent && (
                <EventDetailDialog
                    open={showDetailDialog}
                    event={selectedEvent}
                    userRole={userRole}
                    ratingPeriods={ratingPeriods}
                    onClose={() => setShowDetailDialog(false)}
                    onEventUpdated={handleEventUpdated}
                    onEventDeleted={handleEventDeleted}
                />
            )}

            {/* Add Event Dialog */}
            {showAddDialog && (
                <EventFormDialog
                    open={showAddDialog}
                    onClose={() => setShowAddDialog(false)}
                    ratingPeriods={ratingPeriods}
                    defaultDate={addDialogDate}
                    onSuccess={(newEvent) => {
                        setLocalEvents(prev => [...prev, newEvent])
                        onEventsChange([...localEvents, newEvent])
                        setShowAddDialog(false)
                    }}
                />
            )}
        </div>
    )
}
