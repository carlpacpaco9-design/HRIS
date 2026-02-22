'use client'

import { useState } from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Calendar,
    CheckCircle2,
    AlertCircle,
    PencilLine,
    ClipboardList,
    Eye,
    TrendingUp,
    CheckCircle,
    User,
    Building2,
    History,
    Download
} from "lucide-react"
import { format, isPast } from "date-fns"
import { DevelopmentPlan } from "@/types/development-plan"
import { cn } from "@/lib/utils"
import { IPCRViewDrawer } from "@/components/ipcr/ipcr-view-drawer"

interface PlanViewDrawerProps {
    isOpen: boolean
    onClose: () => void
    plan: DevelopmentPlan | null
    onEdit?: () => void
    onAchieve?: () => void
    profile: any
}

export function PlanViewDrawer({
    isOpen,
    onClose,
    plan,
    onEdit,
    onAchieve,
    profile
}: PlanViewDrawerProps) {
    const [ipcrViewOpen, setIpcrViewOpen] = useState(false)

    if (!plan) return null

    const handleExportDOCX = () => {
        window.open(`/api/export/development-plan/${plan.id}`, '_blank')
    }

    const isSupervisor = ['head_of_office', 'division_chief', 'admin_staff'].includes(profile.role)
    const canEdit = isSupervisor && ['active', 'in_progress'].includes(plan.status)
    const canAchieve = isSupervisor && ['active', 'in_progress'].includes(plan.status)

    const renderStatusBadge = (status: string) => {
        const variants: Record<string, { bg: string, text: string, label: string }> = {
            'active': { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Active' },
            'in_progress': { bg: 'bg-amber-100', text: 'text-amber-600', label: 'In Progress' },
            'achieved': { bg: 'bg-green-100', text: 'text-green-600', label: 'Achieved' },
            'cancelled': { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Cancelled' }
        }
        const v = variants[status] || variants.active
        return <Badge className={cn("border-none", v.bg, v.text)}>{v.label}</Badge>
    }

    const milestones = [
        { label: "Plan Date", date: plan.plan_date, icon: Calendar },
        { label: "Review Date", date: plan.review_date, icon: History },
        { label: "Target Date", date: plan.target_date, icon: TrendingUp },
        { label: "Achieved Date", date: plan.achieved_date, icon: CheckCircle2, hideIfEmpty: true },
    ]

    return (
        <>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0 overflow-hidden">
                    <SheetHeader className="px-6 py-4 border-b shrink-0 bg-background">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 p-2 rounded-lg">
                                    <ClipboardList className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <SheetTitle>Professional Development Plan</SheetTitle>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="text-sm font-medium text-slate-700">{plan.employee?.full_name}</span>
                                        {renderStatusBadge(plan.status)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
                        <div className="space-y-8">

                            {/* Annex K Header Card */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Annex K Summary</span>
                                    <span className="text-[10px] text-slate-400 font-mono italic">#{plan.id.split('-')[0].toUpperCase()}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Calendar className="h-3 w-3" />
                                            <span className="text-[10px] uppercase font-bold tracking-tight">Plan Date</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">{format(new Date(plan.plan_date), "MMMM d, yyyy")}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Building2 className="h-3 w-3" />
                                            <span className="text-[10px] uppercase font-bold tracking-tight">Division/Office</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">{plan.division?.name || "—"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <User className="h-3 w-3" />
                                            <span className="text-[10px] uppercase font-bold tracking-tight">Prepared By</span>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {plan.created_by_profile?.full_name}
                                            <span className="ml-1 text-[10px] text-muted-foreground uppercase font-normal">({plan.created_by_profile?.role?.replace('_', ' ')})</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Linked IPCR Card */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Linked Performance Review</h3>
                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between group">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-800">{plan.rating_period?.name}</p>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-white text-[10px] uppercase font-bold border-indigo-200">
                                                {plan.ipcr_form?.adjectival_rating || "N/A"}
                                            </Badge>
                                            <span className="text-xs text-indigo-600 font-semibold tabular-nums">{plan.ipcr_form?.final_average_rating || "—"} Final Rating</span>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 gap-2" onClick={() => setIpcrViewOpen(true)}>
                                        <Eye className="h-4 w-4" /> View IPCR
                                    </Button>
                                </div>
                            </div>

                            {/* Goals Section */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Plan Aim</h3>
                                    <div className="bg-white border rounded-xl p-4 text-slate-700 leading-relaxed text-sm">
                                        {plan.aim}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Specific Objective</h3>
                                    <div className="bg-white border rounded-xl p-4 text-slate-700 leading-relaxed text-sm">
                                        {plan.objective}
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Timeline & Milestones</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1">
                                    {milestones.filter(m => !m.hideIfEmpty || m.date).map((m, i) => {
                                        const isOverdue = m.label === 'Target Date' && m.date && isPast(new Date(m.date)) && !plan.achieved_date && ['active', 'in_progress'].includes(plan.status)
                                        const isPastM = m.date && isPast(new Date(m.date))

                                        return (
                                            <div key={i} className="space-y-2">
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <m.icon className="h-3.5 w-3.5 text-slate-500" />
                                                    <span className="text-[10px] uppercase font-bold tracking-tighter">{m.label}</span>
                                                </div>
                                                <div className={cn(
                                                    "p-2 rounded-lg border text-center transition-colors",
                                                    isOverdue ? "bg-red-50 border-red-200" :
                                                        (m.label === 'Achieved Date' && m.date) ? "bg-green-50 border-green-200" :
                                                            "bg-white border-slate-100"
                                                )}>
                                                    <div className={cn(
                                                        "text-[11px] font-bold tabular-nums whitespace-nowrap uppercase tracking-tighter",
                                                        isOverdue ? "text-red-600" :
                                                            (m.label === 'Achieved Date' && m.date) ? "text-green-600" :
                                                                "text-slate-600"
                                                    )}>
                                                        {m.date ? format(new Date(m.date), "MMM d, yyyy") : "Not Set"}
                                                    </div>
                                                    {isOverdue && <AlertCircle className="h-3 w-3 text-red-500 mx-auto mt-1" />}
                                                    {(m.label === 'Achieved Date' && m.date) && <CheckCircle className="h-3 w-3 text-green-500 mx-auto mt-1" />}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Tasks Section */}
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Development Tasks</h3>
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 font-bold">{plan.tasks?.length || 0} Tasks</Badge>
                                </div>

                                <div className="space-y-4">
                                    {plan.tasks?.sort((a, b) => a.sort_order - b.sort_order).map((task, idx) => (
                                        <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm group hover:border-indigo-200 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1 space-y-3">
                                                    <p className="font-semibold text-slate-800 leading-snug">{task.task_description}</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Next Step</span>
                                                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg min-h-[32px]">{task.next_step || "—"}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Outcome</span>
                                                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg min-h-[32px]">{task.outcome || "—"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!plan.tasks || plan.tasks.length === 0) && (
                                        <p className="text-center py-8 text-sm text-muted-foreground italic">No tasks defined for this plan</p>
                                    )}
                                </div>
                            </div>

                            {/* Comments Section */}
                            {plan.comments && (
                                <div className="space-y-2 pt-4 border-t">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1 font-bold">Additional Notes</h3>
                                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed italic">
                                        {plan.comments}
                                    </div>
                                </div>
                            )}

                            {/* Processing Info */}
                            <div className="pt-8 flex flex-col items-center gap-1 text-center">
                                <p className="text-[10px] text-slate-400">Created by {plan.created_by_profile?.full_name} on {format(new Date(plan.created_at), "MMMM d, yyyy")}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">SPMS Form Annex K — Professional Development Plan</p>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="px-6 py-4 border-t bg-background shrink-0">
                        <div className="flex flex-col sm:flex-row items-center justify-between w-full mt-0 gap-4">
                            <Button variant="ghost" onClick={onClose}>Close</Button>
                            <div className="flex items-center gap-3">
                                {canEdit && (
                                    <Button variant="outline" className="gap-2" onClick={onEdit}>
                                        <PencilLine className="h-4 w-4" /> Edit Plan
                                    </Button>
                                )}
                                {canAchieve && (
                                    <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={onAchieve}>
                                        <CheckCircle2 className="h-4 w-4" /> Mark Achieved
                                    </Button>
                                )}
                                <Button variant="outline" className="gap-2" onClick={handleExportDOCX}>
                                    <Download className="h-4 w-4" /> Export DOCX
                                </Button>
                            </div>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {plan.ipcr_form_id && (
                <IPCRViewDrawer
                    isOpen={ipcrViewOpen}
                    onClose={() => setIpcrViewOpen(false)}
                    form={(plan.ipcr_form as any) || null}
                    formId={plan.ipcr_form_id}
                    profile={profile}
                />
            )}
        </>
    )
}
