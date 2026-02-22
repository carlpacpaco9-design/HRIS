'use client'

import { useState, useEffect, useMemo } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ipcrSchema, IPCRFormValues } from "@/lib/validations"
import {
    createIPCRForm,
    updateIPCRForm,
    submitIPCRForm,
    getDivisionChief
} from "@/app/actions/ipcr"
import { getActiveOPCR } from "@/app/actions/opcr"
import { getPotentialSupervisors } from "@/app/actions/profile"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { FormSection } from "@/components/ui/form-section"
import { FormFieldWrapper } from "@/components/ui/form-field-wrapper"
import { SubmitButton } from "@/components/ui/submit-button"
import {
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    AlertCircle,
    Calculator,
    Info,
    ChevronDown,
    ChevronUp,
    Target,
    Paperclip
} from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { IPCRForm, IPCROutput } from "@/types/ipcr"
import { Badge } from "@/components/ui/badge"
import { PencilLine } from "lucide-react"
import {
    getIPCRAttachments,
    deleteIPCRAttachment
} from "@/app/actions/ipcr-attachments"
import { AttachmentUploader } from "./attachment-uploader"
import { AttachmentList } from "./attachment-list"
import { IPCRAttachment } from "@/types/ipcr-attachment"

interface IPCRFormDrawerProps {
    isOpen: boolean
    onClose: () => void
    form?: IPCRForm | null
    profile: any
    activePeriod: any
}

const CATEGORIES = [
    { label: "Strategic Priority", value: "strategic_priority" },
    { label: "Core Function", value: "core_function" }
]

const RATING_LABELS: Record<number, string> = {
    5: "Outstanding",
    4: "Very Satisfactory",
    3: "Satisfactory",
    2: "Unsatisfactory",
    1: "Poor"
}

