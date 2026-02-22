'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Settings, Database, List, Search } from 'lucide-react'
import { initializeLeaveBalances } from '@/app/actions/admin'

export function AdminPanelClient({
    initialLogs,
    totalCount,
    currentFilter,
    currentPage
}: {
    initialLogs: any[]
    totalCount: number
    currentFilter: string
    currentPage: number
}) {
    const router = useRouter()
    const [initYear, setInitYear] = useState(new Date().getFullYear().toString())
    const [isInitializing, setIsInitializing] = useState(false)

    const handleInitLeaves = async () => {
        setIsInitializing(true)
        const res = await initializeLeaveBalances(parseInt(initYear, 10))
        if (res.success) {
            toast.success(`Successfully initialized balances for ${res.createdCount} employees.`)
        } else {
            toast.error(res.error || 'Failed to initialize balances.')
        }
        setIsInitializing(false)
    }

    const handleFilterChange = (val: string) => {
        router.push(`/dashboard/admin/settings?filter=${val}&page=${currentPage}`)
    }

    return (
        <div className="space-y-6">

            {/* SYSTEM SETTINGS */}
            <Card>
                <CardHeader className="bg-slate-50 border-b pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="w-5 h-5 text-slate-500" />
                        System Settings
                    </CardTitle>
                    <CardDescription>Global configuration for PAO HRMS</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <Label>Office Name</Label>
                            <Input value="Provincial Assessor's Office" disabled />
                            <p className="text-xs text-slate-500">This is fixed and cannot be changed.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* UTILITIES */}
            <Card>
                <CardHeader className="bg-slate-50 border-b pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-500" />
                        Utilities
                    </CardTitle>
                    <CardDescription>Maintenance operations</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="p-4 border rounded-lg bg-slate-50/50 max-w-xl">
                        <h4 className="font-semibold text-slate-900 mb-1">Initialize Leave Balances</h4>
                        <p className="text-sm text-slate-500 mb-4">
                            Generates default vacation and sick leave balances for all active staff for the selected year. Only inserts rows if one doesn't exist for that user/year.
                        </p>
                        <div className="flex gap-4 items-end">
                            <div className="space-y-1">
                                <Label>Target Year</Label>
                                <Select value={initYear} onValueChange={setInitYear}>
                                    <SelectTrigger className="w-32 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</SelectItem>
                                        <SelectItem value={(new Date().getFullYear()).toString()}>{new Date().getFullYear()}</SelectItem>
                                        <SelectItem value={(new Date().getFullYear() + 1).toString()}>{new Date().getFullYear() + 1}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleInitLeaves} disabled={isInitializing} className="bg-[#1E3A5F]">
                                {isInitializing ? 'Generating...' : 'Initialize'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AUDIT LOG VIEWER */}
            <Card>
                <CardHeader className="bg-slate-50 border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <List className="w-5 h-5 text-amber-500" />
                            Audit Log Viewer
                        </CardTitle>
                        <CardDescription>System activity over time. Total: {totalCount} records.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-slate-400" />
                        <Select value={currentFilter} onValueChange={handleFilterChange}>
                            <SelectTrigger className="w-[180px] bg-white h-8 text-sm">
                                <SelectValue placeholder="Filter by module..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Modules</SelectItem>
                                <SelectItem value="DTR">DTR</SelectItem>
                                <SelectItem value="Leave">Leave</SelectItem>
                                <SelectItem value="User">User</SelectItem>
                                <SelectItem value="IPCR">IPCR</SelectItem>
                                <SelectItem value="DPCR">DPCR</SelectItem>
                                <SelectItem value="System">System</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="pl-6 w-40">Date</TableHead>
                                <TableHead className="w-32">Module / Action</TableHead>
                                <TableHead className="w-48">User</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialLogs.map(log => (
                                <TableRow key={log.id} className="text-sm">
                                    <TableCell className="pl-6 text-slate-500 whitespace-nowrap">
                                        {format(new Date(log.created_at), 'MMM d, yy h:m a')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-[10px] leading-3 py-0.5">
                                            {log.action_type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{log.profiles?.full_name || 'System'}</TableCell>
                                    <TableCell className="text-slate-600 truncate max-w-sm" title={log.action_details}>
                                        {log.action_details}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {initialLogs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                                        No audit logs found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
