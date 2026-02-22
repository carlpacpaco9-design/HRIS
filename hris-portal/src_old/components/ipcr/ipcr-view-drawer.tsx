'use client'

import { useState, useEffect } from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Eye,
    Download,
    User,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Quote,
    ArrowRight,
    TrendingUp,
    Plus,
    ClipboardList
} from "lucide-react"
import * as Icons from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { IPCRForm } from "@/types/ipcr"
import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"
import {
    getPlansByIPCR,
    getDevelopmentPlanById
} from "@/app/actions/development-plan"
import { getIPCRFormById } from "@/app/actions/ipcr"
import { getIPCRAttachments, deleteIPCRAttachment } from "@/app/actions/ipcr-attachments"
import { AttachmentList } from "./attachment-list"
import { IPCRAttachment } from "@/types/ipcr-attachment"
import dynamic from "next/dynamic"

// Standard imports for icons to be safe
const {
    Eye: EyeIcon,
    Download: DownloadIcon,
    User: UserIcon,
    Building2: BuildingIcon,
    Calendar: CalendarIcon,
    CheckCircle2: CheckIcon,
    Clock: ClockIcon,
    Quote: QuoteIcon,
    ArrowRight: ArrowIcon,
    TrendingUp: ChartIcon,
    Plus: PlusIcon,
    ClipboardList: ListIcon
} = Icons

// Dynamic imports to avoid circular dependencies
const PlanViewDrawer = dynamic(() => import("@/components/development-plan/plan-view-drawer").then(m => m.PlanViewDrawer), { ssr: false })
const PlanFormDrawer = dynamic(() => import("@/components/development-plan/plan-form-drawer").then(m => m.PlanFormDrawer), { ssr: false })

interface IPCRViewDrawerProps {
    isOpen: boolean
    onClose: () => void
    form?: IPCRForm | null
    formId?: string
    profile?: any
}

