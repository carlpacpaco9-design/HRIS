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
    ClipboardCheck,
    CheckCircle,
    RotateCcw,
    Star,
    Trash2,
    Download
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"

import {
    IPCRForm,
    IPCRStatus,
    AdjectivalRating
} from "@/types/ipcr"

import { IPCRFormDrawer } from "./ipcr-form-drawer"
import { IPCRReviewDrawer } from "./ipcr-review-drawer"
import { IPCRApprovalDrawer } from "./ipcr-approval-drawer"
import { IPCRViewDrawer } from "./ipcr-view-drawer"
import { IPCRSummaryModal } from "./ipcr-summary-modal"

interface IPCRPageClientProps {
    initialProfile: any
    initialForms: IPCRForm[]
    activePeriod: any
}

export function IPCRPageClient({
    initialProfile,
    initialForms,
    activePeriod
}: IPCRPageClientProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<string>("all")

    // States for Modals/Drawers
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isReviewOpen, setIsReviewOpen] = useState(false)
    const [isApprovalOpen, setIsApprovalOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [isSummaryOpen, setIsSummaryOpen] = useState(false)

    const [selectedForm, setSelectedForm] = useState<IPCRForm | null>(null)

    const role = initialProfile.role
    const isEmployee = role === 'project_staff'
    const isChief = role === 'division_chief'
    const isHead = role === 'head_of_office'
    const isAdmin = role === 'admin_staff'
    const isPMT = role === 'admin_staff'

    // ── Stats Logic ────────────────────────────────────

    const stats = useMemo(() => {
        const counts = {
            draft: 0,
            submitted: 0,
            reviewed: 0,
            approved: 0,
            finalized: 0
        }
        initialForms.forEach(f => {
            if (f.status in counts) {
                counts[f.status as keyof typeof counts]++
            }
        })
        return counts
    }, [initialForms])

    const filteredData = useMemo(() => {
        if (activeTab === "all") return initialForms
        return initialForms.filter(f => f.status === activeTab)
    }, [initialForms, activeTab])

    // ── Column Definitions ──────────────────────────────

    const columns: ColumnDef<IPCRForm>[] = useMemo(() => {
        const baseColumns: ColumnDef<IPCRForm>[] = []

        // 1. Employee Info col
        if (!isEmployee) {
            baseColumns.push({
                accessorKey: "employee",
                header: "Project Staff",
                cell: ({ row }) => {
                    const employee = row.original.employee
                    const division = row.original.division
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={employee?.avatar_url} />
                                <AvatarFallback>{employee?.full_name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-medium">{employee?.full_name || "Unknown"}</span>
                                {isAdmin || isPMT || isHead ? (
                                    <Badge variant="outline" className="w-fit text-[10px] h-4">
                                        {division?.code || "N/A"}
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                    )
                }
            })
        }

        // 2. Rating Period
        baseColumns.push({
            accessorKey: "rating_period",
            header: "Rating Period",
            cell: ({ row }) => row.original.rating_period?.name || "N/A"
        })

        // 3. No. of Outputs (for Employee) / Date Submitted
        if (isEmployee) {
            baseColumns.push({
                accessorKey: "outputs",
                header: "Outputs",
                cell: ({ row }) => row.original.outputs?.length || 0
            })
        } else {
            baseColumns.push({
                accessorKey: "submitted_at",
                header: "Date Submitted",
                cell: ({ row }) => row.original.submitted_at
                    ? new Date(row.original.submitted_at).toLocaleDateString()
                    : "—"
            })
        }

        // 4. Final Rating
        baseColumns.push({
            accessorKey: "final_average_rating",
            header: "Final Rating",
            cell: ({ row }) => {
                const rating = row.original.final_average_rating
                const adj = row.original.adjectival_rating
                if (!rating) return "—"
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-primary">{rating.toFixed(2)}</span>
                        <span className="text-[10px] text-muted-foreground">{adj}</span>
                    </div>
                )
            }
        })

        // 5. Status
        baseColumns.push({
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />
        })

        // 6. Actions
        baseColumns.push({
            id: "actions",
            cell: ({ row }) => {
                const form = row.original
                const status = form.status

                const handleAction = (action: string) => {
                    setSelectedForm(form)
                    if (action === 'edit') setIsFormOpen(true)
                    if (action === 'view') setIsViewOpen(true)
                    if (action === 'review') setIsReviewOpen(true)
                    if (action === 'approve') setIsApprovalOpen(true)
                }

                return (
                    <div className="flex items-center gap-2">
                        {isEmployee && (status === 'draft' || status === 'returned') && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleAction('edit')}>
                                <PencilLine className="h-4 w-4" />
                            </Button>
                        )}

                        {(status === 'finalized' || !isEmployee) && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleAction('view')}>
                                <Eye className="h-4 w-4" />
                            </Button>
                        )}

                        {isChief && status === 'submitted' && (
                            <Button size="sm" variant="secondary" className="gap-2" onClick={() => handleAction('review')}>
                                <ClipboardCheck className="h-4 w-4" /> Review
                            </Button>
                        )}

                        {isHead && status === 'reviewed' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-2" onClick={() => handleAction('approve')}>
                                <CheckCircle className="h-4 w-4" /> Approve
                            </Button>
                        )}

                        {isAdmin && status !== 'finalized' && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => {/* handle delete */ }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )
            }
        })

        return baseColumns
    }, [isEmployee, isChief, isHead, isAdmin, isPMT])

    // ── Render ─────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* 1. Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isEmployee ? "My IPCR" : isChief ? "Division IPCR" : "IPCR Management"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isChief
                            ? "Review your division's performance commitments"
                            : `Individual Performance Commitment and Review — ${activePeriod?.name || "No Active Period"}`}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {(isAdmin || isHead || isPMT) && (
                        <Button variant="outline" className="gap-2" onClick={() => setIsSummaryOpen(true)}>
                            <FileBarChart className="h-4 w-4" /> Generate Report
                        </Button>
                    )}

                    {isEmployee && (
                        <div className="flex items-center gap-3">
                            {!activePeriod && (
                                <span className="text-amber-600 text-sm font-medium bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
                                    No active SPMS cycle. Contact Administrative Division.
                                </span>
                            )}
                            {initialForms.some(f =>
                                f.rating_period_id === activePeriod?.id &&
                                (f.status === 'submitted' || f.status === 'draft' || f.status === 'reviewed')
                            ) ? (
                                <Button
                                    variant="outline"
                                    className="gap-2 text-blue-600 hover:bg-blue-50"
                                    onClick={() => {
                                        const form = initialForms.find(f => f.rating_period_id === activePeriod?.id && (f.status === 'submitted' || f.status === 'draft' || f.status === 'reviewed'))
                                        if (form) {
                                            setSelectedForm(form)
                                            setIsFormOpen(true)
                                        }
                                    }}
                                >
                                    You already have an IPCR for this period. Edit existing?
                                </Button>
                            ) : (
                                <Button
                                    className="gap-2"
                                    onClick={() => {
                                        setSelectedForm(null)
                                        setIsFormOpen(true)
                                    }}
                                    disabled={!activePeriod}
                                >
                                    <Plus className="h-4 w-4" /> Create IPCR
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {Object.entries(stats).map(([status, count]) => (
                    <div key={status} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-2xl font-bold text-foreground">{count}</p>
                            <p className="text-xs text-muted-foreground capitalize font-medium">{status}</p>
                        </div>
                        <div className={cn(
                            "w-2 h-8 rounded-full",
                            status === 'draft' ? "bg-gray-300" :
                                status === 'submitted' ? "bg-blue-400" :
                                    status === 'reviewed' ? "bg-purple-400" :
                                        status === 'approved' ? "bg-green-400" :
                                            "bg-primary"
                        )} />
                    </div>
                ))}
            </div>

            {/* 3. Table Section */}
            <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="draft">Draft</TabsTrigger>
                    <TabsTrigger value="submitted">Submitted</TabsTrigger>
                    <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="finalized">Finalized</TabsTrigger>
                    <TabsTrigger value="returned">Returned</TabsTrigger>
                </TabsList>
                <div className="mt-4">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        searchKey={isEmployee ? undefined : "employee"}
                        searchPlaceholder="Search project staff name..."
                    />
                </div>
            </Tabs>

            {/* Drawers / Modals */}
            <IPCRFormDrawer
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setSelectedForm(null); router.refresh(); }}
                form={selectedForm}
                profile={initialProfile}
                activePeriod={activePeriod}
            />

            <IPCRReviewDrawer
                isOpen={isReviewOpen}
                onClose={() => { setIsReviewOpen(false); setSelectedForm(null); router.refresh(); }}
                form={selectedForm}
                profile={initialProfile}
            />

            <IPCRApprovalDrawer
                isOpen={isApprovalOpen}
                onClose={() => { setIsApprovalOpen(false); setSelectedForm(null); router.refresh(); }}
                form={selectedForm}
                profile={initialProfile}
            />

            <IPCRViewDrawer
                isOpen={isViewOpen}
                onClose={() => { setIsViewOpen(false); setSelectedForm(null); }}
                form={selectedForm}
            />

            <IPCRSummaryModal
                isOpen={isSummaryOpen}
                onClose={() => setIsSummaryOpen(false)}
                activePeriod={activePeriod}
            />

            <div className="text-center py-6 text-muted-foreground text-[10px] border-t border-dashed mt-10">
                SPMS Phase 7: IPCR Management Module · Build 2026.02.18
            </div>
        </div>
    )
}
