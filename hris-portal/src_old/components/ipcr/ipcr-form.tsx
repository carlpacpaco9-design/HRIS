"use client"

import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ipcrSchema, IPCRFormValues } from "@/lib/validations"
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
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { FormSection } from "@/components/ui/form-section"
import { FormFieldWrapper } from "@/components/ui/form-field-wrapper"
import { SubmitButton } from "@/components/ui/submit-button"
import { Plus, Trash2, Calculator, Info } from "lucide-react"
import { useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"

interface IPCRFormProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: IPCRFormValues) => Promise<void>
    onSaveDraft: (data: IPCRFormValues) => Promise<void>
    isSaving: boolean
    userDivision?: string
    initialData?: Partial<IPCRFormValues>
}

const RATING_LABELS: Record<number, string> = {
    5: "Outstanding",
    4: "Very Satisfactory",
    3: "Satisfactory",
    2: "Unsatisfactory",
    1: "Poor",
}

export function IPCRForm({
    isOpen,
    onOpenChange,
    onSubmit,
    onSaveDraft,
    isSaving,
    userDivision = "Administrative Division",
    initialData
}: IPCRFormProps) {
    const form = useForm<IPCRFormValues>({
        resolver: zodResolver(ipcrSchema),
        defaultValues: {
            period_from: (initialData as any)?.period_from || "",
            period_to: (initialData as any)?.period_to || "",
            outputs: initialData?.outputs || [
                {
                    category: 'core_function' as const,
                    output_title: "",
                    success_indicator: "",
                    actual_accomplishments: "",
                    rating_q: undefined,
                    rating_e: undefined,
                    rating_t: undefined,
                    rating_average: undefined,
                    remarks: "",
                }
            ],
            comments: initialData?.comments || "",
            final_average_rating: initialData?.final_average_rating || 0,
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "outputs",
    })

    // Watch all outputs to compute averages
    const watchedOutputs = useWatch({
        control: form.control,
        name: "outputs",
    })

    // Compute averages for each row and the final average
    useEffect(() => {
        let finalSum = 0
        let count = 0

        watchedOutputs.forEach((output, index) => {
            const { rating_q, rating_e, rating_t } = output
            if (rating_q || rating_e || rating_t) {
                const q = Number(rating_q) || 0
                const e = Number(rating_e) || 0
                const t = Number(rating_t) || 0

                const ratings = [rating_q, rating_e, rating_t].filter(r => r !== undefined && r !== null)
                if (ratings.length > 0) {
                    const avg = Number(((q + e + t) / ratings.length).toFixed(2))
                    if (output.rating_average !== avg) {
                        form.setValue(`outputs.${index}.rating_average`, avg)
                    }
                    finalSum += avg
                    count++
                }
            }
        })

        const finalAvg = count > 0 ? Number((finalSum / count).toFixed(2)) : 0
        if (form.getValues("final_average_rating") !== finalAvg) {
            form.setValue("final_average_rating", finalAvg)
        }
    }, [watchedOutputs, form])

    const finalAverage = form.watch("final_average_rating") || 0
    const finalAdjective = RATING_LABELS[Math.round(finalAverage)] || "N/A"

    const ratingPeriodLabel = useMemo(() => {
        const from = form.watch("period_from")
        const to = form.watch("period_to")
        if (!from || !to) return "Not specified"

        const dateFrom = new Date(from)
        const month = dateFrom.getMonth()
        const year = dateFrom.getFullYear()

        if (month < 6) return `1st Semester ${year}`
        return `2nd Semester ${year}`
    }, [form.watch("period_from"), form.watch("period_to")])

    const handleOpenChange = (open: boolean) => {
        if (isSaving) return
        onOpenChange(open)
        if (!open) {
            form.reset()
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetContent
                side="right"
                className="sm:max-w-2xl w-full flex flex-col p-0 overflow-hidden"
                onPointerDownOutside={(e) => { if (isSaving) e.preventDefault() }}
                onEscapeKeyDown={(e) => { if (isSaving) e.preventDefault() }}
            >
                <SheetHeader className="px-6 py-4 border-b shrink-0 bg-background">
                    <SheetTitle className="text-xl font-bold">IPCR — Individual Performance Commitment and Review</SheetTitle>
                    <SheetDescription>
                        Complete your performance commitment for the rating period
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scrollbar-thin">
                    <Form {...form}>
                        <form className="space-y-8">
                            {/* Rating Period Section */}
                            <FormSection
                                title="Rating Period"
                                description="Specify the evaluation timeline and review your organizational units."
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="period_from"
                                        render={({ field }) => (
                                            <FormFieldWrapper label="Period From" required error={form.formState.errors.period_from?.message}>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                            </FormFieldWrapper>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="period_to"
                                        render={({ field }) => (
                                            <FormFieldWrapper label="Period To" required error={form.formState.errors.period_to?.message}>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                            </FormFieldWrapper>
                                        )}
                                    />
                                </div>

                                <div className="mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium font-inter">Rating Period:</span>
                                        <span className="text-blue-700 font-bold">{ratingPeriodLabel}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium font-inter">Division:</span>
                                        <span className="text-blue-700 font-bold">{userDivision}</span>
                                    </div>
                                </div>
                            </FormSection>

                            {/* Performance Outputs Section */}
                            <FormSection
                                title="Performance Outputs"
                                description="List your major final outputs, success indicators, and accomplishments."
                            >
                                <div className="space-y-6">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="relative p-5 rounded-xl border border-slate-200 bg-slate-50/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-sm font-bold text-slate-900">Output #{index + 1}</h4>
                                                {fields.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => remove(index)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name={`outputs.${index}.output_title`}
                                                render={({ field }) => (
                                                    <FormFieldWrapper label="Major Final Output" required>
                                                        <FormControl>
                                                            <Input placeholder="Describe your output title..." {...field} />
                                                        </FormControl>
                                                    </FormFieldWrapper>
                                                )}
                                            />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`outputs.${index}.success_indicator`}
                                                    render={({ field }) => (
                                                        <FormFieldWrapper label="Success Indicator" required>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Target + Measure..."
                                                                    className="h-20 resize-none"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </FormFieldWrapper>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`outputs.${index}.actual_accomplishments`}
                                                    render={({ field }) => (
                                                        <FormFieldWrapper label="Actual Accomplishments">
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="What was achieved?"
                                                                    className="h-20 resize-none"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </FormFieldWrapper>
                                                    )}
                                                />
                                            </div>

                                            {/* Ratings Grid */}
                                            <div className="grid grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                                                <FormField
                                                    control={form.control}
                                                    name={`outputs.${index}.rating_q`}
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Quality (Q)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    max={5}
                                                                    className="h-9 px-2 text-center"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`outputs.${index}.rating_e`}
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Efficiency (E)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    max={5}
                                                                    className="h-9 px-2 text-center"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`outputs.${index}.rating_t`}
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Timeliness (T)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    max={5}
                                                                    className="h-9 px-2 text-center"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[10px] uppercase font-bold text-slate-500">Average</FormLabel>
                                                    <div className="h-9 flex items-center justify-center bg-slate-100 rounded-md font-bold text-slate-700 border border-slate-200">
                                                        {watchedOutputs[index]?.rating_average || "0.00"}
                                                    </div>
                                                </FormItem>
                                            </div>

                                            {watchedOutputs[index]?.rating_average && (
                                                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500 pl-1">
                                                    <Info className="h-3 w-3" />
                                                    <span>Adjective: <span className="text-blue-600 uppercase italic font-bold">{RATING_LABELS[Math.round(watchedOutputs[index]?.rating_average || 0)] || "N/A"}</span></span>
                                                </div>
                                            )}

                                            <FormField
                                                control={form.control}
                                                name={`outputs.${index}.remarks`}
                                                render={({ field }) => (
                                                    <FormFieldWrapper label="Remarks">
                                                        <FormControl>
                                                            <Input placeholder="Additional notes..." {...field} />
                                                        </FormControl>
                                                    </FormFieldWrapper>
                                                )}
                                            />
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full border-dashed border-2 py-6 hover:bg-slate-50"
                                        onClick={() => append({
                                            category: 'core_function',
                                            output_title: "",
                                            success_indicator: "",
                                            actual_accomplishments: "",
                                            rating_q: undefined,
                                            rating_e: undefined,
                                            rating_t: undefined,
                                            rating_average: undefined,
                                            remarks: "",
                                        })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Performance Output
                                    </Button>
                                </div>
                            </FormSection>

                            {/* Final Assessment Section */}
                            <FormSection title="Final Assessment" description="Summarize your performance and provide final comments.">
                                <FormField
                                    control={form.control}
                                    name="comments"
                                    render={({ field }) => (
                                        <FormFieldWrapper label="Comments & Recommendations">
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Provide details for your final performance review..."
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormFieldWrapper>
                                    )}
                                />

                                <div className="mt-6 flex flex-col items-center justify-center bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-2">
                                    <div className="p-2 bg-primary/10 rounded-full mb-1">
                                        <Calculator className="h-5 w-5 text-primary" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Final Average Rating</h4>
                                    <div className="flex flex-col items-center">
                                        <span className="text-4xl font-black text-primary font-inter leading-none">
                                            {finalAverage.toFixed(2)}
                                        </span>
                                        <span className={cn(
                                            "mt-2 inline-flex items-center rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider",
                                            finalAverage >= 4.5 ? "bg-green-100 text-green-700" :
                                                finalAverage >= 3.5 ? "bg-blue-100 text-blue-700" :
                                                    finalAverage >= 2.5 ? "bg-amber-100 text-amber-700" :
                                                        "bg-red-100 text-red-700"
                                        )}>
                                            {finalAdjective}
                                        </span>
                                    </div>
                                </div>
                            </FormSection>
                        </form>
                    </Form>
                </div>

                <SheetFooter className="px-6 py-4 border-t bg-background shrink-0 flex-col gap-3">
                    <div className="flex w-full gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-11"
                            onClick={() => onSaveDraft(form.getValues())}
                            disabled={isSaving}
                        >
                            Save as Draft
                        </Button>
                        <SubmitButton
                            className="flex-1 h-11"
                            label="Submit IPCR"
                            loadingLabel="Submitting..."
                            isLoading={isSaving}
                            onClick={form.handleSubmit(onSubmit)}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                        Once submitted, your IPCR will be sent for review by your immediate supervisor.
                        You will not be able to edit the targets until the review is complete.
                    </p>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