export function IPCRViewDrawer({
    isOpen,
    onClose,
    form: initialForm,
    formId,
    profile
}: IPCRViewDrawerProps) {
    const [form, setForm] = useState<IPCRForm | null>(initialForm || null)
    const [plan, setPlan] = useState<any>(null)
    const [isPlanViewOpen, setIsPlanViewOpen] = useState(false)
    const [isPlanFormOpen, setIsPlanFormOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingPlan, setIsLoadingPlan] = useState(false)
    const [attachmentData, setAttachmentData] = useState<{
        formAttachments: IPCRAttachment[]
        outputAttachments: Record<string, IPCRAttachment[]>
    }>({
        formAttachments: [],
        outputAttachments: {}
    })

    // Fetch full form if only formId is provided or if initialForm is partial
    useEffect(() => {
        const fetchFullForm = async () => {
            const id = formId || initialForm?.id
            if (isOpen && id && (!form || !form.outputs)) {
                setIsLoading(true)
                try {
                    const res = await getIPCRFormById(id)
                    if (res.data) setForm(res.data)
                } catch (err) {
                    console.error("Error fetching full IPCR form:", err)
                } finally {
                    setIsLoading(false)
                }
            } else if (initialForm) {
                setForm(initialForm)
            }
        }
        fetchFullForm()
    }, [isOpen, formId, initialForm])

    useEffect(() => {
        const id = formId || initialForm?.id
        if (isOpen && id) {
            const fetchPlan = async () => {
                setIsLoadingPlan(true)
                try {
                    const res = await getPlansByIPCR(id)
                    if (res.data && res.data.length > 0) {
                        const fullPlanRes = await getDevelopmentPlanById(res.data[0].id)
                        setPlan(fullPlanRes.data)
                    } else {
                        setPlan(null)
                    }
                } catch (err) {
                    console.error("Error fetching plan in IPCR drawer:", err)
                } finally {
                    setIsLoadingPlan(false)
                }
            }
            fetchPlan()
        }

        // Fetch attachments
        if (isOpen && id) {
            getIPCRAttachments(id).then(setAttachmentData)
        }
    }, [isOpen, formId, initialForm?.id])

    const handleViewDrawerDelete = async (id: string) => {
        const result = await deleteIPCRAttachment(id)
        if (result.error) {
            toast.error(result.error)
            return
        }
        setAttachmentData(prev => ({
            formAttachments: prev.formAttachments.filter(a => a.id !== id),
            outputAttachments: Object.fromEntries(
                Object.entries(prev.outputAttachments).map(([k, v]) => [k, v.filter(a => a.id !== id)])
            )
        }))
        toast.success('File deleted')
    }

    if (!isOpen) return null

    const handleDownloadDOCX = () => {
        const id = formId || form?.id
        if (!id) return
        window.open(`/api/export/ipcr/${id}`, '_blank')
    }

    if (isLoading && !form) {
        return (
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="text-sm font-medium text-muted-foreground">Loading performance data...</p>
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    if (!form) return null

    const timelineSteps = [
        { status: 'draft', label: 'Draft Created', date: form.created_at },
        { status: 'submitted', label: 'Submitted', date: form.submitted_at },
        { status: 'reviewed', label: 'Reviewed', date: form.updated_at },
        { status: 'approved', label: 'Approved', date: form.approved_at },
        { status: 'finalized', label: 'Finalized', date: form.finalized_at }
    ]

    const currentStatusIndex = timelineSteps.findIndex(s => s.status === form.status)

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0">
                    <SheetHeader className="p-6 border-b shrink-0 bg-white/50 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <EyeIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <SheetTitle className="text-xl font-bold">IPCR View</SheetTitle>
                                    <SheetDescription>
                                        Full details of performance commitment
                                    </SheetDescription>
                                </div>
                            </div>
                            <StatusBadge status={form.status} />
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-8">

                                {/* Info Card */}
                                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Employee</span>
                                            <span className="text-sm font-semibold">{form.employee?.full_name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Division</span>
                                            <span className="text-sm font-semibold">{form.division?.code}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Rating Period</span>
                                            <span className="text-sm font-semibold">{form.rating_period?.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckIcon className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Final Rating</span>
                                            <span className="text-sm font-bold text-primary">{form.final_average_rating?.toFixed(2) || "N/A"} ({form.adjectival_rating || "N/A"})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Outputs Section */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        Performance Outputs
                                    </h3>
                                    <div className="space-y-3">
                                        {form.outputs?.map((o, idx) => (
                                            <div key={o.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[9px] h-4">{idx + 1}</Badge>
                                                            <span className="text-[10px] font-bold text-primary uppercase tracking-tight">{o.category?.replace('_', ' ')}</span>
                                                        </div>
                                                        <h4 className="text-sm font-bold leading-tight">{o.output_title}</h4>
                                                    </div>
                                                    <div className="text-center bg-primary/10 rounded-lg p-2 min-w-[50px] border border-primary/20">
                                                        <p className="text-[10px] text-primary/70 uppercase font-black">Rating</p>
                                                        <p className="text-sm font-black text-primary">
                                                            {o.average_rating ? o.average_rating.toFixed(2) : (o.rating_q && o.rating_e && o.rating_t ? ((o.rating_q + o.rating_e + o.rating_t) / 3).toFixed(2) : '—')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded-md border-l-2 border-primary/20 italic">
                                                    <span className="font-bold not-italic">Success Indicator:</span> {o.success_indicator}
                                                </div>
                                                <div className="grid grid-cols-4 gap-2 text-center py-2 border-y border-dashed border-border/60">
                                                    <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Q</p><p className="text-xs font-semibold">{o.rating_q || '—'}</p></div>
                                                    <div><p className="text-[9px] text-muted-foreground uppercase font-bold">E</p><p className="text-xs font-semibold">{o.rating_e || '—'}</p></div>
                                                    <div><p className="text-[9px] text-muted-foreground uppercase font-bold">T</p><p className="text-xs font-semibold">{o.rating_t || '—'}</p></div>
                                                    <div><p className="text-[9px] text-muted-foreground uppercase font-bold">Score</p><p className="text-xs font-bold text-primary">{o.average_rating?.toFixed(2) || '—'}</p></div>
                                                </div>
                                                {o.actual_accomplishments && (
                                                    <div className="text-xs space-y-1">
                                                        <p className="font-bold flex items-center gap-1 text-slate-700 underline decoration-primary/30 underline-offset-2">
                                                            Actual Accomplishments:
                                                        </p>
                                                        <p className="text-muted-foreground leading-relaxed pl-2 border-l border-border">{o.actual_accomplishments}</p>
                                                    </div>
                                                )}

                                                {/* Output Attachments */}
                                                {attachmentData.outputAttachments[o.id]?.length > 0 && (
                                                    <details className="group mt-2">
                                                        <summary className="flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                                            <div className="flex items-center gap-1">
                                                                <Icons.Paperclip className="w-3 h-3" />
                                                                {attachmentData.outputAttachments[o.id].length} attached file(s)
                                                            </div>
                                                            <Icons.ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                                                        </summary>
                                                        <div className="pt-2 pl-2">
                                                            <AttachmentList
                                                                attachments={attachmentData.outputAttachments[o.id]}
                                                                ipcr_form_id={form.id}
                                                                ipcr_status={form.status}
                                                                canDelete={profile?.role === 'admin_staff' || profile?.id === form.employee_id}
                                                                currentUserId={profile?.id}
                                                                onDelete={handleViewDrawerDelete}
                                                            />
                                                        </div>
                                                    </details>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Assessment Section */}
                                {(form.comments_recommendations || form.final_average_rating) && (
                                    <section className="space-y-4">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            Final Assessment & Remarks
                                        </h3>
                                        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4 relative overflow-hidden group">
                                            <QuoteIcon className="absolute -top-2 -left-2 h-12 w-12 opacity-5 text-primary" />
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-black text-primary tracking-widest">Final Average</span>
                                                    <span className="text-4xl font-black text-slate-800">{form.final_average_rating?.toFixed(2) || "0.00"}</span>
                                                </div>
                                                <Badge className={cn(
                                                    "px-5 py-1 text-[10px] h-7 font-black uppercase tracking-widest shrink-0",
                                                    (form.final_average_rating || 0) >= 4.5 ? "bg-green-600" :
                                                        (form.final_average_rating || 0) >= 3.5 ? "bg-blue-600" :
                                                            (form.final_average_rating || 0) >= 2.5 ? "bg-amber-600" :
                                                                "bg-red-600"
                                                )}>
                                                    {form.adjectival_rating || "N/A"}
                                                </Badge>
                                            </div>
                                            <Separator />
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Comments & Recommendations</span>
                                                <p className="text-sm text-slate-600 italic leading-relaxed">
                                                    "{form.comments_recommendations || "No comments provided."}"
                                                </p>
                                            </div>
                                            <div className="pt-2 flex flex-col gap-1">
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="font-medium text-muted-foreground uppercase">Reviewed by:</span>
                                                    <span className="font-bold">{form.reviewed_by || '—'}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="font-medium text-muted-foreground uppercase">Approved by:</span>
                                                    <span className="font-bold">{form.approved_by || '—'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* Development Plan Section */}
                                {(form.status === 'finalized' || form.status === 'approved' || plan) && (
                                    <section className="space-y-4 pt-4 border-t border-dashed">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                            <ListIcon className="h-4 w-4" /> Professional Development Plan
                                        </h3>

                                        {isLoadingPlan ? (
                                            <div className="h-20 bg-slate-50 animate-pulse rounded-xl" />
                                        ) : plan ? (
                                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Badge className="bg-indigo-600 text-[10px] uppercase font-bold">Plan Active</Badge>
                                                    <span className="text-[10px] text-indigo-400 font-mono">#{plan.id.split('-')[0].toUpperCase()}</span>
                                                </div>
                                                <p className="text-xs font-semibold text-slate-700 line-clamp-2">"{plan.aim}"</p>
                                                <div className="flex items-center justify-between pt-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <CalendarIcon className="h-3 w-3 text-slate-400" />
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Target: {plan.target_date ? format(new Date(plan.target_date), "MMM d, yyyy") : "N/A"}</span>
                                                    </div>
                                                    <Button
                                                        size="sm" variant="ghost"
                                                        className="h-7 text-indigo-600 hover:text-indigo-700 hover:bg-white text-[10px] font-bold gap-1 p-0 px-2"
                                                        onClick={() => setIsPlanViewOpen(true)}
                                                    >
                                                        View Full Plan <ArrowIcon className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3">
                                                <div className="bg-white p-3 rounded-full w-fit mx-auto shadow-sm border border-slate-100">
                                                    <ChartIcon className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-bold text-slate-600">No Development Plan Yet</p>
                                                    <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">
                                                        Create a Professional Development Plan based on these performance results.
                                                    </p>
                                                </div>
                                                {['division_chief', 'head_of_office', 'admin_staff'].includes(profile?.role) && (
                                                    <Button
                                                        size="sm" variant="outline"
                                                        className="h-8 gap-2 bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                                                        onClick={() => setIsPlanFormOpen(true)}
                                                    >
                                                        <PlusIcon className="h-3.5 w-3.5" /> Create Plan
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </section>
                                )}

                                {/* Form Level Attachments */}
                                {attachmentData.formAttachments.length > 0 && (
                                    <section className="space-y-4 pt-4 border-t border-dashed">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Icons.Paperclip className="w-4 h-4 text-primary" />
                                            Supporting Documents
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                                {attachmentData.formAttachments.length}
                                            </Badge>
                                        </h3>
                                        <AttachmentList
                                            attachments={attachmentData.formAttachments}
                                            ipcr_form_id={form.id}
                                            ipcr_status={form.status}
                                            canDelete={profile?.role === 'admin_staff' || profile?.id === form.employee_id}
                                            currentUserId={profile?.id}
                                            onDelete={handleViewDrawerDelete}
                                            emptyMessage="No supporting documents attached"
                                        />
                                    </section>
                                )}

                                {/* Timeline Section */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        Processing Timeline
                                    </h3>
                                    <div className="space-y-3 pl-2">
                                        {timelineSteps.map((step, idx) => {
                                            const isCompleted = idx <= currentStatusIndex;
                                            const isCurrent = idx === currentStatusIndex;

                                            return (
                                                <div key={step.status} className="flex gap-4 relative">
                                                    {idx !== timelineSteps.length - 1 && (
                                                        <div className={cn(
                                                            "absolute border-l-2 left-[11px] top-[24px] h-[calc(100%-8px)] z-0",
                                                            idx < currentStatusIndex ? "border-primary" : "border-muted border-dashed"
                                                        )} />
                                                    )}
                                                    <div className={cn(
                                                        "h-6 w-6 rounded-full flex items-center justify-center z-10 shrink-0 mt-0.5",
                                                        isCompleted ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {isCompleted ? <CheckIcon className="h-3.5 w-3.5" /> : <ClockIcon className="h-3.5 w-3.5" />}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 pb-4">
                                                        <span className={cn(
                                                            "text-xs font-bold uppercase tracking-tight",
                                                            isCompleted ? "text-foreground" : "text-muted-foreground"
                                                        )}>
                                                            {step.label} {isCurrent && <Badge variant="secondary" className="ml-2 text-[9px] h-4 py-0">Current</Badge>}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {step.date ? format(new Date(step.date), "MMM d, yyyy hh:mm a") : 'Pending'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>

                            </div>
                        </ScrollArea>
                    </div>

                    <SheetFooter className="p-6 border-t bg-slate-50 shrink-0 gap-3">
                        <Button variant="outline" className="flex-1 h-11" onClick={onClose}>
                            Close View
                        </Button>
                        {form.status === 'finalized' && (
                            <Button
                                className="flex-1 h-11 shadow-lg shadow-primary/20 gap-2"
                                onClick={handleDownloadDOCX}
                            >
                                <DownloadIcon className="h-4 w-4" /> Download DOCX
                            </Button>
                        )}
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Integration Drawers */}
            {plan && (
                <PlanViewDrawer
                    isOpen={isPlanViewOpen}
                    onClose={() => setIsPlanViewOpen(false)}
                    plan={plan}
                    profile={profile}
                />
            )}

            <PlanFormDrawer
                isOpen={isPlanFormOpen}
                onClose={() => setIsPlanFormOpen(false)}
                profile={profile}
                ratingPeriods={[]}
            />
        </>
    )
}
