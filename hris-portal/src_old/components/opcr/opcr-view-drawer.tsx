'use client'

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/ui/status-badge"
import {
    Download,
    Printer,
    FileText,
    History,
    CheckCircle,
    User,
    Calendar,
    Award
} from "lucide-react"
import { OPCRForm, OPCROutput } from "@/types/opcr"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface OPCRViewDrawerProps {
    isOpen: boolean
    onClose: () => void
    form: OPCRForm | null
}

export function OPCRViewDrawer({
    isOpen,
    onClose,
    form
}: OPCRViewDrawerProps) {
    if (!form) return null

    const outputs = form.outputs || []
    const strategic = outputs.filter(o => o.category === 'strategic_priority')
    const core = outputs.filter(o => o.category === 'core_function')
    const support = outputs.filter(o => o.category === 'support_function')

    const formatDate = (date: string | undefined) => {
        if (!date) return "—"
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const handleExportDOCX = () => {
        if (!form.id) return
        window.open(`/api/export/opcr/${form.id}`, '_blank')
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="sm:max-w-4xl w-full flex flex-col p-0 overflow-hidden">
                <SheetHeader className="px-6 py-4 border-b shrink-0 bg-background">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg">
                                <FileText className="h-5 w-5 text-slate-600" />
                            </div>
                            <div>
                                <SheetTitle className="text-xl font-bold">Office Performance Review</SheetTitle>
                                <SheetDescription>{form.rating_period?.name}</SheetDescription>
                            </div>
                        </div>
                        <StatusBadge status={form.status} />
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50/30">
                    <div className="max-w-3xl mx-auto space-y-10 pb-6">

                        {/* Formal Header Card */}
                        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
                            <div className="text-center space-y-1 border-b pb-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Republic of the Philippines</h3>
                                <p className="font-bold text-sm tracking-tight text-foreground uppercase">Provincial Assessor's Office</p>
                                <p className="text-[10px] text-muted-foreground italic">CSC SPMS Annex A</p>
                            </div>
                            <div className="pt-2">
                                <p className="text-sm italic text-slate-600 leading-relaxed text-center px-4">
                                    I, <span className="font-bold uppercase text-slate-900 underline decoration-slate-300 underline-offset-4">{form.prepared_by_profile?.full_name}</span>, Provincial Assessor, commit to deliver and agree to be rated on the attainment of the following targets for the period <span className="font-semibold text-slate-800">{form.rating_period?.name}</span>.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-dashed">
                                <div className="flex flex-col items-center">
                                    <div className="h-10 flex items-end font-bold uppercase underline text-sm tracking-tight">
                                        {form.prepared_by_profile?.full_name}
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground mt-2">Provincial Assessor</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="h-10 flex items-end text-sm font-semibold text-slate-400">
                                        {formatDate(form.submitted_at)}
                                    </div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground mt-2">Date Submitted</span>
                                </div>
                            </div>
                        </div>

                        {/* Outputs Content */}
                        <div className="space-y-12">
                            {[
                                { title: "Strategic Priorities", data: strategic, color: "text-amber-600", bg: "bg-amber-50" },
                                { title: "Core Functions", data: core, color: "text-primary", bg: "bg-primary/5" },
                                { title: "Support Functions", data: support, color: "text-slate-600", bg: "bg-slate-100" }
                            ].map((sec, idx) => (
                                <div key={idx} className="space-y-4">
                                    <div className={cn("px-4 py-2 rounded-lg inline-flex items-center gap-2", sec.bg)}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full", sec.color.replace('text', 'bg'))} />
                                        <h4 className={cn("text-xs font-black uppercase tracking-widest", sec.color)}>{sec.title}</h4>
                                    </div>

                                    <div className="space-y-4">
                                        {sec.data.length > 0 ? sec.data.map((o, oIdx) => (
                                            <div key={o.id} className="bg-white rounded-xl border border-border p-5 space-y-4">
                                                <div className="flex justify-between gap-4">
                                                    <div className="space-y-1 flex-1">
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">MFO / PAP</span>
                                                        <p className="text-sm font-bold text-foreground leading-tight">{o.output_title}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter block mb-1">Budget</span>
                                                        <Badge variant="secondary" className="font-mono text-[10px]">₱{(Number(o.allotted_budget) || 0).toLocaleString()}</Badge>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Success Indicator / Target</span>
                                                    <p className="text-xs text-slate-600 leading-normal">{o.success_indicator}</p>
                                                </div>

                                                {o.actual_accomplishments && (
                                                    <div className="pt-4 border-t border-dashed grid grid-cols-1 md:grid-cols-4 gap-6">
                                                        <div className="md:col-span-3 space-y-1">
                                                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter flex items-center gap-1">
                                                                <CheckCircle className="h-3 w-3" /> Actual Accomplishment
                                                            </span>
                                                            <p className="text-xs text-slate-700 bg-blue-50/30 p-2 rounded-lg border border-blue-100/50 italic">
                                                                "{o.actual_accomplishments}"
                                                            </p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <span className="text-[9px] font-bold text-primary uppercase tracking-tighter block text-center">Score</span>
                                                            <div className="flex justify-between items-center text-[10px] border-b pb-1 px-1">
                                                                <span className="text-muted-foreground font-medium">Q-E-T</span>
                                                                <div className="flex gap-1.5 font-bold">
                                                                    <span>{Number(o.rating_q).toFixed(0)}</span>
                                                                    <span>{Number(o.rating_e).toFixed(0)}</span>
                                                                    <span>{Number(o.rating_t).toFixed(0)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-center font-black text-lg text-primary tracking-tighter">
                                                                {Number(o.average_rating).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )) : (
                                            <p className="text-xs text-muted-foreground italic px-4">No outputs listed in this category.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Final Assessment Summary */}
                        {form.office_final_rating && (
                            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 relative overflow-hidden group">
                                <Award className="absolute -bottom-6 -right-6 h-32 w-32 text-primary/5 -rotate-12" />
                                <div className="flex flex-col items-center justify-center text-center space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Final Performance Assessment</h4>
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-center">
                                            <span className="text-5xl font-black text-foreground tracking-tighter underline decoration-primary/30 underline-offset-8">
                                                {Number(form.office_final_rating).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="h-12 w-px bg-primary/20" />
                                        <div className="text-left">
                                            <Badge className="bg-primary hover:bg-primary px-4 py-1 text-[11px] h-7 font-bold">
                                                {form.adjectival_rating}
                                            </Badge>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-tight">Overall Adjectival Score</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Signatures */}
                                <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-primary/10">
                                    <div className="space-y-4 flex flex-col items-center">
                                        <div className="text-center">
                                            <p className="text-sm font-bold uppercase tracking-tight text-slate-800 underline decoration-slate-300 underline-offset-4">
                                                {form.reviewed_by_profile?.full_name || "NOT REVIEWED"}
                                            </p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">PMT Reviewer</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 flex flex-col items-center text-center">
                                        <div>
                                            <p className="text-sm font-bold uppercase tracking-tight text-slate-800 underline decoration-slate-300 underline-offset-4">
                                                {form.prepared_by_profile?.full_name}
                                            </p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Provincial Assessor</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="space-y-4 pt-10">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <History className="h-4 w-4" /> Processing Timeline
                            </h4>
                            <div className="space-y-4 border-l-2 border-slate-200 ml-2 pl-6">
                                <div className="relative">
                                    <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-slate-300 ring-4 ring-white" />
                                    <p className="text-xs font-bold">Created</p>
                                    <p className="text-[10px] text-muted-foreground">{formatDate(form.created_at)}</p>
                                </div>
                                {form.submitted_at && (
                                    <div className="relative">
                                        <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
                                        <p className="text-xs font-bold">Submitted for Review</p>
                                        <p className="text-[10px] text-muted-foreground">{formatDate(form.submitted_at)}</p>
                                    </div>
                                )}
                                {form.reviewed_by && (
                                    <div className="relative">
                                        <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-purple-500 ring-4 ring-white" />
                                        <p className="text-xs font-bold">PMT Validated</p>
                                        <p className="text-[10px] text-muted-foreground">Reviewed by PMT</p>
                                    </div>
                                )}
                                {form.status === 'finalized' && (
                                    <div className="relative">
                                        <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-green-500 ring-4 ring-white" />
                                        <p className="text-xs font-bold">Finalized & Archived</p>
                                        <p className="text-[10px] text-muted-foreground">{formatDate(form.approved_at)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="px-6 py-4 border-t shrink-0 bg-background">
                    <Button variant="outline" onClick={handleExportDOCX}>
                        <FileText className="h-4 w-4 mr-2" /> Export OPCR (DOCX)
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
