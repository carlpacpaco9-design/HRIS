'use client'

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    FileBarChart,
    Search,
    Filter,
    MoreHorizontal,
    PencilLine,
    Eye,
    CheckCircle,
    RotateCcw,
    LayoutGrid,
    AlertTriangle,
    History,
    FileText,
    Download
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"

import {
    OPCRForm,
    OPCRStatus,
    AdjectivalRating
} from "@/types/opcr"

import { OPCRFormDrawer } from "./opcr-form-drawer"
import { OPCRViewDrawer } from "./opcr-view-drawer"
import { OPCRConsolidationModal } from "./opcr-consolidation-modal"

interface OPCRPageClientProps {
    profile: any
    initialForms: OPCRForm[]
    activeOPCR: OPCRForm | null
    ratingPeriods: any[]
}

export function OPCRPageClient({
    profile,
    initialForms,
    activeOPCR,
    ratingPeriods
}: OPCRPageClientProps) {
    const router = useRouter()
    const [periodFilter, setPeriodFilter] = useState<string>("all")

    // States for Modals/Drawers
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [isConsolidationOpen, setIsConsolidationOpen] = useState(false)
    const [selectedForm, setSelectedForm] = useState<OPCRForm | null>(null)

    const role = profile.role
    const isHead = role === 'head_of_office'
    const isAdmin = role === 'admin_staff'
    const isPMT = role === 'admin_staff'
    const isChief = role === 'division_chief'

    const activePeriod = ratingPeriods.find(p => p.status === 'active')

    // ── Table Logic ────────────────────────────────────

    const filteredForms = useMemo(() => {
        if (periodFilter === "all") return initialForms
        return initialForms.filter(f => f.rating_period_id === periodFilter)
    }, [initialForms, periodFilter])

    const columns: ColumnDef<OPCRForm>[] = useMemo(() => [
        {
            accessorKey: "rating_period",
            header: "Rating Period",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.rating_period?.name || "N/A"}</span>
                    <Badge variant="secondary" className="w-fit text-[10px] h-4 mt-0.5">
                        FY {new Date(row.original.rating_period?.period_from || "").getFullYear()}
                    </Badge>
                </div>
            )
        },
        {
            accessorKey: "submitted_at",
            header: "Date Submitted",
            cell: ({ row }) => row.original.submitted_at
                ? new Date(row.original.submitted_at).toLocaleDateString()
                : "—"
        },
        {
            accessorKey: "reviewed_by",
            header: "Reviewed By",
            cell: ({ row }) => row.original.reviewed_by_profile?.full_name || "—"
        },
        {
            accessorKey: "office_final_rating",
            header: "Final Rating",
            cell: ({ row }) => {
                const rating = row.original.office_final_rating
                if (!rating) return "—"
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-primary">{Number(rating).toFixed(2)}</span>
                        <span className="text-[10px] text-muted-foreground">{row.original.adjectival_rating}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const form = row.original
                const canEdit = (isHead || isAdmin) && (form.status === 'draft' || form.status === 'returned')

                return (
                    <div className="flex items-center gap-2">
                        {canEdit ? (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedForm(form); setIsFormOpen(true); }}>
                                <PencilLine className="h-4 w-4" />
                            </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedForm(form); setIsViewOpen(true); }}>
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                )
            }
        }
    ], [isHead, isAdmin])

    // ── Render ─────────────────────────────────────────

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft': return <FileText className="h-6 w-6 text-gray-500" />
            case 'submitted': return <History className="h-6 w-6 text-blue-500" />
            case 'reviewed': return <CheckCircle className="h-6 w-6 text-purple-500" />
            case 'finalized': return <LayoutGrid className="h-6 w-6 text-green-600" />
            case 'returned': return <RotateCcw className="h-6 w-6 text-amber-500" />
            default: return <FileText className="h-6 w-6 text-gray-500" />
        }
    }

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100'
            case 'submitted': return 'bg-blue-100'
            case 'reviewed': return 'bg-purple-100'
            case 'finalized': return 'bg-green-100'
            case 'returned': return 'bg-amber-100'
            default: return 'bg-gray-100'
        }
    }

    return (
        <div className="space-y-6">
            {/* 1. Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isPMT ? "OPCR Review" : isHead ? "Office Performance Commitment & Review" : "OPCR Management"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isPMT ? "Validate and rate office performance commitments" : "Individual Performance Commitment and Review records"}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {(isPMT || isAdmin) && (
                        <Button variant="outline" className="gap-2" onClick={() => setIsConsolidationOpen(true)}>
                            <FileBarChart className="h-4 w-4" /> Consolidation Report
                        </Button>
                    )}

                    {(isHead || isAdmin) && !activeOPCR && activePeriod && (
                        <Button className="gap-2" onClick={() => { setSelectedForm(null); setIsFormOpen(true); }}>
                            <Plus className="h-4 w-4" /> Create OPCR
                        </Button>
                    )}

                    {(isHead || isAdmin) && activeOPCR && activePeriod && (activeOPCR.status === 'draft' || activeOPCR.status === 'returned') && (
                        <Button className="gap-2" onClick={() => { setSelectedForm(activeOPCR); setIsFormOpen(true); }}>
                            <PencilLine className="h-4 w-4" /> Edit OPCR
                        </Button>
                    )}
                </div>
            </div>

            {/* 2. Active Status Banner */}
            {activeOPCR ? (
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center transition-colors",
                            getStatusBg(activeOPCR.status)
                        )}>
                            {getStatusIcon(activeOPCR.status)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-lg text-foreground tracking-tight">
                                    {activeOPCR.rating_period?.name}
                                </p>
                                <Badge variant="outline" className="text-[10px] h-5">Current Period</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Status:</span>
                                <StatusBadge status={activeOPCR.status} />
                            </div>
                            {activeOPCR.office_final_rating && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Office Rating:</span>
                                    <span className="text-sm font-bold text-primary">
                                        {Number(activeOPCR.office_final_rating).toFixed(2)} ({activeOPCR.adjectival_rating})
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="h-9 px-4" onClick={() => { setSelectedForm(activeOPCR); setIsViewOpen(true); }}>
                            View Details
                        </Button>
                        {(isPMT || isAdmin) && activeOPCR.status === 'submitted' && (
                            <Button size="sm" className="h-9 px-4 bg-purple-600 hover:bg-purple-700" onClick={() => { setSelectedForm(activeOPCR); setIsFormOpen(true); }}>
                                Review & Rate
                            </Button>
                        )}
                        {isHead && activeOPCR.status === 'reviewed' && (
                            <Button size="sm" className="h-9 px-4 bg-green-600 hover:bg-green-700" onClick={() => { setSelectedForm(activeOPCR); setIsFormOpen(true); }}>
                                Finalize OPCR
                            </Button>
                        )}
                    </div>
                </div>
            ) : activePeriod && (isHead || isAdmin) ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-amber-100 p-2.5 rounded-full shrink-0">
                        <AlertTriangle className="text-amber-600 h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-base font-bold text-amber-900 leading-tight">
                            No OPCR for {activePeriod.name}
                        </p>
                        <p className="text-sm text-amber-700 mt-0.5">
                            Create the office performance commitment for the current rating period.
                        </p>
                    </div>
                    <Button onClick={() => { setSelectedForm(null); setIsFormOpen(true); }} className="ml-auto bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20">
                        Create OPCR Now
                    </Button>
                </div>
            ) : null}

            {/* 3. History Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg font-bold">OPCR History</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={periodFilter} onValueChange={setPeriodFilter}>
                            <SelectTrigger className="w-[200px] h-9">
                                <SelectValue placeholder="All Periods" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Periods</SelectItem>
                                {ratingPeriods.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-border overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={filteredForms}
                        isLoading={false}
                    />
                </div>
            </div>

            {/* Drawers & Modals */}
            {activePeriod && (
                <OPCRFormDrawer
                    isOpen={isFormOpen}
                    onClose={() => { setIsFormOpen(false); setSelectedForm(null); router.refresh(); }}
                    form={selectedForm}
                    profile={profile}
                    activePeriod={activePeriod}
                />
            )}

            <OPCRViewDrawer
                isOpen={isViewOpen}
                onClose={() => { setIsViewOpen(false); setSelectedForm(null); }}
                form={selectedForm}
            />

            {activePeriod && (
                <OPCRConsolidationModal
                    isOpen={isConsolidationOpen}
                    onClose={() => setIsConsolidationOpen(false)}
                    activePeriod={activePeriod}
                />
            )}
        </div>
    )
}
