"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { leaveSchema, LeaveFormValues } from "@/lib/validations"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FormFieldWrapper } from "@/components/ui/form-field-wrapper"
import { FormSection } from "@/components/ui/form-section"
import { SubmitButton } from "@/components/ui/submit-button"
import { Button } from "@/components/ui/button"
import { CalendarOff, Info } from "lucide-react"
import { useEffect, useMemo } from "react"
import { differenceInDays, parseISO } from "date-fns"

interface LeaveFormProps {
    onSubmit: (data: LeaveFormValues) => Promise<void>
    onCancel: () => void
    isSaving: boolean
}

export function LeaveForm({
    onSubmit,
    onCancel,
    isSaving
}: LeaveFormProps) {
    const form = useForm<LeaveFormValues>({
        resolver: zodResolver(leaveSchema),
        defaultValues: {
            leave_type: "vacation" as any, // Cast to any to handle undefined initial state if needed
            date_from: new Date().toISOString().split('T')[0],
            date_to: new Date().toISOString().split('T')[0],
            reason: "",
            is_half_day: false,
        },
    })

    const isHalfDay = form.watch("is_half_day")
    const dateFrom = form.watch("date_from")
    const dateTo = form.watch("date_to")
    const reason = form.watch("reason") || ""

    // Sync date_to if half day is toggled
    useEffect(() => {
        if (isHalfDay) {
            form.setValue("date_to", dateFrom)
        }
    }, [isHalfDay, dateFrom, form])

    const numberOfDays = useMemo(() => {
        if (isHalfDay) return 0.5
        if (!dateFrom || !dateTo) return 0

        try {
            const start = parseISO(dateFrom)
            const end = parseISO(dateTo)
            const diff = differenceInDays(end, start) + 1
            return diff > 0 ? diff : 0
        } catch (e) {
            return 0
        }
    }, [isHalfDay, dateFrom, dateTo])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormSection
                    title="Leave Details"
                    description="Select your leave type and specify the dates for your absence."
                >
                    <FormField
                        control={form.control}
                        name="leave_type"
                        render={({ field }) => (
                            <FormFieldWrapper
                                label="Leave Type"
                                required
                                error={form.formState.errors.leave_type?.message}
                            >
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select leave type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="vacation">Vacation Leave</SelectItem>
                                        <SelectItem value="sick">Sick Leave</SelectItem>
                                        <SelectItem value="emergency">Emergency Leave</SelectItem>
                                        <SelectItem value="maternity">Maternity Leave</SelectItem>
                                        <SelectItem value="paternity">Paternity Leave</SelectItem>
                                        <SelectItem value="special">Special Leave</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormFieldWrapper>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="date_from"
                            render={({ field }) => (
                                <FormFieldWrapper
                                    label="Date From"
                                    required
                                    error={form.formState.errors.date_from?.message}
                                >
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                </FormFieldWrapper>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date_to"
                            render={({ field }) => (
                                <FormFieldWrapper
                                    label="Date To"
                                    required={!isHalfDay}
                                    error={form.formState.errors.date_to?.message}
                                >
                                    <FormControl>
                                        <Input
                                            type="date"
                                            disabled={isHalfDay}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormFieldWrapper>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="is_half_day"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-xs">
                                <div className="space-y-0.5">
                                    <FormLabel>Half day only</FormLabel>
                                    <p className="text-xs text-muted-foreground">
                                        Check if this leave is for a half day only.
                                    </p>
                                </div>
                                <FormControl>
                                    <input
                                        type="checkbox"
                                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <div className="bg-muted rounded-md px-3 py-2 text-sm flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span>Number of days: <span className="font-semibold">{numberOfDays}</span></span>
                    </div>
                </FormSection>

                <FormSection
                    title="Supporting Details"
                    description="Provide a reason for your leave and attach supporting documents if necessary."
                >
                    <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                            <FormFieldWrapper
                                label="Reason / Purpose"
                                required
                                hint={`${reason.length}/500`}
                                error={form.formState.errors.reason?.message}
                            >
                                <FormControl>
                                    <Textarea
                                        placeholder="Please provide specific details for your leave request..."
                                        className="h-24 resize-none"
                                        maxLength={500}
                                        {...field}
                                    />
                                </FormControl>
                            </FormFieldWrapper>
                        )}
                    />
                    <p className="text-xs text-muted-foreground italic">
                        Note: Supporting documents may be required for sick leave exceeding 3 days.
                    </p>
                </FormSection>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <SubmitButton
                        isLoading={isSaving}
                        label="Submit Application"
                        loadingLabel="Submitting..."
                    />
                </div>
            </form>
        </Form>
    )
}
