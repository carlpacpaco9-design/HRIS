'use client'

import React, { useMemo, useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { CalendarOff, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type LeaveRecord = {
    id: string
    employee_name: string
    leave_type: string
    date_from: string
    date_to: string
    days: number
    status: string
    remarks?: string
}

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { LeaveForm } from "@/components/leaves/leave-form"
import { submitLeaveApplication } from "@/app/actions/leaves"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function LeavesPageClient({
    balances,
    applications,
    profile
}: {
    balances: any,
    applications: any[],
    profile: any
}) {
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    const handleFileLeave = async (data: any) => {
        setIsSaving(true)

        const result = await submitLeaveApplication({
            leave_type: data.leave_type,
            start_date: data.date_from,
            end_date: data.date_to,
            reason: data.reason,
            is_half_day: data.is_half_day
        })

        setIsSaving(false)

        if (result.success) {
            toast.success("Leave application submitted successfully")
            setIsModalOpen(false)
            router.refresh()
        } else {
            toast.error("Failed to submit leave application", {
                description: result.error
            })
        }
    }

    const filteredData = useMemo(() => {
        let filtered = applications.map((app, idx) => ({
            id: app.id || `${idx}`,
            employee_name: profile?.full_name || "Employee",
            leave_type: app.leave_type,
            date_from: app.start_date,
            date_to: app.end_date,
            days: differenceInDays(parseISO(app.end_date), parseISO(app.start_date)) + 1,
            status: app.status,
            remarks: app.remarks
        }))

        if (statusFilter !== "all") {
            filtered = filtered.filter(app => app.status.toLowerCase() === statusFilter.toLowerCase())
        }

        if (typeFilter !== "all") {
            filtered = filtered.filter(app => app.leave_type.toLowerCase().includes(typeFilter.toLowerCase()))
        }

        return filtered
    }, [applications, profile, statusFilter, typeFilter])

    const columns: ColumnDef<LeaveRecord>[] = [
        {
            accessorKey: "employee_name",
            header: "Employee",
            cell: ({ row }) => {
                const name = row.original.employee_name
                const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2)
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 
                          text-primary text-xs font-semibold 
                          flex items-center justify-center shrink-0">
                            {initials}
                        </div>
                        <span className="font-medium">{name}</span>
                    </div>
                )
            }
        },
        {
            accessorKey: "leave_type",
            header: "Leave Type",
        },
        {
            accessorKey: "date_from",
            header: "Date From",
            cell: ({ row }) => {
                try {
                    return format(parseISO(row.original.date_from), "MMM dd, yyyy")
                } catch (e) {
                    return row.original.date_from
                }
            }
        },
        {
            accessorKey: "date_to",
            header: "Date To",
            cell: ({ row }) => {
                try {
                    return format(parseISO(row.original.date_to), "MMM dd, yyyy")
                } catch (e) {
                    return row.original.date_to
                }
            }
        },
        {
            accessorKey: "days",
            header: "No. of Days",
            cell: ({ row }) => `${row.original.days} Day(s)`
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <div>
                    <StatusBadge status={row.original.status} />
                    {row.original.status === 'rejected' && row.original.remarks && (
                        <p className="text-xs text-red-600 mt-1 max-w-[150px] truncate" title={row.original.remarks}>
                            Reason: {row.original.remarks}
                        </p>
                    )}
                </div>
            )
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
                        <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Cancel Request
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ]

    const filters = (
        <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Leave Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="maternity">Maternity/Paternity</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Page Header Row */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Leave Management</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Track and process employee leave requests</p>
                </div>
                <div>
                    <Dialog
                        open={isModalOpen}
                        onOpenChange={(open) => {
                            if (isSaving) return
                            setIsModalOpen(open)
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <CalendarOff className="h-4 w-4" /> File Leave
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className="sm:max-w-[500px]"
                            onPointerDownOutside={(e) => { if (isSaving) e.preventDefault() }}
                            onEscapeKeyDown={(e) => { if (isSaving) e.preventDefault() }}
                        >
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <CalendarOff className="h-5 w-5 text-primary" />
                                    File Leave Application
                                </DialogTitle>
                                <DialogDescription>
                                    Submit a leave request for approval
                                </DialogDescription>
                            </DialogHeader>
                            <LeaveForm
                                key={isModalOpen ? "active" : "inactive"}
                                onSubmit={handleFileLeave}
                                onCancel={() => setIsModalOpen(false)}
                                isSaving={isSaving}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-5">
                <DataTable
                    columns={columns}
                    data={filteredData}
                    searchKey="employee_name"
                    searchPlaceholder="Search employee..."
                    emptyMessage="No leave records found"
                    emptyIcon={CalendarOff}
                    filters={filters}
                    pagination={true}
                />
            </div>
        </div>
    )
}
