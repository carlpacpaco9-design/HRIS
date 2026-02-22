'use client'

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SubmitButton } from "@/components/ui/submit-button"
import { FormSection } from "@/components/ui/form-section"
import { SPMSCalendarEvent, SPMSCalendarEventInput } from "@/types/spms-calendar"
import { createCalendarEvent, updateCalendarEvent } from "@/app/actions/spms-calendar"
import { toast } from "sonner"

const eventSchema = z.object({
    title: z.string()
        .min(5, "Title must be at least 5 characters")
        .max(200, "Title must not exceed 200 characters"),
    description: z.string().max(500, "Description must not exceed 500 characters").optional(),
    activity_type: z.enum([
        'planning_commitment',
        'monitoring_coaching',
        'review_evaluation',
        'rewarding_development',
        'submission_deadline',
        'other'
    ]),
    due_date: z.string().min(1, "Due date is required"),
    submit_to: z.string().max(100, "Submit to must not exceed 100 characters").optional(),
    responsible_roles: z.array(z.string()).min(1, "Select at least one responsible role"),
    rating_period_id: z.string().optional(),
})

type EventFormValues = z.infer<typeof eventSchema>

const ALL_ROLES = [
    { value: 'project_staff', label: 'Project Staff' },
    { value: 'division_chief', label: 'Division Chief' },
    { value: 'head_of_office', label: 'Provincial Assessor' },
    { value: 'admin_staff', label: 'Administrative Staff' },
]

const ACTIVITY_TYPE_OPTIONS = [
    { value: 'planning_commitment', label: 'Planning & Commitment' },
    { value: 'monitoring_coaching', label: 'Monitoring & Coaching' },
    { value: 'review_evaluation', label: 'Performance Review & Evaluation' },
    { value: 'rewarding_development', label: 'Rewarding & Development Planning' },
    { value: 'submission_deadline', label: 'Submission Deadline' },
    { value: 'other', label: 'Other' },
]

interface EventFormDialogProps {
    open: boolean
    onClose: () => void
    ratingPeriods: any[]
    event?: SPMSCalendarEvent
    defaultDate?: string
    onSuccess: (event: SPMSCalendarEvent) => void
}

export function EventFormDialog({
    open,
    onClose,
    ratingPeriods,
    event,
    defaultDate,
    onSuccess
}: EventFormDialogProps) {
    const isEdit = !!event
    const [isPending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<EventFormValues>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: event?.title || '',
            description: event?.description || '',
            activity_type: event?.activity_type || 'planning_commitment',
            due_date: event?.due_date || defaultDate || '',
            submit_to: event?.submit_to || '',
            responsible_roles: event?.responsible_roles || [],
            rating_period_id: event?.rating_period_id || '',
        }
    })

    const selectedRoles = watch('responsible_roles') || []
    const description = watch('description') || ''

    const toggleRole = (role: string) => {
        const current = selectedRoles
        if (current.includes(role)) {
            setValue('responsible_roles', current.filter(r => r !== role))
        } else {
            setValue('responsible_roles', [...current, role])
        }
    }

    const selectAll = () => setValue('responsible_roles', ALL_ROLES.map(r => r.value))
    const deselectAll = () => setValue('responsible_roles', [])

    const onSubmit = (values: EventFormValues) => {
        startTransition(async () => {
            const payload: SPMSCalendarEventInput = {
                title: values.title,
                description: values.description,
                activity_type: values.activity_type,
                due_date: values.due_date,
                submit_to: values.submit_to,
                responsible_roles: values.responsible_roles,
                rating_period_id: values.rating_period_id || undefined,
            }

            if (isEdit && event) {
                const result = await updateCalendarEvent(event.id, payload)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Event updated successfully')
                    onSuccess({ ...event, ...payload })
                }
            } else {
                const result = await createCalendarEvent(payload)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Event added to calendar')
                    onSuccess(result.data as SPMSCalendarEvent)
                }
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Calendar Event' : 'Add Calendar Event'}</DialogTitle>
                    <DialogDescription>Schedule an SPMS activity or deadline</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Event Details */}
                    <FormSection title="Event Details">
                        <div className="space-y-3">
                            {/* Title */}
                            <div>
                                <Label htmlFor="title" className="text-xs font-medium">
                                    Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    {...register('title')}
                                    placeholder="e.g., IPCR Submission Deadline"
                                    className="mt-1"
                                />
                                {errors.title && (
                                    <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
                                )}
                            </div>

                            {/* Activity Type */}
                            <div>
                                <Label className="text-xs font-medium">
                                    Activity Type <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    defaultValue={event?.activity_type || 'planning_commitment'}
                                    onValueChange={val => setValue('activity_type', val as any)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ACTIVITY_TYPE_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.activity_type && (
                                    <p className="text-xs text-red-500 mt-1">{errors.activity_type.message}</p>
                                )}
                            </div>

                            {/* Due Date */}
                            <div>
                                <Label htmlFor="due_date" className="text-xs font-medium">
                                    Due Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    {...register('due_date')}
                                    className="mt-1"
                                />
                                {errors.due_date && (
                                    <p className="text-xs text-red-500 mt-1">{errors.due_date.message}</p>
                                )}
                            </div>

                            {/* Rating Period */}
                            <div>
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Link to Rating Period (optional)
                                </Label>
                                <Select
                                    defaultValue={event?.rating_period_id || ''}
                                    onValueChange={val => setValue('rating_period_id', val === 'none' ? '' : val)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Not linked" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Not linked</SelectItem>
                                        {ratingPeriods.map((p: any) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </FormSection>

                    {/* Assignment */}
                    <FormSection title="Assignment">
                        <div className="space-y-3">
                            {/* Submit To */}
                            <div>
                                <Label htmlFor="submit_to" className="text-xs font-medium">
                                    Submit To
                                </Label>
                                <Input
                                    id="submit_to"
                                    {...register('submit_to')}
                                    placeholder="e.g., Provincial Assessor, Division Chief"
                                    className="mt-1"
                                />
                                <p className="text-[11px] text-muted-foreground mt-1">Who this should be submitted to</p>
                            </div>

                            {/* Responsible Roles */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-xs font-medium">
                                        Responsible Roles <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex gap-2 text-[11px]">
                                        <button type="button" onClick={selectAll} className="text-primary hover:underline">
                                            Select All
                                        </button>
                                        <span className="text-muted-foreground">·</span>
                                        <button type="button" onClick={deselectAll} className="text-muted-foreground hover:underline">
                                            Deselect All
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {ALL_ROLES.map(role => (
                                        <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedRoles.includes(role.value)}
                                                onChange={() => toggleRole(role.value)}
                                                className="rounded"
                                            />
                                            <span className="text-sm">{role.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.responsible_roles && (
                                    <p className="text-xs text-red-500 mt-1">{errors.responsible_roles.message}</p>
                                )}
                            </div>
                        </div>
                    </FormSection>

                    {/* Additional Info */}
                    <FormSection title="Additional Info">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Label htmlFor="description" className="text-xs font-medium">
                                    Description (optional)
                                </Label>
                                <span className="text-[11px] text-muted-foreground">{description.length}/500</span>
                            </div>
                            <Textarea
                                id="description"
                                {...register('description')}
                                placeholder="Describe this SPMS activity or deadline..."
                                rows={3}
                                maxLength={500}
                            />
                            {errors.description && (
                                <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
                            )}
                        </div>
                    </FormSection>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                            Cancel
                        </Button>
                        <SubmitButton
                            isLoading={isPending}
                            label={isEdit ? 'Save Changes' : 'Add to Calendar'}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
