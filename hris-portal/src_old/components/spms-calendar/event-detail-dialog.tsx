'use client'

import { useState, useTransition } from "react"
import { format, formatDistanceToNow, isToday, isPast, differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { SPMSCalendarEvent } from "@/types/spms-calendar"
import { markEventCompleted, deleteCalendarEvent } from "@/app/actions/spms-calendar"
import { EventFormDialog } from "./event-form-dialog"
import { toast } from "sonner"
import {
    PencilLine, CheckCircle2, Trash2, ExternalLink,
    Calendar, User, Tag, Clock, AlertTriangle
} from "lucide-react"
import Link from "next/link"

const EVENT_TYPE_LABELS: Record<string, string> = {
    planning_commitment: 'Planning & Commitment',
    monitoring_coaching: 'Monitoring & Coaching',
    review_evaluation: 'Review & Evaluation',
    rewarding_development: 'Rewarding & Development',
    submission_deadline: 'Submission Deadline',
    other: 'Other',
}

const EVENT_TYPE_COLORS: Record<string, string> = {
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

function getUrgencyIndicator(dueDate: string, status: string) {
    if (status === 'completed') return null
    const date = new Date(dueDate + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isToday(date)) {
        return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Today</span>
    }
    if (isPast(date)) {
        return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Overdue</span>
    }
    const days = differenceInDays(date, today)
    if (days <= 7) {
        return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">In {days} day{days !== 1 ? 's' : ''}</span>
    }
    return <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">In {days} days</span>
}

function getRelatedModuleLink(title: string) {
    const lower = title.toLowerCase()
    if (lower.includes('ipcr')) return { href: '/dashboard/ipcr', label: 'Go to IPCR Module' }
    if (lower.includes('opcr')) return { href: '/dashboard/opcr', label: 'Go to OPCR Module' }
    if (lower.includes('monitoring')) return { href: '/dashboard/monitoring', label: 'Go to Monitoring Journal' }
    if (lower.includes('development plan') || lower.includes('annex k')) return { href: '/dashboard/development-plan', label: 'Go to Development Plan' }
    return null
}

interface EventDetailDialogProps {
    open: boolean
    event: SPMSCalendarEvent
    userRole: string
    ratingPeriods: any[]
    onClose: () => void
    onEventUpdated: (event: SPMSCalendarEvent) => void
    onEventDeleted: (id: string) => void
}

export function EventDetailDialog({
    open,
    event,
    userRole,
    ratingPeriods,
    onClose,
    onEventUpdated,
    onEventDeleted
}: EventDetailDialogProps) {
    const [showEdit, setShowEdit] = useState(false)
    const [isPending, startTransition] = useTransition()

    const canManage = ['admin_staff', 'head_of_office'].includes(userRole)
    const isManual = !event.is_system_generated
    const isCompleted = event.status === 'completed'
    const dueDate = new Date(event.due_date + 'T00:00:00')
    const relatedLink = getRelatedModuleLink(event.title)

    const handleMarkComplete = () => {
        startTransition(async () => {
            const result = await markEventCompleted(event.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Event marked as completed')
                onEventUpdated({ ...event, status: 'completed' })
            }
        })
    }

    const handleDelete = () => {
        if (!confirm('Delete this calendar event? This cannot be undone.')) return
        startTransition(async () => {
            const result = await deleteCalendarEvent(event.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Event deleted')
                onEventDeleted(event.id)
            }
        })
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
                                EVENT_TYPE_COLORS[event.activity_type] || EVENT_TYPE_COLORS.other
                            )}>
                                {EVENT_TYPE_LABELS[event.activity_type] || event.activity_type}
                            </span>
                            {!event.is_system_generated && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                                    Manual
                                </span>
                            )}
                        </div>
                        <DialogTitle className="text-xl font-semibold leading-tight">
                            {event.title}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Due Date
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium">{format(dueDate, 'MMMM dd, yyyy')}</span>
                                    {getUrgencyIndicator(event.due_date, event.status)}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
                                    <Tag className="h-3 w-3" /> Status
                                </p>
                                <StatusBadge status={event.status} />
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Submit To</p>
                                <span className="font-medium">{event.submit_to || '—'}</span>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Rating Period</p>
                                <span className="font-medium">{event.rating_period?.name || 'Not linked'}</span>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Source</p>
                                <span className="font-medium">
                                    {event.is_system_generated ? 'System Generated' : 'Manual Entry'}
                                </span>
                            </div>

                            {!event.is_system_generated && event.created_by_profile && (
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
                                        <User className="h-3 w-3" /> Created By
                                    </p>
                                    <div>
                                        <span className="font-medium">{event.created_by_profile.full_name}</span>
                                        <p className="text-[11px] text-muted-foreground">
                                            {format(new Date(event.created_at), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Responsible Roles */}
                        <div>
                            <p className="text-xs text-muted-foreground font-medium mb-2">Responsible Parties</p>
                            <div className="flex flex-wrap gap-1.5">
                                {event.responsible_roles.map(role => (
                                    <span key={role} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                                        {ROLE_LABELS[role] || role}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-1">Description</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                            </div>
                        )}

                        {/* Related Module Link */}
                        {relatedLink && (
                            <div className="pt-1">
                                <Link
                                    href={relatedLink.href}
                                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                                    onClick={onClose}
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    {relatedLink.label}
                                </Link>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-wrap gap-2">
                        <Button variant="outline" onClick={onClose}>Close</Button>

                        <div className="flex items-center gap-2 ml-auto">
                            {canManage && isManual && !isCompleted && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowEdit(true)}
                                    disabled={isPending}
                                >
                                    <PencilLine className="h-3.5 w-3.5 mr-1.5" />
                                    Edit Event
                                </Button>
                            )}

                            {canManage && !isCompleted && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkComplete}
                                    disabled={isPending}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                    Mark as Completed
                                </Button>
                            )}

                            {userRole === 'admin_staff' && isManual && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="text-red-500 border-red-200 hover:bg-red-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                    Delete Event
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {showEdit && (
                <EventFormDialog
                    open={showEdit}
                    event={event}
                    ratingPeriods={ratingPeriods}
                    onClose={() => setShowEdit(false)}
                    onSuccess={(updated) => {
                        onEventUpdated(updated)
                        setShowEdit(false)
                    }}
                />
            )}
        </>
    )
}
