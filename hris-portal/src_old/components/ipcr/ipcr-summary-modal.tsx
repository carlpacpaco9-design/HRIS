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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
    FileBarChart,
    Download,
    Info,
    Users,
    Send,
    Clock,
    Star,
    FileSpreadsheet
} from "lucide-react"
import { getIPCRSummaryReport, getRatingPeriods } from "@/app/actions/ipcr"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface IPCRSummaryModalProps {
    isOpen: boolean
    onClose: () => void
    activePeriod: any
}

export function IPCRSummaryModal({
    isOpen,
    onClose,
    activePeriod
}: IPCRSummaryModalProps) {
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>(activePeriod?.id || "")
    const [periods, setPeriods] = useState<any[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            getRatingPeriods().then(res => {
                if (res.data) setPeriods(res.data)
            })
        }
    }, [isOpen])

    useEffect(() => {
        if (selectedPeriodId) {
            setIsLoading(true)
            getIPCRSummaryReport(selectedPeriodId).then(res => {
                if (res.data) setSummary(res.data)
                setIsLoading(false)
            })
        }
    }, [selectedPeriodId])

    const handleExport = () => {
        if (!selectedPeriodId) {
            toast.error('Please select a period first')
            return
        }
        const selectedPeriod = periods.find((p: any) => p.id === selectedPeriodId)
        const periodName = selectedPeriod?.name ?? 'Period'
        const url = `/api/export/ipcr-summary?period_id=${selectedPeriodId}&period_name=${encodeURIComponent(periodName)}`
        window.open(url, '_blank')
        toast.success('Export started — check your downloads')
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <FileBarChart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">IPCR Summary Report</DialogTitle>
                            <DialogDescription>
                                Consolidated performance metrics for the selected period
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-[200px]">
                        <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select Period" />
                            </SelectTrigger>
                            <SelectContent>
                                {periods.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-8">

                            {/* Stats Row */}
                            {summary && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: "Total Employees", value: summary.total_employees, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                                        { label: "Submitted IPCRs", value: summary.submitted, icon: Send, color: "text-green-600", bg: "bg-green-50" },
                                        { label: "Pending Drafts", value: summary.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                                        { label: "Average Rating", value: summary.average_rating.toFixed(2), icon: Star, color: "text-primary", bg: "bg-primary/5" }
                                    ].map((stat, i) => (
                                        <div key={i} className={cn("p-4 rounded-xl border border-border flex flex-col items-center text-center gap-1", stat.bg)}>
                                            <stat.icon className={cn("h-5 w-5 mb-1", stat.color)} />
                                            <span className="text-2xl font-black">{stat.value}</span>
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{stat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Division Breakdown */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    Division Breakdown
                                </h3>
                                <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Division / Office</TableHead>
                                                <TableHead className="text-center">Total</TableHead>
                                                <TableHead className="text-center">Submitted</TableHead>
                                                <TableHead className="text-center">Avg Rating</TableHead>
                                                <TableHead className="text-center">Adjectival</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {summary?.division_breakdown.map((div: any) => (
                                                <TableRow key={div.code}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-xs">{div.division}</span>
                                                            <span className="text-[10px] text-muted-foreground">{div.code}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium">{div.total}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-bold">{div.submitted}</span>
                                                            <div className="w-12 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                                                <div className="bg-green-500 h-full" style={{ width: `${(div.submitted / div.total) * 100}%` }} />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-black text-primary">{div.avg_rating}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="text-[9px] uppercase font-bold h-4">
                                                            {div.adjectival}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </section>

                            {/* Individual Ratings */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    Individual Ratings List
                                </h3>
                                <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Employee Name</TableHead>
                                                <TableHead className="text-center">Division</TableHead>
                                                <TableHead className="text-center">Rating</TableHead>
                                                <TableHead className="text-center">Adjectival</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {summary?.individual_ratings.map((row: any, i: number) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-medium text-blue-600">{row.employee}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="text-[10px]">{row.division}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center font-black">{row.rating?.toFixed(2) || '—'}</TableCell>
                                                    <TableCell className="text-center italic text-muted-foreground text-xs">{row.adjectival || '—'}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={cn(
                                                            "text-[10px] font-bold uppercase",
                                                            row.status === 'finalized' ? "text-primary" : "text-muted-foreground"
                                                        )}>{row.status}</span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </section>

                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="p-6 border-t bg-slate-50 gap-3">
                    <Button variant="outline" onClick={onClose}>Close Report</Button>
                    <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={handleExport}>
                        <FileSpreadsheet className="h-4 w-4" /> Export to Excel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
