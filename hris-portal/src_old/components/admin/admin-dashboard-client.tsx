'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Users, FileText, CheckCircle2, Clock, Plus, Eye, Check } from "lucide-react"
import { createCycle, toggleCycle } from '@/app/actions/admin'
import { approveFinalRating } from '@/app/actions/head-approval'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"

type AdminDashboardClientProps = {
    initialStats: any
    initialCommitments: any[]
}

export function AdminDashboardClient({ initialStats, initialCommitments }: AdminDashboardClientProps) {
    const router = useRouter()
    const [statusFilter, setStatusFilter] = useState('all')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newCycle, setNewCycle] = useState({ title: '', start: '', end: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const filteredCommitments = initialCommitments.filter(c => {
        if (statusFilter === 'all') return true
        return c.status === statusFilter
    })

    const handleCreateCycle = async () => {
        if (!newCycle.title || !newCycle.start || !newCycle.end) {
            toast.error("Please fill in all fields")
            return
        }
        setIsSubmitting(true)
        const res = await createCycle(newCycle.title, newCycle.start, newCycle.end)
        setIsSubmitting(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Cycle created successfully")
            setIsCreateDialogOpen(false)
            router.refresh()
        }
    }

    const handleApproveFinal = async (id: string) => {
        const res = await approveFinalRating(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("IPCR Finalized and Closed")
            router.refresh()
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "employee",
            header: "Employee",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                            {getInitials(row.original.profiles?.full_name || '?')}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-medium text-slate-900">{row.original.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{row.original.profiles?.job_title || 'Employee'}</p>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "profiles.department",
            header: "Department",
            cell: ({ row }) => <span className="text-sm text-slate-600">{row.original.profiles?.department || '-'}</span>
        },
        {
            accessorKey: "supervisor.full_name",
            header: "Supervisor",
            cell: ({ row }) => <span className="text-xs text-slate-500 italic">{row.original.supervisor?.full_name || 'N/A'}</span>
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />
        },
        {
            accessorKey: "final_rating",
            header: "Score",
            cell: ({ row }) => (
                row.original.final_rating ? (
                    <div className="flex flex-col">
                        <span className="font-bold text-blue-700">{Number(row.original.final_rating).toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400">{row.original.adjectival_rating}</span>
                    </div>
                ) : <span className="text-slate-400">-</span>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const c = row.original
                return (
                    <div className="text-right space-x-2">
                        <Link href={`/dashboard/rate/${c.id}`}>
                            <Button size="icon" variant="ghost" title="View Report">
                                <Eye className="h-4 w-4" />
                            </Button>
                        </Link>
                        {c.status === 'rated' && (
                            <Button
                                size="sm"
                                variant="secondary"
                                className="bg-green-50 text-green-700 hover:bg-green-100"
                                onClick={() => handleApproveFinal(c.id)}
                                title="Head Approval"
                            >
                                <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                        )}
                    </div>
                )
            }
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Command Center</h1>
                    <p className="text-slate-500">Monitor compliance and manage performance cycles.</p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> New Cycle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New SPMS Cycle</DialogTitle>
                            <DialogDescription>Set the period for the next round of IPCR submissions.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Cycle Title (e.g. Jan-June 2026)</Label>
                                <Input
                                    id="title"
                                    placeholder="Enter title..."
                                    value={newCycle.title}
                                    onChange={e => setNewCycle({ ...newCycle, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start">Start Date</Label>
                                    <Input
                                        id="start"
                                        type="date"
                                        value={newCycle.start}
                                        onChange={e => setNewCycle({ ...newCycle, start: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end">End Date</Label>
                                    <Input
                                        id="end"
                                        type="date"
                                        value={newCycle.end}
                                        onChange={e => setNewCycle({ ...newCycle, end: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateCycle} disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Cycle"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{initialStats?.totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">Registered in system</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Drafting</CardTitle>
                        <FileText className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{initialStats?.drafted || 0}</div>
                        <p className="text-xs text-muted-foreground">In progress forms</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Submitted/Reviewed</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{initialStats?.pending || 0}</div>
                        <p className="text-xs text-muted-foreground">Awaiting final rating</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fully Rated</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{initialStats?.rated || 0}</div>
                        <p className="text-xs text-muted-foreground">Completed assessments</p>
                    </CardContent>
                </Card>
            </div>

            {/* Submission Rate Block */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Overall Submission Compliance</CardTitle>
                    <CardDescription>Percentage of employees who have submitted their IPCR for the active cycle.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-end justify-between">
                        <div className="text-3xl font-bold font-mono text-blue-600">{initialStats?.submissionRate || 0}%</div>
                        <div className="text-sm text-slate-500">Target: 100% Compliance</div>
                    </div>
                    <Progress value={initialStats?.submissionRate || 0} className="h-3 bg-slate-100" />
                </CardContent>
            </Card>

            {/* Compliance Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle>Compliance Registry</CardTitle>
                        <CardDescription>Track individual progress across all departments.</CardDescription>
                    </div>
                    {/* Manual filter removed as DataTable handles filtering/sorting better, 
                         or we can keep it if we pass filtered data. 
                         The prompt says "Refactor to use the shared DataTable".
                         DataTable typically has search built-in. 
                         If I pass `filteredCommitments` to `data`, then external filter still works.
                         But `DataTable` has `searchKey`. 
                         I'll use `initialCommitments` and let DataTable handle search?
                         But `statusFilter` state is local here.
                         I'll pass `filteredCommitments` to DataTable.
                      */}
                    <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rated">Rated</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={filteredCommitments}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
