'use client'

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Plus,
    CalendarClock,
    FileText,
    ChevronDown,
    ChevronUp,
    Search,
    Filter,
    ArrowRight,
    AlertTriangle,
    Eye,
    PencilLine,
    Send,
    CheckCheck,
    Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { MonitoringJournal, MonitoringJournalStatus } from "@/types/monitoring"
import { createMonitoringJournal, submitMonitoringJournal, noteMonitoringJournal } from "@/app/actions/monitoring"
import { format } from "date-fns"

interface MonitoringPageClientProps {
    profile: any
    initialJournals: any[]
    ratingPeriods: any[]
    activePeriod: any
    serverQuarter: number
}

export function MonitoringPageClient({
    profile,
    initialJournals,
    ratingPeriods,
    activePeriod,
    serverQuarter
}: MonitoringPageClientProps) {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [selectedPeriodId, setSelectedPeriodId] = useState(activePeriod?.id || "")
    const [selectedQuarter, setSelectedQuarter] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    // Handle hydration
    useEffect(() => {
        setMounted(true)
    }, [])

    const currentPeriod = ratingPeriods.find(p => p.id === selectedPeriodId)
    const role = profile.role

    // Use server side quarter for initial hydration, can be updated on client if needed
    // or just kept as is for stability within a single session
    const currentQuarterCalculated = serverQuarter

    // Avoid rendering certain parts that cause hydration mismatch until mounted
    // though for Tabs, it's better to render them consistently.
    // The Radix ID issue often stems from the count of components above it.

    // Filter journals based on selections
    const filteredJournals = useMemo(() => {
        return initialJournals.filter(j => {
            const matchesPeriod = !selectedPeriodId || j.rating_period_id === selectedPeriodId
            const matchesQuarter = selectedQuarter === "all" || j.quarter.toString() === selectedQuarter
            const matchesSearch = !searchQuery ||
                j.division?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                j.division?.code?.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesPeriod && matchesQuarter && matchesSearch
        })
    }, [initialJournals, selectedPeriodId, selectedQuarter, searchQuery])

    // Get journal for each quarter in the current selected period
    const quarterStatus = useMemo(() => {
        if (!currentPeriod) return []

        const quarters = currentPeriod.semester === 1 ? [1, 2] : [3, 4]

        return quarters.map(q => {
            const journal = initialJournals.find(j => j.rating_period_id === currentPeriod.id && j.quarter === q)

            let dateRange = ""
            if (q === 1) dateRange = "Jan - Mar"
            else if (q === 2) dateRange = "Apr - Jun"
            else if (q === 3) dateRange = "Jul - Sep"
            else if (q === 4) dateRange = "Oct - Dec"

            return {
                quarter: q,
                status: journal?.status || "not started",
                dateRange,
                entryCount: journal?.entriesCount || 0,
                taskCount: journal?.tasksCount || 0,
                journalId: journal?.id,
                isActive: q === currentQuarterCalculated
            }
        })
    }, [currentPeriod, initialJournals, currentQuarterCalculated])

    const handleCreateJournal = async (quarter: number) => {
        if (!selectedPeriodId) return

        setIsCreating(true)
        try {
            const res = await createMonitoringJournal({
                rating_period_id: selectedPeriodId,
                division_id: profile.division_id,
                quarter: quarter as 1 | 2 | 3 | 4
            })

            if (res.error) throw new Error(res.error)

            toast.success("Monitoring journal created successfully")
            router.push(`/dashboard/monitoring/${res.data.id}`)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsCreating(false)
        }
    }

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200">Draft</Badge>
            case 'submitted':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-600 border-blue-200">Submitted</Badge>
            case 'noted':
                return <Badge variant="secondary" className="bg-green-100 text-green-600 border-green-200">Noted</Badge>
            case 'not started':
                return <Badge variant="outline" className="text-slate-400 border-slate-200 dashed">Not Started</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {role === 'division_chief' ? "Monitoring & Coaching Journal" :
                            role === 'head_of_office' ? "Monitoring & Coaching Oversight" :
                                "Monitoring & Coaching Journals"}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {role === 'division_chief' ? `Track your division's performance monitoring activities — ${profile.division?.name || "Provincial Assessor's Office"}` :
                            role === 'head_of_office' ? "Review and acknowledge division monitoring journals" :
                                "All division monitoring and coaching records"}
                    </p>
                </div>
            </div>

            {/* Quarter Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quarterStatus.map((qs) => (
                    <Card
                        key={qs.quarter}
                        className={cn(
                            "cursor-pointer hover:border-primary/50 transition-all duration-200",
                            qs.isActive && "bg-primary/5 border-primary/20",
                            selectedQuarter === qs.quarter.toString() && "ring-2 ring-primary border-primary"
                        )}
                        onClick={() => setSelectedQuarter(selectedQuarter === qs.quarter.toString() ? "all" : qs.quarter.toString())}
                    >
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-lg font-bold">Q{qs.quarter}</span>
                                {renderStatusBadge(qs.status)}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{qs.dateRange} {currentPeriod?.year}</p>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {qs.entryCount || 0} activities</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3" /> {qs.taskCount || 0} tasks</span>
                            </div>

                            {role === 'division_chief' && qs.status === 'not started' && (
                                <Button
                                    className="w-full mt-3 h-8 text-xs gap-1"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleCreateJournal(qs.quarter)
                                    }}
                                    disabled={isCreating}
                                >
                                    <Plus className="h-3 w-3" /> Create Now
                                </Button>
                            )}
                            {qs.journalId && (
                                <Button
                                    variant="ghost"
                                    className="w-full mt-3 h-8 text-xs gap-1 group"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/dashboard/monitoring/${qs.journalId}`)
                                    }}
                                >
                                    {qs.status === 'draft' && role === 'division_chief' ? 'Open Draft' : 'View Journal'}
                                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Missing Journal Alert for current quarter (Client-only to ensure stable Radix IDs during hydration) */}
            {mounted && role === 'division_chief' && quarterStatus.some(qs => qs.isActive && qs.status === 'not started') && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-amber-100 p-2 rounded-full">
                        <AlertTriangle className="text-amber-600 w-5 h-5 shrink-0" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-amber-900">
                            Q{currentQuarterCalculated} Journal Not Started
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            You haven't created your monitoring journal for Q{currentQuarterCalculated} of {activePeriod?.name || "the current period"} yet.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="default"
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => handleCreateJournal(currentQuarterCalculated)}
                        disabled={isCreating}
                    >
                        Create Now
                    </Button>
                </div>
            )}

            {/* Main Content Area */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Tabs value={selectedQuarter} onValueChange={setSelectedQuarter} className="w-full md:w-auto">
                            <TabsList className="grid grid-cols-5 w-full md:w-[400px]">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="1">Q1</TabsTrigger>
                                <TabsTrigger value="2">Q2</TabsTrigger>
                                <TabsTrigger value="3">Q3</TabsTrigger>
                                <TabsTrigger value="4">Q4</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search divisions..."
                                className="pl-9 h-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                            <SelectTrigger className="w-[180px] h-10">
                                <SelectValue placeholder="Rating Period" />
                            </SelectTrigger>
                            <SelectContent>
                                {ratingPeriods.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                {role !== 'division_chief' && <TableHead className="font-bold">Division</TableHead>}
                                <TableHead className="font-bold">Quarter</TableHead>
                                <TableHead className="font-bold">Rating Period</TableHead>
                                <TableHead className="font-bold">Conducted Date</TableHead>
                                <TableHead className="font-bold text-center">Activities</TableHead>
                                <TableHead className="font-bold text-center">Tasks</TableHead>
                                <TableHead className="font-bold">Noted By</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="text-right font-bold w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredJournals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={role === 'division_chief' ? 8 : 9} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                                            <CalendarClock className="h-10 w-10 opacity-20" />
                                            <p className="text-sm">No journals found matching your filters</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredJournals.map((journal) => (
                                    <TableRow key={journal.id} className="hover:bg-slate-50 group">
                                        {role !== 'division_chief' && (
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-700">{journal.division?.name}</span>
                                                    <Badge variant="outline" className="w-fit text-[10px] h-4 px-1">{journal.division?.code}</Badge>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <Badge className="bg-primary/10 text-primary border-none font-bold">Q{journal.quarter}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">{journal.rating_period?.name}</TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {journal.conducted_date ? format(new Date(journal.conducted_date), "MMM d, yyyy") : "Not set"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                                                {journal.entriesCount || 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                                                {journal.tasksCount || 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {journal.noted_by_profile?.full_name ? (
                                                <span className="font-medium">{journal.noted_by_profile.full_name}</span>
                                            ) : (
                                                <span className="text-muted-foreground italic">Pending</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {renderStatusBadge(journal.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {journal.status === 'draft' && role === 'division_chief' ? (
                                                    <>
                                                        <Button
                                                            variant="ghost" size="icon" className="h-8 w-8 text-primary"
                                                            onClick={() => router.push(`/dashboard/monitoring/${journal.id}`)}
                                                            title="Edit Draft"
                                                        >
                                                            <PencilLine className="h-4 w-4" />
                                                        </Button>
                                                        {journal.entriesCount > 0 && journal.tasksCount > 0 && (
                                                            <Button
                                                                variant="ghost" size="icon" className="h-8 w-8 text-blue-600"
                                                                title="Submit Journal"
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8"
                                                        onClick={() => router.push(`/dashboard/monitoring/${journal.id}`)}
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {role === 'head_of_office' && journal.status === 'submitted' && (
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8 text-green-600"
                                                        title="Note Journal"
                                                    >
                                                        <CheckCheck className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {role === 'admin_staff' && journal.status === 'draft' && (
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                                        title="Delete Journal"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
