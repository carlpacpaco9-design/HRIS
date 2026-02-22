'use client'

import { useState, useEffect, useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Clock, Download, Info, Calendar } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getStaffDTR } from "@/app/actions/dtr-admin"
import { DTRPermission } from "@/lib/dtr-permissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DTRRecord = {
    id: string
    date: string
    am_in: string
    am_out: string
    pm_in: string
    pm_out: string
    status: string
}

export function StaffDTRView({
    currentUser,
    permissions
}: {
    currentUser: { id: string, full_name: string },
    permissions: DTRPermission
}) {
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [data, setData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            setIsLoading(true)
            try {
                const logs = await getStaffDTR(currentUser.id, month, year)
                setData(logs)
            } catch (e) {
                console.error("Failed to load DTR:", e)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [currentUser?.id, month, year])

    const dtrData: DTRRecord[] = useMemo(() => {
        return data.map((day, idx) => ({
            id: day.logs?.id || `${day.date}-${idx}`,
            date: day.date,
            am_in: day.logs?.am_in || "--:--",
            am_out: day.logs?.am_out || "--:--",
            pm_in: day.logs?.pm_in || "--:--",
            pm_out: day.logs?.pm_out || "--:--",
            status: day.logs?.status || (IsWeekend(day.date) ? 'Weekend' : 'Present')
        }))
    }, [data])

    function IsWeekend(dateStr: string) {
        const d = new Date(dateStr)
        const day = d.getDay()
        return day === 0 || day === 6
    }

    const columns: ColumnDef<DTRRecord>[] = [
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
            header: "AM In",
            accessorKey: "am_in",
        },
        {
            header: "AM Out",
            accessorKey: "am_out",
        },
        {
            header: "PM In",
            accessorKey: "pm_in",
        },
        {
            header: "PM Out",
            accessorKey: "pm_out",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />
        }
    ]

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Daily Time Record</h1>
                    <p className="text-muted-foreground">View your attendance logs and download Form 48</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={String(month)}
                        onValueChange={v => setMonth(Number(v))}
                    >
                        <SelectTrigger className="w-[140px] bg-white">
                            <Calendar className="w-4 h-4 mr-2 text-primary" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}>
                                    {new Date(2024, i).toLocaleString('en-US', { month: 'long' })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={String(year)}
                        onValueChange={v => setYear(Number(v))}
                    >
                        <SelectTrigger className="w-[100px] bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[2024, 2025, 2026].map(y => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="default"
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => {
                            const params = new URLSearchParams({
                                month: String(month),
                                year: String(year),
                                userId: currentUser.id
                            })
                            window.open(`/api/export/dtr-form48?${params}`, '_blank')
                        }}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download Form 48
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 text-sm text-blue-800 shadow-sm">
                <Info className="w-5 h-5 text-blue-500 shrink-0" />
                <p>
                    DTR entries are managed by the Administrative Division.
                    Official time: 8:00 AM - 12:00 PM and 1:00 PM - 5:00 PM.
                </p>
            </div>

            <Card className="border-none shadow-premium overflow-hidden">
                <CardHeader className="bg-white border-b">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                        <Clock className="w-5 h-5 text-primary" />
                        Log History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={dtrData}
                        searchKey="date"
                        isLoading={isLoading}
                        emptyMessage="No records found for this period"
                    />
                </CardContent>
            </Card>
        </div>
    )
}