export function IPCRFormDrawer({
    isOpen,
    onClose,
    form: existingForm,
    profile,
    activePeriod
}: IPCRFormDrawerProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
    const [potentialSupervisors, setPotentialSupervisors] = useState<any[]>([])
    const [activeOPCR, setActiveOPCR] = useState<any>(null)
    const [isOPCRRefExpanded, setIsOPCRRefExpanded] = useState(false)
    const [formAttachments, setFormAttachments] = useState<IPCRAttachment[]>([])
    const [outputAttachments, setOutputAttachments] = useState<Record<string, IPCRAttachment[]>>({})

    const form = useForm<IPCRFormValues>({
        resolver: zodResolver(ipcrSchema),
        defaultValues: {
            rating_period_id: activePeriod?.id || "",
            division_id: profile.division_id || "",
            immediate_supervisor_id: "",
            outputs: [
                { category: "core_function", output_title: "", success_indicator: "" },
                { category: "core_function", output_title: "", success_indicator: "" }
            ],
            comments: ""
        }
    })

    const { fields, append, remove, move } = useFieldArray({
        control: form.control,
        name: "outputs"
    })

    // 1. Initial Data population
    useEffect(() => {
        if (isOpen) {
            if (existingForm) {
                form.reset({
                    rating_period_id: existingForm.rating_period_id,
                    division_id: existingForm.division_id,
                    immediate_supervisor_id: existingForm.immediate_supervisor_id || "",
                    outputs: existingForm.outputs?.map(o => ({
                        category: o.category,
                        output_title: o.output_title,
                        success_indicator: o.success_indicator,
                        actual_accomplishments: o.actual_accomplishments,
                        rating_q: o.rating_q,
                        rating_e: o.rating_e,
                        rating_t: o.rating_t,
                        remarks: o.remarks,
                        db_id: o.id // Inject DB ID for attachments
                    } as any)) || [],
                    comments: existingForm.comments_recommendations || ""
                })
            } else {
                form.reset({
                    rating_period_id: activePeriod?.id || "",
                    division_id: profile.division_id || "",
                    immediate_supervisor_id: "",
                    outputs: [
                        { category: "core_function", output_title: "", success_indicator: "" },
                        { category: "core_function", output_title: "", success_indicator: "" }
                    ],
                    comments: ""
                })
                // Fetch default supervisor
                if (profile.division_id) {
                    getDivisionChief(profile.division_id).then(res => {
                        if (res.data) form.setValue('immediate_supervisor_id', res.data)
                    })
                }
                // Fetch potential supervisors for the dropdown
                getPotentialSupervisors().then(data => {
                    setPotentialSupervisors(data)
                })
                // Fetch active OPCR for reference
                getActiveOPCR().then(res => {
                    if (res.data) setActiveOPCR(res.data)
                })
            }
        }
    }, [isOpen, existingForm, activePeriod, profile, form])

    // 2. Fetch Attachments
    useEffect(() => {
        if (isOpen && existingForm?.id) {
            getIPCRAttachments(existingForm.id).then(({ formAttachments, outputAttachments }) => {
                setFormAttachments(formAttachments)
                setOutputAttachments(outputAttachments)
            })
        } else {
            setFormAttachments([])
            setOutputAttachments({})
        }
    }, [isOpen, existingForm?.id])

    // ── Calculation Logic ──────────────────────────────

    const watchedOutputs = useWatch({ control: form.control, name: "outputs" })

    const rowAverages = useMemo(() => {
        return watchedOutputs?.map(o => {
            const q = Number(o.rating_q) || 0
            const e = Number(o.rating_e) || 0
            const t = Number(o.rating_t) || 0
            const counts = [o.rating_q, o.rating_e, o.rating_t].filter(r => r !== undefined && r !== null).length
            return counts > 0 ? (q + e + t) / counts : 0
        }) || []
    }, [watchedOutputs])

    const finalAverage = useMemo(() => {
        const validScores = rowAverages.filter((a: number) => a > 0)
        return validScores.length > 0 ? validScores.reduce((acc: number, v: number) => acc + v, 0) / validScores.length : 0
    }, [rowAverages])

    const adjectivalRating = useMemo(() => {
        const rounded = Math.round(finalAverage)
        return RATING_LABELS[rounded] || "N/A"
    }, [finalAverage])

    // ── Handlers ───────────────────────────────────────

    const handleSaveDraft = async () => {
        setIsSaving(true)
        const values = form.getValues()
        try {
            const res = existingForm
                ? await updateIPCRForm(existingForm.id, values)
                : await createIPCRForm(values)

            if (res.error) throw new Error(res.error)
            toast.success("Draft saved successfully")
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSubmitFinal = async () => {
        setIsSaving(true)
        try {
            // 1. First update/save any changes
            const values = form.getValues()
            const saveRes = existingForm
                ? await updateIPCRForm(existingForm.id, values)
                : await createIPCRForm(values)

            if (saveRes.error) throw new Error(saveRes.error)

            // 2. Then submit
            const formId = existingForm?.id || (saveRes.data as any).id
            const submitRes = await submitIPCRForm(formId)

            if (submitRes.error) throw new Error(submitRes.error)

            toast.success("IPCR submitted for review")
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSaving(false)
            setShowSubmitConfirm(false)
        }
    }

    const handleAttachmentUpload = (attachment: IPCRAttachment) => {
        if (attachment.ipcr_output_id) {
            setOutputAttachments(prev => ({
                ...prev,
                [attachment.ipcr_output_id!]: [
                    ...(prev[attachment.ipcr_output_id!] || []),
                    attachment
                ]
            }))
        } else {
            setFormAttachments(prev => [...prev, attachment])
        }
        toast.success("File uploaded")
    }

    const handleDeleteAttachment = async (id: string) => {
        const result = await deleteIPCRAttachment(id)
        if (result.error) {
            toast.error(result.error)
            return
        }
        setFormAttachments(prev => prev.filter(a => a.id !== id))
        setOutputAttachments(prev => {
            const next = { ...prev }
            Object.keys(next).forEach(k => {
                next[k] = next[k].filter(a => a.id !== id)
            })
            return next
        })
        toast.success("File deleted")
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !isSaving && !open && onClose()}>
            <SheetContent side="right" className="sm:max-w-3xl w-full flex flex-col p-0 overflow-hidden">
                <SheetHeader className="p-6 border-b shrink-0 bg-white/50 backdrop-blur-sm z-10">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                        <PencilLine className="h-5 w-5" />
                        {existingForm ? "Edit IPCR" : "Create New IPCR"}
                    </SheetTitle>
                    <SheetDescription>
                        {existingForm?.status === 'returned'
                            ? `Revising: ${existingForm.comments_recommendations}`
                            : "Formulate your performance targets for the current rating period."}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    <Form {...form}>
                        <form className="space-y-8 pb-10">

                            {/* Office Performance Reference Section */}
                            {activeOPCR && (
                                <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setIsOPCRRefExpanded(!isOPCRRefExpanded)}
                                        className="w-full flex items-center justify-between p-3 hover:bg-primary/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 text-primary">
                                            <Target className="h-4 w-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Office Performance Reference</span>
                                        </div>
                                        {isOPCRRefExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>
                                    {isOPCRRefExpanded && (
                                        <div className="p-4 pt-0 space-y-3 animate-in slide-in-from-top-1">
                                            <p className="text-[10px] text-muted-foreground italic mb-2">
                                                Based on the current OPCR, your individual outputs should align with the following office commitments:
                                            </p>
                                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
                                                {activeOPCR.outputs?.map((o: any, i: number) => (
                                                    <div key={o.id} className="p-2 bg-white rounded border border-primary/10 text-[11px]">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 uppercase">{o.category.replace('_', ' ')}</Badge>
                                                            <span className="font-bold text-slate-700">Output #{i + 1}</span>
                                                        </div>
                                                        <p className="text-slate-600 line-clamp-2 leading-relaxed">{o.output_title}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Info Section */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Employee</label>
                                    <p className="text-sm font-semibold">{profile.full_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Rating Period</label>
                                    <p className="text-sm font-semibold">{activePeriod?.name || "N/A"}</p>
                                </div>
                            </div>

                            <FormSection title="Configuration" description="Select your supervisor and confirm division.">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="immediate_supervisor_id"
                                        render={({ field }) => (
                                            <FormFieldWrapper label="Immediate Supervisor" required error={form.formState.errors.immediate_supervisor_id?.message}>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select supervisor" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {potentialSupervisors.map(s => (
                                                            <SelectItem key={s.id} value={s.id}>
                                                                {s.full_name} ({s.position_title})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormFieldWrapper>
                                        )}
                                    />
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Division</label>
                                        <div className="h-10 px-3 flex items-center bg-muted rounded-md text-sm border font-medium">
                                            {profile.division?.name || "Province of HRMS"}
                                        </div>
                                    </div>
                                </div>
                            </FormSection>

                            <FormSection
                                title="Performance Outputs"
                                description="Define your targets (MFOs) and success indicators."
                            >
                                <div className="space-y-6">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="relative group p-5 rounded-xl border border-border bg-card shadow-sm space-y-4 transition-all hover:border-primary/30">

                                            {/* Output Header */}
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col gap-1">
                                                        <Button
                                                            type="button" size="icon" variant="ghost" className="h-6 w-6"
                                                            onClick={() => index > 0 && move(index, index - 1)}
                                                            disabled={index === 0}
                                                        >
                                                            <ArrowUp className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            type="button" size="icon" variant="ghost" className="h-6 w-6"
                                                            onClick={() => index < fields.length - 1 && move(index, index + 1)}
                                                            disabled={index === fields.length - 1}
                                                        >
                                                            <ArrowDown className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-foreground">Output #{index + 1}</h4>
                                                </div>

                                                {fields.length > 1 && (
                                                    <Button
                                                        type="button" variant="ghost" size="sm"
                                                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => remove(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`outputs.${index}.category`}
                                                    render={({ field }) => (
                                                        <FormFieldWrapper label="Category" required>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select category" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {CATEGORIES.map(c => (
                                                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormFieldWrapper>
                                                    )}
                                                />
                                                <div className="md:col-span-2">
                                                    <FormField
                                                        control={form.control}
                                                        name={`outputs.${index}.output_title`}
                                                        render={({ field }) => (
                                                            <FormFieldWrapper label="Major Final Output (MFO)" required>
                                                                <FormControl>
                                                                    <Input placeholder="What will you deliver?" {...field} />
                                                                </FormControl>
                                                            </FormFieldWrapper>
                                                        )}
                                                    />
                                                </div>
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name={`outputs.${index}.success_indicator`}
                                                render={({ field }) => (
                                                    <FormFieldWrapper label="Success Indicator" required>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Target + Measure (Quantity, Quality, Timeliness)..."
                                                                className="min-h-[80px] resize-none"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormFieldWrapper>
                                                )}
                                            />

                                            {/* Scores (Conditional or restricted for Draft creation) */}
                                            <div className="grid grid-cols-4 gap-3 bg-muted/30 p-3 rounded-lg border border-border">
                                                {['rating_q', 'rating_e', 'rating_t'].map((r) => (
                                                    <FormField
                                                        key={r}
                                                        control={form.control}
                                                        name={`outputs.${index}.${r}` as any}
                                                        render={({ field }) => (
                                                            <FormItem className="space-y-1">
                                                                <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">{r.split('_')[1]} rating</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number" step="0.5" min="1" max="5"
                                                                        className="h-9 px-2 text-center focus-visible:ring-primary"
                                                                        {...field}
                                                                        value={field.value || ''}
                                                                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Average</p>
                                                    <div className="h-9 flex items-center justify-center bg-primary/10 rounded-md font-bold text-primary border border-primary/20">
                                                        {rowAverages[index] > 0 ? rowAverages[index].toFixed(2) : "0.00"}
                                                    </div>
                                                </div>
                                            </div>

                                            {rowAverages[index] > 0 && (
                                                <div className="flex items-center gap-1.5 text-[11px] font-medium pl-1 text-primary">
                                                    <Info className="h-3 w-3" />
                                                    <span>Adjective: <span className="font-bold uppercase italic">{RATING_LABELS[Math.round(rowAverages[index])] || "N/A"}</span></span>
                                                </div>
                                            )}

                                            <FormField
                                                control={form.control}
                                                name={`outputs.${index}.actual_accomplishments`}
                                                render={({ field }) => (
                                                    <FormFieldWrapper label="Actual Accomplishments">
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="What was achieved during this period?"
                                                                className="min-h-[60px] resize-none"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormFieldWrapper>
                                                )}
                                            />

                                            {/* Attachment Uploader (Compact) */}
                                            {(field as any).db_id && existingForm && (
                                                <div className="col-span-1 md:col-span-3 mt-2 border-t pt-3 border-dashed">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                            <Paperclip className="h-3 w-3" /> Evidence / Proof of Accomplishment
                                                        </label>
                                                        <AttachmentUploader
                                                            ipcr_form_id={existingForm.id}
                                                            ipcr_output_id={(field as any).db_id}
                                                            employee_id={existingForm.employee_id}
                                                            ipcr_status={existingForm.status}
                                                            existing_count={outputAttachments[(field as any).db_id]?.length || 0}
                                                            onUploadSuccess={handleAttachmentUpload}
                                                            compact={true}
                                                        />
                                                    </div>
                                                    {outputAttachments[(field as any).db_id]?.length > 0 && (
                                                        <AttachmentList
                                                            attachments={outputAttachments[(field as any).db_id]}
                                                            ipcr_form_id={existingForm.id}
                                                            ipcr_status={existingForm.status}
                                                            canDelete={true}
                                                            currentUserId={profile.id}
                                                            onDelete={handleDeleteAttachment}
                                                            className="mt-2"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <Button
                                        type="button" variant="outline"
                                        className="w-full h-12 border-dashed border-2 hover:bg-primary/5 hover:border-primary/50 transition-all gap-2"
                                        onClick={() => append({
                                            category: "core_function",
                                            output_title: "",
                                            success_indicator: ""
                                        })}
                                        disabled={fields.length >= 10}
                                    >
                                        <Plus className="h-4 w-4" /> Add Performance Output
                                    </Button>
                                </div>
                            </FormSection>

                            <FormSection title="Final Assessment" description="Summary and self-assessment comments.">
                                <FormField
                                    control={form.control}
                                    name="comments"
                                    render={({ field }) => (
                                        <FormFieldWrapper label="Self-Assessment / Comments">
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Provide any additional context or self-review details..."
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormFieldWrapper>
                                    )}
                                />

                                <div className="mt-6 flex flex-col items-center justify-center bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center space-y-3 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Calculator className="h-24 w-24" />
                                    </div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Calculated Final Rating</h4>
                                    <div className="flex flex-col items-center">
                                        <span className="text-5xl font-black text-primary font-inter leading-tight">
                                            {finalAverage > 0 ? finalAverage.toFixed(2) : "0.00"}
                                        </span>
                                        <Badge className={cn(
                                            "mt-3 px-5 py-1 text-xs font-bold uppercase tracking-wider h-7",
                                            finalAverage >= 4.5 ? "bg-green-500 hover:bg-green-600" :
                                                finalAverage >= 3.5 ? "bg-blue-500 hover:bg-blue-600" :
                                                    finalAverage >= 2.5 ? "bg-amber-500 hover:bg-amber-600" :
                                                        "bg-rose-500 hover:bg-rose-600"
                                        )}>
                                            {adjectivalRating}
                                        </Badge>
                                    </div>
                                </div>
                            </FormSection>

                            {/* Form Level Attachments */}
                            {existingForm && (
                                <FormSection title="Supporting Documents" description="Attach documents that support your overall IPCR accomplishments.">
                                    <AttachmentUploader
                                        ipcr_form_id={existingForm.id}
                                        ipcr_output_id={null}
                                        employee_id={existingForm.employee_id}
                                        ipcr_status={existingForm.status}
                                        existing_count={formAttachments.length}
                                        onUploadSuccess={handleAttachmentUpload}
                                        compact={false}
                                    />
                                    {formAttachments.length > 0 && (
                                        <AttachmentList
                                            attachments={formAttachments}
                                            ipcr_form_id={existingForm.id}
                                            ipcr_status={existingForm.status}
                                            canDelete={true}
                                            currentUserId={profile.id}
                                            onDelete={handleDeleteAttachment}
                                            className="mt-4"
                                            emptyMessage="No supporting documents attached"
                                        />
                                    )}
                                </FormSection>
                            )}
                        </form>
                    </Form>
                </div>

                <SheetFooter className="p-6 border-t bg-slate-50 shrink-0 gap-3 z-10">
                    <Button
                        variant="outline" className="flex-1 h-11"
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                    >
                        Save as Draft
                    </Button>
                    <Button
                        className="flex-1 h-11 shadow-lg shadow-primary/20"
                        onClick={async () => {
                            const isValid = await form.trigger()
                            if (isValid) {
                                setShowSubmitConfirm(true)
                            } else {
                                toast.error("Please fill in all required fields correctly.")
                            }
                        }}
                        disabled={isSaving}
                    >
                        Submit IPCR
                    </Button>
                </SheetFooter>
            </SheetContent>

            <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            Confirm Submission
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to submit your IPCR? Once submitted, it will be sent to your supervisor and you cannot edit it unless it is returned for revision.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSubmitFinal}
                            className="bg-primary hover:bg-primary/90"
                            disabled={isSaving}
                        >
                            {isSaving ? "Submitting..." : "Yes, Submit IPCR"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Sheet>
    )
}


