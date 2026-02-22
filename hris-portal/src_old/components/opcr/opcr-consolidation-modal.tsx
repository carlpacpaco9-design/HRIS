'use client'

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    FileBarChart,
    Download,
    Users,
    Building2,
    CheckCircle,
    Info,
    AlertTriangle,
    TrendingUp,
    PieChart,
    LayoutDashboard
} from "lucide-react"
import { getOPCRConsolidationReport } from "@/app/actions/opcr"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface OPCRConsolidationModalProps {
    isOpen: boolean
    onClose: () => void
    activePeriod: any
}

export function OPCRConsolidationModal({
    isOpen,
    onClose,
    activePeriod
}: OPCRConsolidationModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [reportData, setReportData] = useState<any>(null)

    useEffect(() => {
        if (isOpen && activePeriod) {
            fetchReport(activePeriod.id)
        }
    }, [isOpen, activePeriod])

    async function fetchReport(periodId: string) {
        setIsLoading(true)
        try {
            const res = await getOPCRConsolidationReport(periodId)
            if (res.error) throw new Error(res.error)
            setReportData(res.data)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const opcrRating = Number(reportData?.opcr?.office_final_rating) || 0
    const ipcrAvgRating = Number(reportData?.total_ipcr_avg) || 0
    const isViolation = ipcrAvgRating > opcrRating && opcrRating > 0

    const handleExport = (type: string) => {
        toast.info(`${type} export coming in Phase 14`)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b shrink-0 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-xl">
                            <FileBarChart className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight">OPCR Consolidation Report</DialogTitle>
                            <DialogDescription className="text-xs font-bold uppercase text-muted-foreground tracking-widest mt-0.5">
                                Provincial Assessor's Office · {activePeriod?.name}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden bg-slate-50/20">
                    <ScrollArea className="h-full">
                        <div className="p-8 space-y-10">

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:border-primary/20 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-primary/5 p-2 rounded-lg">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter h-5">Office Score</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-4xl font-black tracking-tighter text-foreground">{opcrRating > 0 ? opcrRating.toFixed(2) : "N/A"}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Office Average Rating</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:border-blue-500/20 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                            <Users className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter h-5">Individual Avg</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-4xl font-black tracking-tighter text-foreground">{ipcrAvgRating > 0 ? ipcrAvgRating.toFixed(2) : "0.00"}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global IPCR Average</p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:border-purple-500/20 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-purple-50 p-2 rounded-lg">
                                            <PieChart className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter h-5">Departments</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-4xl font-black tracking-tighter text-foreground">{reportData?.division_stats?.length || 0}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Divisions</p>
                                    </div>
                                </div>
                            </div>

                            {/* Alert Banner for CS Rules */}
                            {isViolation && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex gap-4 animate-in shake duration-500">
                                    <div className="bg-red-100 p-2.5 rounded-full shrink-0 h-fit">
                                        <AlertTriangle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-base font-black text-red-900 leading-tight">CSC SPMS Rule Violation Detected</h4>
                                        <p className="text-sm text-red-700 leading-relaxed font-medium">
                                            Average of all individual performance assessments ({ipcrAvgRating.toFixed(2)}) shall not go higher than the collective office performance assessment ({opcrRating.toFixed(2)}).
                                            <span className="block mt-1 font-bold">Action Required: Provincial Assessor and PMT must re-calibrate ratings.</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Category Breakdown */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <LayoutDashboard className="h-4 w-4" /> Category Performance Breakdown
                                </h4>
                                <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b">
                                            <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                <th className="px-6 py-4 text-left">Category</th>
                                                <th className="px-6 py-4 text-center">Avg Rating</th>
                                                <th className="px-6 py-4 text-center">Adjectival</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {[
                                                { label: "Strategic Priority", val: reportData?.opcr?.office_rating_q },
                                                { label: "Core Functions", val: reportData?.opcr?.office_rating_e },
                                                { label: "Support Functions", val: reportData?.opcr?.office_rating_t }
                                            ].map((cat, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-700">{cat.label}</td>
                                                    <td className="px-6 py-4 text-center font-black text-primary">{Number(cat.val || 0).toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant="secondary" className="text-[10px] font-bold">N/A</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Division Alignment Section */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Building2 className="h-4 w-4" /> Individual Performance Alignment (Annex E)
                                </h4>
                                <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b">
                                            <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                <th className="px-6 py-4 text-left">Division</th>
                                                <th className="px-6 py-4 text-center">Staff</th>
                                                <th className="px-6 py-4 text-center">Avg IPCR Rating</th>
                                                <th className="px-6 py-4 text-center">Adjectival</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {reportData?.division_stats?.map((stat: any, i: number) => (
                                                <tr key={stat.division_id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800">{stat.division_name}</span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">{stat.division_code}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-600">{stat.employee_count}</td>
                                                    <td className="px-6 py-4 text-center font-black text-primary">{stat.avg_rating}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge className={cn(
                                                            "text-[9px] font-bold h-5 px-1.5",
                                                            Number(stat.avg_rating) >= 4.5 ? "bg-green-600" :
                                                                Number(stat.avg_rating) >= 3.5 ? "bg-blue-600" :
                                                                    "bg-slate-600"
                                                        )}>
                                                            {stat.adjectival}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex items-center gap-2 p-4 bg-muted/40 rounded-xl border border-border/50 text-[10px] text-muted-foreground italic">
                                    <Info className="h-3.5 w-3.5 mb-0.5 shrink-0" />
                                    <p>Note: These ratings are consolidated from all submitted and approved individual IPCRs for the selected period.</p>
                                </div>
                            </div>

                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="p-6 border-t bg-white shrink-0 gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => handleExport("Excel")}>
                        <Download className="h-4 w-4 mr-2" /> Export Excel (Annex E)
                    </Button>
                    <Button className="flex-1 bg-slate-900 hover:bg-slate-800" onClick={() => handleExport("PDF")}>
                        <Download className="h-4 w-4 mr-2" /> Generate Full Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
