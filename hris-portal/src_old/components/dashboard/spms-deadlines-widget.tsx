'use client'

import { Card } from "@/components/ui/card"
import { CalendarCheck, CalendarDays, AlertTriangle } from "lucide-react"
import { SPMSCalendarEvent } from "@/types/spms-calendar"
import { format } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SPMSDeadlinesWidgetProps {
    upcomingEvents?: SPMSCalendarEvent[]
    overdueEvents?: SPMSCalendarEvent[]
}

export function SPMSDeadlinesWidget({
    upcomingEvents = [],
    overdueEvents = []
}: SPMSDeadlinesWidgetProps) {
    const allItems = [
        ...overdueEvents.map(e => ({ ...e, urgency: 'overdue' as const })),
        ...upcomingEvents.map(e => ({ ...e, urgency: 'upcoming' as const }))
    ].slice(0, 5)

    return (
        <Card className="border border-border/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/40 flex justify-between items-center bg-muted/20">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">SPMS Deadlines</h3>
                    {overdueEvents.length > 0 && (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                            {overdueEvents.length}
                        </span>
                    )}
                </div>
                <Link
                    href="/dashboard/spms-calendar"
                    className="text-xs font-medium text-primary hover:underline"
                >
                    View Calendar
                </Link>
            </div>

            <div className="p-0">
                {allItems.length > 0 ? (
                    <div className="divide-y divide-border/40">
                        {allItems.map((item) => {
                            const isOverdue = item.urgency === 'overdue'
                            const borderClass = isOverdue ? 'border-l-red-500' : 'border-l-blue-400'
                            const dueDate = new Date(item.due_date + 'T00:00:00')

                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "p-3 pl-3 border-l-[3px] hover:bg-muted/30 transition-colors flex flex-col gap-1",
                                        borderClass
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-sm font-medium text-foreground leading-tight">
                                            {item.title}
                                        </span>
                                        {isOverdue && (
                                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                                        <span className={cn(isOverdue && "text-red-500 font-medium")}>
                                            {isOverdue ? 'Overdue: ' : 'Due: '}
                                            {format(dueDate, 'MMM dd, yyyy')}
                                        </span>
                                        {item.submit_to && (
                                            <span className="text-[10px]">To: {item.submit_to}</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
                        <CalendarCheck className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">No upcoming deadlines</p>
                        <p className="text-xs mt-1">All SPMS activities are on track</p>
                    </div>
                )}
            </div>
        </Card>
    )
}
