'use client'

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { Search, ChevronLeft, ChevronRight, Info, History } from "lucide-react"
import { getAuditLogs } from "@/app/actions/audit"

export function AuditLogViewer() {
    const [logs, setLogs] = useState<any[]>([])
    const [count, setCount] = useState(0)
    const [page, setPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const limit = 20

    const fetchLogs = async () => {
        setIsLoading(true)
        const res = await getAuditLogs(page, limit, searchTerm)
        if (res.logs) {
            setLogs(res.logs)
            setCount(res.count)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs()
        }, 500)
        return () => clearTimeout(timer)
    }, [page, searchTerm])

    const getActionColor = (action: string) => {
        const act = action.toUpperCase()
        if (act.includes('DELETE')) return 'bg-red-100 text-red-700 border-red-200'
        if (act.includes('CREATE') || act.includes('UPLOAD') || act.includes('SUBMIT')) return 'bg-green-100 text-green-700 border-green-200'
        if (act.includes('UPDATE') || act.includes('EDIT')) return 'bg-blue-100 text-blue-700 border-blue-200'
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by action (e.g. DELETE, CREATE)..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setPage(1)
                        }}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1 || isLoading}
                        onClick={() => setPage(p => p - 1)}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <span className="text-sm text-slate-500 px-2">
                        Page {page} of {Math.ceil(count / limit) || 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= Math.ceil(count / limit) || isLoading}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>

            <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[180px]">Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead className="text-right">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                                    Loading activity logs...
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                                    No audit logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-slate-50/50">
                                    <TableCell className="text-xs font-medium text-slate-600">
                                        {format(new Date(log.created_at), "MMM d, h:mm a")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900">{log.profiles?.full_name || 'System'}</span>
                                            <span className="text-[10px] text-slate-500">{log.profiles?.department || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getActionColor(log.action)}>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold uppercase text-slate-500 tracking-tight">{log.resource_type}</span>
                                            <span className="text-[10px] font-mono text-slate-400 mt-1">{log.resource_id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                                    <Info className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2">
                                                        <History className="h-5 w-5 text-blue-600" />
                                                        Activity Details
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="mt-4 p-4 bg-slate-900 rounded-lg text-slate-100 font-mono text-xs overflow-auto max-h-[60vh]">
                                                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                                </div>
                                                <div className="flex flex-col gap-2 mt-4 text-xs text-slate-500 border-t pt-4">
                                                    <p><strong>Log ID:</strong> {log.id}</p>
                                                    <p><strong>IP Address/Client:</strong> {log.details?.ip || 'Internal'}</p>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-xs text-slate-400 text-center">
                Total Logs Recorded: {count}
            </div>
        </div>
    )
}
