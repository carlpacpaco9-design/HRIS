"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { dtrSchema, DTRFormValues } from "@/lib/validations"
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
import { Clock } from "lucide-react"

interface DTRFormProps {
    staff: { id: string, full_name: string }[]
    onSubmit: (data: DTRFormValues) => Promise<void>
    onCancel: () => void
    isSaving: boolean
    initialValues?: Partial<DTRFormValues>
}

export function DTRForm({
    staff,
    onSubmit,
    onCancel,
    isSaving,
    initialValues
}: DTRFormProps) {
    const form = useForm<DTRFormValues>({
        resolver: zodResolver(dtrSchema),
        defaultValues: {
            staff_id: initialValues?.staff_id || "",
            date: initialValues?.date || new Date().toISOString().split('T')[0],
            am_arrival: initialValues?.am_arrival || "08:00",
            am_departure: initialValues?.am_departure || "12:00",
            pm_arrival: initialValues?.pm_arrival || "13:00",
            pm_departure: initialValues?.pm_departure || "17:00",
            remarks: initialValues?.remarks || "",
        },
    })

    const remarks = form.watch("remarks") || ""

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormSection
                    title="Time Record Details"
                    description="Record staff member daily time entry"
                >
                    <FormField
                        control={form.control}
                        name="staff_id"
                        render={({ field }) => (
                            <FormFieldWrapper
                                label="Staff Member"
                                required
                                error={form.formState.errors.staff_id?.message}
                            >
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a staff member" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {staff.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormFieldWrapper>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormFieldWrapper
                                label="Date"
                                required
                                error={form.formState.errors.date?.message}
                            >
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                            </FormFieldWrapper>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="am_arrival"
                            render={({ field }) => (
                                <FormFieldWrapper
                                    label="AM Arrival"
                                    error={form.formState.errors.am_arrival?.message}
                                >
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                </FormFieldWrapper>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="am_departure"
                            render={({ field }) => (
                                <FormFieldWrapper
                                    label="AM Departure"
                                    error={form.formState.errors.am_departure?.message}
                                >
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                </FormFieldWrapper>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="pm_arrival"
                            render={({ field }) => (
                                <FormFieldWrapper
                                    label="PM Arrival"
                                    error={form.formState.errors.pm_arrival?.message}
                                >
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                </FormFieldWrapper>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="pm_departure"
                            render={({ field }) => (
                                <FormFieldWrapper
                                    label="PM Departure"
                                    error={form.formState.errors.pm_departure?.message}
                                >
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                </FormFieldWrapper>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="remarks"
                        render={({ field }) => (
                            <FormFieldWrapper
                                label="Remarks"
                                hint={`${remarks.length}/200`}
                                error={form.formState.errors.remarks?.message}
                            >
                                <FormControl>
                                    <Textarea
                                        placeholder="Optional notes or remarks..."
                                        className="h-20 resize-none"
                                        maxLength={200}
                                        {...field}
                                    />
                                </FormControl>
                            </FormFieldWrapper>
                        )}
                    />
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
                        label="Save Entry"
                        loadingLabel="Saving..."
                    />
                </div>
            </form>
        </Form>
    )
}
