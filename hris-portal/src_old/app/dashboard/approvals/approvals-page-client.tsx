'use client'

import React, { useMemo, useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, MoreHorizontal, Eye, Star, XCircle, FileText, CalendarOff } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link'
import { LeaveApprovalsTab } from "@/components/approvals/leave-approvals-tab"

type ApprovalRecord = {
    id: string
    staff_name: string
    request_type: string
    date_filed: string
    details: string
    status: string
}

export default function ApprovalsPageClient({
    pendingSubmissions,
    teamCommitments,
    pendingLeaves
}: {
    pendingSubmissions: any[],
    teamCommitments: any[],
    pendingLeaves: any[]
}) {
    const [activeRootTab, setActiveRootTab] = useState("leaves")
    const [activeIpcrTab, setActiveIpcrTab] = useState("all")

    const ipcrData = useMemo(() => {
        const pending = pendingSubmissions.map(s => ({
            id: s.id,
            staff_name: s.employeeName,
            request_type: "IPCR Submission",
            date_filed: s.dateSubmitted,
            details: s.position || "Staff",
            status: s.status || "pending"
        }))

        const team = teamCommitments.map(s => ({
            id: s.id,
            staff_name: s.staff_name,
            request_type: "IPCR Rating",
            date_filed: s.date_submitted,
            details: s.position_title || "Staff",
            status: s.status || "submitted"
        }))

        const all = [...pending, ...team]

        if (activeIpcrTab === "all") return all
        return all.filter(item => {
            if (activeIpcrTab === "pending") return item.status === "pending" || item.status === "submitted"
            if (activeIpcrTab === "approved") return item.status === "approved" || item.status === "rated"
            if (activeIpcrTab === "rejected") return item.status === "rejected" || item.status === "returned"
            return true
        })
    }, [pendingSubmissions, teamCommitments, activeIpcrTab])

    const ipcrColumns: ColumnDef<ApprovalRecord>[] = [
        {
            accessorKey: "staff_name",
            header: "Staff Member",
            cell: ({ row }) => {
                const name = row.original.staff_name || "Unknown"
                const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2)
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                            {initials}
                        </div>
                        <span className="font-medium">{name}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "request_type",
            header: "Request Type",
        },
        {
            accessorKey: "date_filed",
            header: "Date Filed",
            cell: ({ row }) => {
                try {
                    return format(parseISO(row.original.date_filed), "MMM dd, yyyy")
                } catch (e) {
                    return row.original.date_filed
                }
            }
        },
        {
            accessorKey: "details",
            header: "Details",
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.details}</span>
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/ipcr`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Approvals</h1>
                <p className="text-slate-500">Review and manage pending requests from your team.</p>
            </div>

            <Tabs defaultValue="leaves" value={activeRootTab} onValueChange={setActiveRootTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="leaves" className="flex items-center gap-2">
                        <CalendarOff className="h-4 w-4" />
                        Leave Requests
                        {pendingLeaves.length > 0 && (
                            <Badge className="ml-1 bg-red-500 hover:bg-red-600 text-white border-0">
                                {pendingLeaves.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="ipcr" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        IPCR Reviews
                    </TabsTrigger>
                </TabsList>

                {/* LEAVES TAB CONTENT */}
                <TabsContent value="leaves" className="mt-6">
                    <LeaveApprovalsTab leaves={pendingLeaves} />
                </TabsContent>

                {/* IPCR TAB CONTENT */}
                <TabsContent value="ipcr" className="mt-6">
                    <div className="bg-white border rounded-lg shadow-sm p-4 space-y-4">
                        <Tabs value={activeIpcrTab} onValueChange={setActiveIpcrTab} className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg flex items-center">
                                    Performance Commitments
                                </h3>
                                <TabsList>
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="pending">Pending</TabsTrigger>
                                    <TabsTrigger value="approved">Approved</TabsTrigger>
                                </TabsList>
                            </div>

                            <DataTable
                                columns={ipcrColumns}
                                data={ipcrData}
                                searchKey="staff_name"
                                searchPlaceholder="Search staff member..."
                                emptyMessage="No IPCR submissions found"
                                emptyIcon={FileText}
                                pagination={true}
                            />
                        </Tabs>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
