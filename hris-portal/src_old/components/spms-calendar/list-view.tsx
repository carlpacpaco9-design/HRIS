'use client'

import { useState } from "react"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow, isPast, isToday } from "date-fns"
import { SPMSCalendarEvent } from "@/types/spms-calendar"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { EventDetailDialog } from "./event-detail-dialog"
import { EventFormDialog } from "./event-form-dialog"
import { markEventCompleted, deleteCalendarEvent } from "@/app/actions/spms-calendar"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"
import {
    Eye, PencilLine, CheckCircle2, Trash2, CalendarDays
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const EVENT_TYPE_LABELS: Record<string, string> = {
    planning_commitment: 'Planning & Commitment',
    monitoring_coaching: 'Monitoring & Coaching',
    review_evaluation: 'Review & Evaluation',
    rewarding_development: 'Rewarding & Development',
    submission_deadline: 'Submission Deadline',
    other: 'Other',
}

const EVENT_COLORS: Record<string, string> = {
    planning_commitment: 'bg-blue-100 text-blue-700 border-blue-200',
    monitoring_coaching: 'bg-amber-100 text-amber-700 border-amber-200',
    review_evaluation: 'bg-purple-100 text-purple-700 border-purple-200',
    rewarding_development: 'bg-green-100 text-green-700 border-green-200',
    submission_deadline: 'bg-red-100 text-red-700 border-red-200',
    other: 'bg-gray-100 text-gray-700 border-gray-200',
}

const ROLE_LABELS: Record<string, string> = {
    project_staff: 'Project Staff',
    division_chief: 'Division Chief',
    head_of_office: 'Provincial Assessor',
    admin_staff: 'Administrative Staff',
}

interface ListViewProps {
    events: SPMSCalendarEvent[]
    userRole: string
    ratingPeriods: any[]
    onEventsChange: (events: SPMSCalendarEvent[]) => void
}

export function ListView({ events, userRole, ratingPeriods, onEventsChange }: ListViewProps) {
    const [typeFilter, setTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [periodFilter, setPeriodFilter] = useState('all')
    const [systemOnly, setSystemOnly] = useState(false)
    const [manualOnly, setManualOnly] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<SPMSCalendarEvent | null>(null)
    const [showDetail, setShowDetail] = useState(false)
    const [editEvent, setEditEvent] = useState<SPMSCalendarEvent | null>(null)
    const [showEdit, setShowEdit] = useState(false)

    const canManage = ['admin_staff', 'head_of_office'].includes(userRole)

    // Apply filters
    const filtered = events.filter(e => {
        if (typeFilter !== 'all' && e.activity_type !== typeFilter) return false
        if (statusFilter !== 'all' && e.status !== statusFilter) return false
        if (periodFilter !== 'all' && e.rating_period_id !== periodFilter) return false
        if (systemOnly && !e.is_system_generated) return false
        if (manualOnly && e.is_system_generated) return false
        return true
    })

    const handleMarkComplete = async (id: string) => {
        const result = await markEventCompleted(id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Event marked as completed')
            onEventsChange(events.map(e => e.id === id ? { ...e, status: 'completed' } : e))
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this calendar event? This cannot be undone.')) return
        const result = await deleteCalendarEvent(id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Event deleted')
            onEventsChange(events.filter(e => e.id !== id))
        }
    }

    const handleEventUpdated = (updated: SPMSCalendarEvent) => {
        onEventsChange(events.map(e => e.id === updated.id ? updated : e))
    }

    const handleEventDeleted = (id: string) => {
        onEventsChange(events.filter(e => e.id !== id))
        setShowDetail(false)
    }

    const columns: ColumnDef<SPMSCalendarEvent>[] = [
        {
            accessorKey: 'activity_type',
            header: 'Type',
            cell: ({ row }) => (
                <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap",
                    EVENT_COLORS[row.original.activity_type] || EVENT_COLORS.other
                )}>
                    {EVENT_TYPE_LABELS[row.original.activity_type] || row.original.activity_type}
                </span>
            )
        },
        {
            accessorKey: 'title',
            header: 'Title',
            cell: ({ row }) => (
                <span className="font-medium text-sm">{row.original.title}</span>
            )
        },
        {
            accessorKey: 'due_date',
            header: 'Due Date',
            cell: ({ row }) => {
                const date = new Date(row.original.due_date + 'T00:00:00')
                const overdue = row.original.status === 'overdue'
                const relative = formatDistanceToNow(date, { addSuffix: true })
                return (
                    <div>
                        <div className={cn(
                            "text-sm font-medium",
                            overdue && "text-red-500"
                        )}>
                            {format(date, 'MMM dd, yyyy')}
                        </div>
                        <div className={cn(
                            "text-xs text-muted-foreground",
                            overdue && "text-red-400"
                        )}>
                            {relative}
                        </div>
                    </div>
                )
            }
        },
        {
            accessorKey: 'submit_to',
            header: 'Submit To',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.submit_to || '—'}
                </span>
            )
        },
        {
            accessorKey: 'responsible_roles',
            header: 'Responsible',
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.responsible_roles.map(role => (
                        <span key={role} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                            {ROLE_LABELS[role] || role}
                        </span>
                    ))}
                </div>
            )
        },
        {
            accessorKey: 'rating_period',
            header: 'Period',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {row.original.rating_period?.name || '—'}
                </span>
            )
        },
        {
            accessorKey: 'is_system_generated',
            header: 'Source',
            cell: ({ row }) => (
                row.original.is_system_generated ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                        System
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                        Manual
                    </span>
                )
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.status} />
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const event = row.original
                const isCompleted = event.status === 'completed'
                const isManual = !event.is_system_generated

                if (!canManage) {
                    return (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedEvent(event); setShowDetail(true) }}
                        >
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    )
                }

                return (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedEvent(event); setShowDetail(true) }}
                            title="View"
                        >
                            <Eye className="h-3.5 w-3.5" />
                        </Button>

                        {isManual && !isCompleted && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditEvent(event); setShowEdit(true) }}
                                title="Edit"
                            >
                                <PencilLine className="h-3.5 w-3.5" />
                            </Button>
                        )}

                        {!isCompleted && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkComplete(event.id)}
                                title="Mark Complete"
                                className="text-green-600 hover:text-green-700"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                        )}

                        {isManual && userRole === 'admin_staff' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(event.id)}
                                title="Delete"
                                className="text-red-500 hover:text-red-600"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                )
            }
        }
    ]

    const filterBar = (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between w-full">
            <div className="flex flex-wrap gap-2">
                {/* Activity Type */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-8 text-xs w-44">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="planning_commitment">Planning & Commitment</SelectItem>
                        <SelectItem value="monitoring_coaching">Monitoring & Coaching</SelectItem>
                        <SelectItem value="review_evaluation">Review & Evaluation</SelectItem>
                        <SelectItem value="rewarding_development">Rewarding & Development</SelectItem>
                        <SelectItem value="submission_deadline">Submission Deadline</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>

                {/* Status */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs w-36">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                </Select>

                {/* Rating Period */}
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="h-8 text-xs w-44">
                        <SelectValue placeholder="All Periods" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Periods</SelectItem>
                        {ratingPeriods.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Source toggles */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={systemOnly}
                        onChange={e => { setSystemOnly(e.target.checked); if (e.target.checked) setManualOnly(false) }}
                        className="rounded"
                    />
                    System only
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={manualOnly}
                        onChange={e => { setManualOnly(e.target.checked); if (e.target.checked) setSystemOnly(false) }}
                        className="rounded"
                    />
                    Manual only
                </label>
            </div>
        </div>
    )

    return (
        <div>
            <DataTable
                columns={columns}
                data={filtered}
                searchKey="title"
                searchPlaceholder="Search events..."
                emptyMessage="No calendar events found"
                emptyIcon={CalendarDays}
                filters={filterBar}
                pagination
                pageSize={15}
            />

            {showDetail && selectedEvent && (
                <EventDetailDialog
                    open={showDetail}
                    event={selectedEvent}
                    userRole={userRole}
                    ratingPeriods={ratingPeriods}
                    onClose={() => setShowDetail(false)}
                    onEventUpdated={handleEventUpdated}
                    onEventDeleted={handleEventDeleted}
                />
            )}

            {showEdit && editEvent && (
                <EventFormDialog
                    open={showEdit}
                    event={editEvent}
                    ratingPeriods={ratingPeriods}
                    onClose={() => setShowEdit(false)}
                    onSuccess={(updated) => {
                        handleEventUpdated(updated)
                        setShowEdit(false)
                    }}
                />
            )}
        </div>
    )
}
