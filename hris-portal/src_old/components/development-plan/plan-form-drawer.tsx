'use client'

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    ClipboardList,
    UserCircle,
    Info,
    AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    getStaffForSelection,
    getEligibleIPCRsForPlan,
    createDevelopmentPlan,
    updateDevelopmentPlan
} from "@/app/actions/development-plan"
import { DevelopmentPlan } from "@/types/development-plan"
import { SubmitButton } from "@/components/ui/submit-button"

const planSchema = z.object({
    employee_id: z.string().min(1, "Employee is required"),
    ipcr_form_id: z.string().min(1, "Linked IPCR is required"),
    plan_date: z.string().min(1, "Plan date is required"),
    aim: z.string()
        .min(10, "Aim must be at least 10 characters")
        .max(500),
    objective: z.string()
        .min(10, "Objective must be at least 10 characters")
        .max(500),
    target_date: z.string().optional(),
    review_date: z.string().optional(),
    comments: z.string().max(1000).optional(),
    tasks: z.array(z.object({
        task_description: z.string()
            .min(5, "Task description required"),
        next_step: z.string().optional(),
        outcome: z.string().optional(),
        sort_order: z.number(),
    })).min(1, "At least one task is required"),
})

type PlanFormValues = z.infer<typeof planSchema>

interface PlanFormDrawerProps {
    isOpen: boolean
    onClose: () => void
    plan?: DevelopmentPlan | null
    profile: any
    ratingPeriods: any[]
}

