"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { targetSchema, TargetFormValues } from "@/lib/validations"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, ShieldCheck, Loader2 } from "lucide-react"

import { FormSection } from "@/components/ui/form-section"
import { FormFieldWrapper } from "@/components/ui/form-field-wrapper"
import { SubmitButton } from "@/components/ui/submit-button"

interface TargetFormProps {
    initialValues?: Partial<TargetFormValues>
    onSubmit: (data: TargetFormValues) => Promise<void>
    onCancel: () => void
    isSaving: boolean
    title: string
}

export function TargetForm({
    initialValues,
    onSubmit,
    onCancel,
    isSaving,
    title
}: TargetFormProps) {
    const form = useForm<TargetFormValues>({
        resolver: zodResolver(targetSchema),
        defaultValues: {
            mfo_category: initialValues?.mfo_category || "strategic",
            output: initialValues?.output || "",
            indicators: initialValues?.indicators || "",
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-6 p-6 overflow-y-auto max-h-[60vh]">
                    <FormSection
                        title="Target Information"
                        description={`Provide the specific output and indicators for your ${title.toLowerCase()} target.`}
                    >
                        <FormField
                            control={form.control}
                            name="output"
                            render={({ field }) => (
                                <FormFieldWrapper
                                    label="Major Final Output (MFO)"
                                    required
                                    error={form.formState.errors.output?.message}
                                >
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter the main output or service you will deliver..."
                                            className="min-h-[80px] w-full resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                </FormFieldWrapper>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="indicators"
                            render={({ field }) => (
                                <FormFieldWrapper
                                    label="Success Indicators"
                                    required
                                    error={form.formState.errors.indicators?.message}
                                >
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe quantity, quality, and timeliness (e.g., 95% efficiency...)"
                                            className="min-h-[100px] w-full resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                </FormFieldWrapper>
                            )}
                        />
                    </FormSection>
                </div>

                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-xl">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        className="font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg px-6 h-10"
                    >
                        Cancel
                    </Button>
                    <SubmitButton
                        isLoading={isSaving}
                        label={initialValues?.output ? 'Update Target' : 'Save Target'}
                        loadingLabel="Saving..."
                        className="bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-lg shadow-blue-200 rounded-xl h-10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    />
                </div>
            </form>
        </Form>
    )
}
