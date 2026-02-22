'use client'

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    ClipboardList,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    Search,
    Filter,
    PencilLine,
    Eye,
    XCircle,
    MoreHorizontal,
    UserCircle,
    ArrowUpRight,
    Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { format, isPast } from "date-fns"
import { DevelopmentPlan, DevelopmentPlanStatus } from "@/types/development-plan"
import { PlanFormDrawer } from "./plan-form-drawer"
import { PlanViewDrawer } from "./plan-view-drawer"
import { AchieveDialog } from "./achieve-dialog"

interface DevelopmentPlanPageClientProps {
    profile: any
    initialPlans: any[]
    ratingPeriods: any[]
    activePeriod: any
}

export function DevelopmentPlanPageClient({
    profile,
    initialPlans,
    ratingPeriods,
    activePeriod
}: DevelopmentPlanPageClientProps) {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [selectedPeriodId, setSelectedPeriodId] = useState(activePeriod?.id || "all")
    const [selectedDivisionId, setSelectedDivisionId] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    // Drawer/Dialog states
    const [formDrawerOpen, setFormDrawerOpen] = useState(false)
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
    const [achieveDialogOpen, setAchieveDialogOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<DevelopmentPlan | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const role = profile.role
    const isChief = role === 'division_chief'
    const isHead = role === 'head_of_office'
    const isAdmin = role === 'admin_staff'
    const isPMT = role === 'admin_staff'
    const isEmployee = role === 'project_staff'

    // Filter Logic
    const filteredPlans = useMemo(() => {
        return initialPlans.filter(plan => {
            const matchesPeriod = selectedPeriodId === "all" || plan.rating_period_id === selectedPeriodId
            const matchesDivision = selectedDivisionId === "all" || plan.employee?.division_id === selectedDivisionId
            const matchesStatus = selectedStatus === "all" || plan.status === selectedStatus
            const matchesSearch = !searchQuery ||
                plan.employee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                plan.aim?.toLowerCase().includes(searchQuery.toLowerCase())

            return matchesPeriod && matchesDivision && matchesStatus && matchesSearch
        })
    }, [initialPlans, selectedPeriodId, selectedDivisionId, selectedStatus, searchQuery])

    // Stats
    const stats = useMemo(() => {
        const total = initialPlans.length
        const inProgress = initialPlans.filter(p => ['active', 'in_progress'].includes(p.status)).length
        const achieved = initialPlans.filter(p => p.status === 'achieved').length
        const overdue = initialPlans.filter(p =>
            ['active', 'in_progress'].includes(p.status) &&
            p.target_date &&
            isPast(new Date(p.target_date)) &&
            !p.achieved_date
        ).length

        return { total, inProgress, achieved, overdue }
    }, [initialPlans])

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

    const handleCreate = () => {
        setSelectedPlan(null)
        setFormDrawerOpen(true)
    }

    const handleEdit = (plan: DevelopmentPlan) => {
        setSelectedPlan(plan)
        setFormDrawerOpen(true)
    }

    const handleView = (plan: DevelopmentPlan) => {
        setSelectedPlan(plan)
        setViewDrawerOpen(true)
    }

    const handleAchieve = (plan: DevelopmentPlan) => {
        setSelectedPlan(plan)
        setAchieveDialogOpen(true)
    }

    // Unique divisions for filter (for head/admin/pmt)
    const divisions = useMemo(() => {
        const divs = new Map()
        initialPlans.forEach(p => {
            if (p.employee?.division_id && p.division) {
                divs.set(p.employee.division_id, p.division.name)
            }
        })
        return Array.from(divs.entries()).map(([id, name]) => ({ id, name }))
    }, [initialPlans])

    if (!mounted) return null

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {isHead || isAdmin ? "Professional Development Plans" :
                            isChief ? "Team Development Plans" :
                                isEmployee ? "My Development Plans" :
                                    "Development Plans Overview"}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {isHead || isAdmin ? "Annex K — Employee development planning and performance improvement" :
                            isChief ? `Manage development plans for ${profile.division?.name || "your division"} employees` :
                                isEmployee ? "Track your professional growth and development goals" :
                                    "Monitor employee development across all divisions"}
                    </p>
                </div>
                {(isChief || isHead || isAdmin) && (
                    <Button className="gap-2" onClick={handleCreate}>
                        <Plus className="h-4 w-4" /> Create Plan
                    </Button>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-indigo-50/50">
                    <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-600">Total Plans</CardTitle>
                        <ClipboardList className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                        <p className="text-[10px] text-indigo-600/70 font-medium">All rating periods</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-600">Active Plans</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-2xl font-bold text-slate-900">{stats.inProgress}</div>
                        <p className="text-[10px] text-blue-600/70 font-medium">Currently ongoing</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-green-50/50">
                    <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-600">Achieved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-2xl font-bold text-slate-900">{stats.achieved}</div>
                        <p className="text-[10px] text-green-600/70 font-medium">Successfully completed</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-amber-50/50">
                    <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-600">Needs Attention</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="text-2xl font-bold text-slate-900">{stats.overdue}</div>
                        <p className="text-[10px] text-amber-600/70 font-medium">Past target date</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table & Filters */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
                    <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full md:w-auto">
                        <TabsList className="bg-slate-100 flex p-1 h-10 w-full md:w-auto">
                            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                            <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
                            <TabsTrigger value="in_progress" className="text-xs whitespace-nowrap">In Progress</TabsTrigger>
                            <TabsTrigger value="achieved" className="text-xs">Achieved</TabsTrigger>
                            <TabsTrigger value="cancelled" className="text-xs">Cancelled</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search employee..."
                                className="pl-9 h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {(isHead || isAdmin || isPMT) && (
                            <Select value={selectedDivisionId} onValueChange={setSelectedDivisionId}>
                                <SelectTrigger className="w-[160px] h-10">
                                    <SelectValue placeholder="Division" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Divisions</SelectItem>
                                    {divisions.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                            <SelectTrigger className="w-[160px] h-10">
                                <SelectValue placeholder="Period" />
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

                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                {!isEmployee && <TableHead className="font-bold">Employee</TableHead>}
                                {isEmployee && <TableHead className="font-bold">Rating Period</TableHead>}
                                <TableHead className="font-bold">Linked IPCR</TableHead>
                                <TableHead className="font-bold">Aim</TableHead>
                                <TableHead className="font-bold">Target Date</TableHead>
                                {(isHead || isAdmin || isPMT || isEmployee) && <TableHead className="font-bold">Review Date</TableHead>}
                                <TableHead className="font-bold text-center">Tasks</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="text-right font-bold w-[120px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPlans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-48 text-center text-muted-foreground italic">
                                        No development plans found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPlans.map(plan => {
                                    const isOverdue = plan.target_date && isPast(new Date(plan.target_date)) && !plan.achieved_date && ['active', 'in_progress'].includes(plan.status)

                                    return (
                                        <TableRow key={plan.id} className="hover:bg-slate-50 group">
                                            {!isEmployee && (
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={plan.employee?.avatar_url} />
                                                            <AvatarFallback className="bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                                                                {plan.employee?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-700">{plan.employee?.full_name}</span>
                                                            <span className="text-[10px] text-muted-foreground">{plan.division?.code}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {isEmployee && (
                                                <TableCell className="font-medium">{plan.rating_period?.name}</TableCell>
                                            )}
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-slate-600">{plan.ipcr_form?.adjectival_rating || "N/A"}</span>
                                                    <span className="text-[10px] tabular-nums text-muted-foreground">{plan.ipcr_form?.final_average_rating || "—"} Rating</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px]">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="text-sm text-slate-600 line-clamp-2 cursor-help">{plan.aim}</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-xs">{plan.aim}</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </TableCell>
                                            <TableCell>
                                                <div className={cn("text-sm flex items-center gap-1.5", isOverdue && "text-destructive font-bold")}>
                                                    {plan.target_date ? format(new Date(plan.target_date), "MMM d, yyyy") : "—"}
                                                    {isOverdue && <AlertCircle className="h-3.5 w-3.5" />}
                                                </div>
                                            </TableCell>
                                            {(isHead || isAdmin || isPMT || isEmployee) && (
                                                <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                                                    {plan.review_date ? format(new Date(plan.review_date), "MMM d, yyyy") : "—"}
                                                </TableCell>
                                            )}
                                            <TableCell className="text-center">
                                                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                                    {plan.tasks?.length || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {renderStatusBadge(plan.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {(isChief || isHead || isAdmin) && ['active', 'in_progress'].includes(plan.status) && (
                                                        <>
                                                            <Button
                                                                variant="ghost" size="icon" className="h-8 w-8 text-primary"
                                                                onClick={() => handleEdit(plan)}
                                                                title="Edit Plan"
                                                            >
                                                                <PencilLine className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost" size="icon" className="h-8 w-8 text-green-600"
                                                                onClick={() => handleAchieve(plan)}
                                                                title="Mark Achieved"
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8"
                                                        onClick={() => handleView(plan)}
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modals & Drawers */}
            <PlanFormDrawer
                isOpen={formDrawerOpen}
                onClose={() => setFormDrawerOpen(false)}
                plan={selectedPlan}
                profile={profile}
                ratingPeriods={ratingPeriods}
            />

            <PlanViewDrawer
                isOpen={viewDrawerOpen}
                onClose={() => setViewDrawerOpen(false)}
                plan={selectedPlan}
                onEdit={() => {
                    setViewDrawerOpen(false)
                    setFormDrawerOpen(true)
                }}
                onAchieve={() => {
                    setViewDrawerOpen(false)
                    setAchieveDialogOpen(true)
                }}
                profile={profile}
            />

            <AchieveDialog
                isOpen={achieveDialogOpen}
                onClose={() => setAchieveDialogOpen(false)}
                plan={selectedPlan}
            />
        </div>
    )
}
