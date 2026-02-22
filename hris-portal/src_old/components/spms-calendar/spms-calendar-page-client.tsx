'use client'

import { useState, useTransition } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CalendarDays, List, Plus, RefreshCw } from "lucide-react"
import { SPMSCalendarEvent, ComplianceSummary } from "@/types/spms-calendar"
import { CalendarView } from "./calendar-view"
import { ListView } from "./list-view"
import { EventFormDialog } from "./event-form-dialog"
import { DeadlineAlertBanner } from "./deadline-alert-banner"
import { toast } from "sonner"
import { seedCalendarEvents } from "@/app/actions/spms-calendar"

type ViewMode = 'calendar' | 'list'

const STAGE_DEFS = [
    {
        label: "Performance Planning",
        color: "bg-blue-500",
        description: "OPCR & IPCR targets set",
        activity_type: "planning_commitment" as const
    },
    {
        label: "Monitoring & Coaching",
        color: "bg-amber-500",
        description: "Quarterly journals submitted",
        activity_type: "monitoring_coaching" as const
    },
    {
        label: "Review & Evaluation",
        color: "bg-purple-500",
        description: "IPCR & OPCR ratings finalized",
        activity_type: "review_evaluation" as const
    },
    {
        label: "Rewarding & Development",
        color: "bg-green-500",
        description: "Plans & awards processed",
        activity_type: "rewarding_development" as const
    }
]

interface SPMSCalendarPageClientProps {
    profile: any
    initialEvents: SPMSCalendarEvent[]
    initialMonthEvents: SPMSCalendarEvent[]
    activePeriod: any
    ratingPeriods: any[]
    complianceSummary: ComplianceSummary[]
    currentMonth: number
    currentYear: number
}

export function SPMSCalendarPageClient({
    profile,
    initialEvents,
    initialMonthEvents,
    activePeriod,
    ratingPeriods,
    complianceSummary,
    currentMonth,
    currentYear
}: SPMSCalendarPageClientProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('calendar')
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [events, setEvents] = useState<SPMSCalendarEvent[]>(initialEvents)
    const [isPending, startTransition] = useTransition()

    const userRole = profile?.role || 'project_staff'
    const canManage = ['admin_staff', 'head_of_office'].includes(userRole)

    // Compute compliance totals
    const totalCompleted = complianceSummary.reduce((sum, s) => sum + s.completed, 0)
    const totalEvents = complianceSummary.reduce((sum, s) => sum + s.total, 0)

    const handleSeed = () => {
        if (!activePeriod) return
        startTransition(async () => {
            const result = await seedCalendarEvents(activePeriod.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Seeded ${result.inserted} events (${result.skipped} already existed)`)
                window.location.reload()
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">SPMS Calendar</h1>
                    <p className="text-muted-foreground mt-1">
                        Strategic Performance Management System — Activity Calendar &amp; Deadlines Tracker
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Admin seed button */}
                    {userRole === 'admin_staff' && activePeriod && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSeed}
                            disabled={isPending}
                            className="text-xs"
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isPending && "animate-spin")} />
                            Seed Events
                        </Button>
                    )}

                    {/* Add Event — privileged roles only */}
                    {canManage && (
                        <Button
                            onClick={() => setShowAddDialog(true)}
                            size="sm"
                            className="gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            Add Event
                        </Button>
                    )}

                    {/* View Toggle */}
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                "p-2 transition-colors",
                                viewMode === 'calendar'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card text-muted-foreground hover:bg-muted"
                            )}
                            title="Calendar View"
                        >
                            <CalendarDays className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2 transition-colors",
                                viewMode === 'list'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-card text-muted-foreground hover:bg-muted"
                            )}
                            title="List View"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Compliance Summary Bar ── */}
            {activePeriod && (
                <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">
                            SPMS Cycle Compliance — {activePeriod.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                            {totalCompleted}/{totalEvents} activities completed
                        </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {STAGE_DEFS.map(stage => {
                            const summary = complianceSummary.find(s => s.activity_type === stage.activity_type)
                            const completed = summary?.completed ?? 0
                            const total = summary?.total ?? 0
                            const percentage = summary?.percentage ?? 0

                            return (
                                <div key={stage.activity_type} className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium">{stage.label}</span>
                                        <span className="text-muted-foreground">{completed}/{total}</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-500", stage.color)}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{stage.description}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Deadline Alert Banner ── */}
            <DeadlineAlertBanner
                compact={false}
                daysThreshold={7}
                roles={[userRole]}
                events={events}
            />

            {/* ── Main Content ── */}
            {viewMode === 'calendar' ? (
                <CalendarView
                    events={events}
                    initialMonth={currentMonth}
                    initialYear={currentYear}
                    userRole={userRole}
                    ratingPeriods={ratingPeriods}
                    onEventsChange={setEvents}
                />
            ) : (
                <ListView
                    events={events}
                    userRole={userRole}
                    ratingPeriods={ratingPeriods}
                    onEventsChange={setEvents}
                />
            )}

            {/* ── Add Event Dialog ── */}
            {showAddDialog && (
                <EventFormDialog
                    open={showAddDialog}
                    onClose={() => setShowAddDialog(false)}
                    ratingPeriods={ratingPeriods}
                    onSuccess={(newEvent) => {
                        setEvents(prev => [newEvent, ...prev])
                        setShowAddDialog(false)
                    }}
                />
            )}
        </div>
    )
}