export function PlanFormDrawer({
    isOpen,
    onClose,
    plan,
    profile,
    ratingPeriods
}: PlanFormDrawerProps) {
    const [employees, setEmployees] = useState<any[]>([])
    const [eligibleIPCRs, setEligibleIPCRs] = useState<any[]>([])
    const [isLoadingIPCRs, setIsLoadingIPCRs] = useState(false)

    const form = useForm<PlanFormValues>({
        resolver: zodResolver(planSchema),
        defaultValues: {
            employee_id: "",
            ipcr_form_id: "",
            plan_date: new Date().toISOString().split('T')[0],
            aim: "",
            objective: "",
            target_date: "",
            review_date: "",
            comments: "",
            tasks: [{ task_description: "", next_step: "", outcome: "", sort_order: 0 }]
        }
    })

    const { fields, append, remove, move } = useFieldArray({
        control: form.control,
        name: "tasks"
    })

    const selectedEmployeeId = form.watch("employee_id")
    const selectedIPCRId = form.watch("ipcr_form_id")
    const selectedIPCR = eligibleIPCRs.find(f => f.id === selectedIPCRId) || plan?.ipcr_form

    // Fetch employees on mount
    useEffect(() => {
        const fetchEmployees = async () => {
            const res = await getStaffForSelection()
            if (res.data) setEmployees(res.data)
        }
        if (isOpen) fetchEmployees()
    }, [isOpen])

    // Reset form when plan changes or opening for creation
    useEffect(() => {
        if (isOpen) {
            if (plan) {
                form.reset({
                    employee_id: plan.employee_id,
                    ipcr_form_id: plan.ipcr_form_id,
                    plan_date: plan.plan_date,
                    aim: plan.aim,
                    objective: plan.objective,
                    target_date: plan.target_date || "",
                    review_date: plan.review_date || "",
                    comments: plan.comments || "",
                    tasks: plan.tasks?.map(t => ({
                        task_description: t.task_description,
                        next_step: t.next_step || "",
                        outcome: t.outcome || "",
                        sort_order: t.sort_order
                    })) || [{ task_description: "", next_step: "", outcome: "", sort_order: 0 }]
                })
            } else {
                form.reset({
                    employee_id: "",
                    ipcr_form_id: "",
                    plan_date: new Date().toISOString().split('T')[0],
                    aim: "",
                    objective: "",
                    target_date: "",
                    review_date: "",
                    comments: "",
                    tasks: [{ task_description: "", next_step: "", outcome: "", sort_order: 0 }]
                })
            }
        }
    }, [plan, isOpen, form])

    // Chain fetch eligible IPCRs when employee changes
    useEffect(() => {
        const fetchIPCRs = async () => {
            if (!selectedEmployeeId) {
                setEligibleIPCRs([])
                return
            }
            setIsLoadingIPCRs(true)
            const res = await getEligibleIPCRsForPlan(selectedEmployeeId)
            setEligibleIPCRs(res)
            setIsLoadingIPCRs(false)
        }
        fetchIPCRs()
    }, [selectedEmployeeId])

    const onSubmit = async (values: PlanFormValues) => {
        try {
            // Find rating_period_id for the selected IPCR
            const ipcr = eligibleIPCRs.find(f => f.id === values.ipcr_form_id) || (plan?.ipcr_form_id === values.ipcr_form_id ? plan : null)
            const rating_period_id = ipcr?.rating_period_id || plan?.rating_period_id

            if (!rating_period_id) throw new Error("Could not determine rating period")

            if (plan) {
                const res = await updateDevelopmentPlan(plan.id, values)
                if (res.error) throw new Error(res.error)
                toast.success("Development plan updated")
            } else {
                const res = await createDevelopmentPlan({
                    ...values,
                    rating_period_id
                })
                if (res.error) throw new Error(res.error)
                toast.success("Development plan created")
            }
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const getRatingColorClass = (rating: number) => {
        if (rating >= 4.5) return "text-green-600 font-bold"
        if (rating >= 3.5) return "text-blue-600 font-bold"
        if (rating >= 2.5) return "text-amber-600 font-bold"
        return "text-red-600 font-bold"
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0 overflow-hidden">
                <SheetHeader className="px-6 py-4 border-b shrink-0 bg-background">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <ClipboardList className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <SheetTitle>{plan ? "Edit" : "Create"} Development Plan</SheetTitle>
                            <SheetDescription>Annex K — Professional Development Plan (SPMS)</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
                    <Form {...form}>
                        <form id="plan-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Section 1: Plan Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <UserCircle className="h-4 w-4" /> Plan Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="employee_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Employee</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={!!plan} // Cannot change employee once created
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select employee" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {employees.map(emp => (
                                                            <SelectItem key={emp.id} value={emp.id}>
                                                                {emp.full_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="ipcr_form_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Linked Performance Review (IPCR)</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={!!plan || !selectedEmployeeId || isLoadingIPCRs}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={isLoadingIPCRs ? "Loading..." : "Select IPCR form"} />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {eligibleIPCRs.map(f => (
                                                            <SelectItem key={f.id} value={f.id}>
                                                                {f.rating_period?.name} — {f.adjectival_rating} ({f.final_average_rating})
                                                            </SelectItem>
                                                        ))}
                                                        {plan && (
                                                            <SelectItem value={plan.ipcr_form_id}>
                                                                {plan.rating_period?.name} — {plan.ipcr_form?.adjectival_rating} ({plan.ipcr_form?.final_average_rating})
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {selectedEmployeeId && eligibleIPCRs.length === 0 && !isLoadingIPCRs && !plan && (
                                                    <FormDescription className="text-amber-600 text-[10px] flex items-center gap-1">
                                                        <Info className="h-3 w-3" /> No approved/finalized IPCRs found for this employee
                                                    </FormDescription>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {selectedIPCR && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Linked IPCR Summary</span>
                                            <Badge variant="outline" className="text-[10px] uppercase font-bold">{selectedIPCR.adjectival_rating}</Badge>
                                        </div>
                                        <p className="text-sm">
                                            Final Average Rating: <span className={getRatingColorClass(selectedIPCR.final_average_rating)}>{selectedIPCR.final_average_rating}</span>
                                        </p>
                                        {selectedIPCR.final_average_rating <= 2.0 && (
                                            <div className="flex gap-2 items-start p-2 bg-red-50 rounded border border-red-100">
                                                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-red-600 italic leading-snug">
                                                    CSC SPMS: Development plan required within 1 month of rating period end for Unsatisfactory/Poor ratings.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <FormField
                                    control={form.control}
                                    name="plan_date"
                                    render={({ field }) => (
                                        <FormItem className="max-w-[200px]">
                                            <FormLabel>Plan Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Section 2: Goals */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Development Goals</h3>

                                <FormField
                                    control={form.control}
                                    name="aim"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex justify-between items-end">
                                                <FormLabel>Aim</FormLabel>
                                                <span className={cn("text-[10px]", field.value?.length > 450 ? "text-red-500" : "text-muted-foreground")}>
                                                    {field.value?.length || 0}/500
                                                </span>
                                            </div>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="What this plan aims to achieve..."
                                                    className="resize-none min-h-[80px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-[10px]">Broad statement of purpose for development.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="objective"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex justify-between items-end">
                                                <FormLabel>Specific Objective</FormLabel>
                                                <span className={cn("text-[10px]", field.value?.length > 450 ? "text-red-500" : "text-muted-foreground")}>
                                                    {field.value?.length || 0}/500
                                                </span>
                                            </div>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Specific learning or improvement objective..."
                                                    className="resize-none min-h-[80px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription className="text-[10px]">What exactly should be improved or learned.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Section 3: Timeline */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Timeline</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="target_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    Target Date <Info className="h-3.5 w-3.5 text-slate-400" />
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-[10px]">Projected date of achievement.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="review_date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    Review Date <Info className="h-3.5 w-3.5 text-slate-400" />
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormDescription className="text-[10px]">Scheduled mid-point review.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Section 4: Tasks */}
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Development Tasks</h3>
                                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase">{fields.length} Tasks</span>
                                </div>

                                <div className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="relative p-4 border rounded-xl bg-slate-50/50 group space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-[10px] font-bold shrink-0">
                                                    {index + 1}
                                                </span>
                                                <FormField
                                                    control={form.control}
                                                    name={`tasks.${index}.task_description`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input placeholder="Task description (e.g., Attend Python Basics Training)" {...field} className="bg-white" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(index, index - 1)} disabled={index === 0}>
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(index, index + 1)} disabled={index === fields.length - 1}>
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(index)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 ml-10">
                                                <FormField
                                                    control={form.control}
                                                    name={`tasks.${index}.next_step`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input placeholder="Next Step (Optional)" {...field} className="bg-white text-xs" />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`tasks.${index}.outcome`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input placeholder="Desired Outcome (Optional)" {...field} className="bg-white text-xs" />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full h-10 border-dashed"
                                    onClick={() => append({ task_description: "", next_step: "", outcome: "", sort_order: fields.length })}
                                    disabled={fields.length >= 15}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add Development Task
                                </Button>
                                <p className="text-[10px] text-center text-muted-foreground uppercase font-medium">Max 15 tasks per plan</p>
                            </div>

                            {/* Section 5: Comments */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Additional Notes</h3>
                                <FormField
                                    control={form.control}
                                    name="comments"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex justify-between items-end">
                                                <FormLabel>Remarks</FormLabel>
                                                <span className={cn("text-[10px]", (field.value?.length || 0) > 950 ? "text-red-500" : "text-muted-foreground")}>
                                                    {(field.value?.length || 0)}/1000
                                                </span>
                                            </div>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Additional remarks or context for this plan..."
                                                    className="resize-none min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </form>
                    </Form>
                </div>

                <SheetFooter className="px-6 py-4 border-t bg-background shrink-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between w-full mt-0 gap-4">
                        <span className="text-xs text-muted-foreground font-medium italic">* Required fields</span>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={onClose} disabled={form.formState.isSubmitting}>Cancel</Button>
                            <SubmitButton
                                isLoading={form.formState.isSubmitting}
                                label={plan ? "Save Changes" : "Create Plan"}
                                className="bg-indigo-600 hover:bg-indigo-700 w-[140px]"
                            />
                        </div>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
