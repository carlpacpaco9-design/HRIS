'use client'

import { useState, useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Plus, Clock, MoreHorizontal, Eye, Edit, Trash2, Lock, Info, Download } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DTRForm } from "@/components/dtr/dtr-form"
import { adminLogDTR, deleteDTREntry } from "@/app/actions/dtr"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { DTRPermission } from "@/lib/dtr-permissions"

// Mock/Type for DTR Record
type DTRRecord = {
    id: string
    staff_name: string
    date: string
    time_in: string
    time_out: string
    hours_rendered: number
    status: string
}

export default function DTRPageClient({
    initialData,
    profile,
    staff = [],
    permissions
}: {
    initialData: any[],
    profile: any,
    staff?: any[],
    permissions: DTRPermission
}) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [downloadMonth, setDownloadMonth] = useState(new Date().getMonth() + 1)
    const [downloadYear, setDownloadYear] = useState(new Date().getFullYear())
    const router = useRouter()

    // Transform existing data to DataTable format
    const dtrData: DTRRecord[] = useMemo(() => {
        return initialData.map((day, idx) => {
            const amIn = day.logs?.am_in || ""
            const amOut = day.logs?.am_out || ""
            const pmIn = day.logs?.pm_in || ""
            const pmOut = day.logs?.pm_out || ""

            // Simple hour calculation for display
            let hours = 0
            if (amIn && amOut) hours += 4
            if (pmIn && pmOut) hours += 4

            return {
                id: day.logs?.id || `${day.date}-${idx}`, // Prefer real ID if available
                staff_name: profile?.full_name || "Staff Member",
                date: day.date,
                time_in: amIn || pmIn || "--:--",
                time_out: pmOut || amOut || "--:--",
                hours_rendered: hours,
                status: day.logs?.status || (day.isWeekend ? 'Weekend' : 'Present')
            }
        })
    }, [initialData, profile])

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this entry?")) return

        try {
            const result = await deleteDTREntry(id)
            if (result.success) {
                toast.success("Entry deleted")
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (e) {
            toast.error("Failed to delete entry")
        }
    }

    const dtrColumns: ColumnDef<DTRRecord>[] = [
        {
            accessorKey: "staff_name",
            header: "Staff Member",
            cell: ({ row }) => {
                const name = row.original.staff_name
                const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2)
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
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => {
                try {
                    return format(parseISO(row.original.date), "MMM dd, yyyy")
                } catch (e) {
                    return row.original.date
                }
            }
        },
        {
            accessorKey: "time_in",
            header: "Time In",
        },
        {
            accessorKey: "time_out",
            header: "Time Out",
        },
        {
            accessorKey: "hours_rendered",
            header: "Hours",
            cell: ({ row }) => `${row.original.hours_rendered.toFixed(1)} hrs`
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
                <>
                    {permissions.canEditEntry || permissions.canDeleteEntry ? (
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

                                {permissions.canEditEntry && (
                                    <DropdownMenuItem>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Entry
                                    </DropdownMenuItem>
                                )}

                                {permissions.canDeleteEntry && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => handleDelete(row.original.id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1 w-fit">
                            <Lock className="w-3 h-3" />
                            View only
                        </div>
                    )}
                </>
            )
        }
    ]

    const handleExport = () => {
        // Legacy export, keeping placeholder
        console.log("Exporting DTR data...")
    }

    const handleAddEntry = async (data: any) => {
        setIsSaving(true)
        const result = await adminLogDTR(data)
        setIsSaving(false)

        if (result.success) {
            toast.success("DTR entry saved successfully")
            setIsModalOpen(false)
            router.refresh()
        } else {
            toast.error("Failed to save DTR entry", {
                description: result.error
            })
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Page Header Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">Daily Time Records</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage and monitor staff attendance</p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    {/* Month/Year selector for download */}
                    <div className="flex items-center gap-2">
                        <Select
                            value={String(downloadMonth)}
                            onValueChange={v => setDownloadMonth(Number(v))}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={String(i + 1)}>
                                        {new Date(2024, i).toLocaleString('en-PH', { month: 'long' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={String(downloadYear)}
                            onValueChange={v => setDownloadYear(Number(v))}
                        >
                            <SelectTrigger className="w-[80px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[2024, 2025, 2026, 2027].map(y => (
                                    <SelectItem key={y} value={String(y)}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            onClick={() => {
                                const params = new URLSearchParams({
                                    month: String(downloadMonth),
                                    year: String(downloadYear)
                                })
                                window.open(`/api/export/dtr-form48?${params}`, '_blank')
                            }}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download Form 48
                        </Button>
                    </div>

                    {permissions.canLogTime && (
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" /> Add Entry
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary" />
                                        Add DTR Entry
                                    </DialogTitle>
                                    <DialogDescription>
                                        Record staff member daily time entry
                                    </DialogDescription>
                                </DialogHeader>
                                <DTRForm
                                    staff={staff}
                                    onSubmit={handleAddEntry}
                                    onCancel={() => setIsModalOpen(false)}
                                    isSaving={isSaving}
                                />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {!permissions.canLogTime && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
                    <Info className="w-4 h-4 text-blue-500 shrink-0" />
                    <p className="text-blue-700">
                        DTR entries are logged by the Administrative Division.
                        Contact your admin if you notice any discrepancy in your records.
                    </p>
                </div>
            )}

            {/* Main Card */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-5">
                <DataTable
                    columns={dtrColumns}
                    data={dtrData}
                    searchKey="staff_name"
                    searchPlaceholder="Search staff..."
                    emptyMessage="No DTR records found"
                    emptyIcon={Clock}
                    onExport={handleExport}
                    pagination={true}
                />
            </div>
        </div>
    )
}
