'use client'

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'
import { FileText, Eye, Edit } from 'lucide-react'

type DevPlanTableProps = {
    plans: any[]
    onEdit: (plan: any) => void
}

export function DevPlanTable({ plans, onEdit }: DevPlanTableProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-blue-500 text-white">Active</Badge>
            case 'in_progress': return <Badge className="bg-amber-500 hover:bg-amber-600">In Progress</Badge>
            case 'achieved': return <Badge className="bg-green-600 hover:bg-green-700">Achieved</Badge>
            case 'cancelled': return <Badge variant="outline" className="text-slate-500 border-slate-300">Cancelled</Badge>
            default: return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead>Employee</TableHead>
                        <TableHead>Aim</TableHead>
                        <TableHead>Target Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {plans.map((plan) => (
                        <TableRow key={plan.id}>
                            <TableCell>
                                <div className="font-medium text-slate-900">{plan.employee?.full_name}</div>
                                <div className="text-xs text-slate-500">{plan.employee?.division}</div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{plan.aim}</TableCell>
                            <TableCell>{plan.target_date ? format(new Date(plan.target_date), 'MMM d, yyyy') : '—'}</TableCell>
                            <TableCell>{getStatusBadge(plan.status)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => onEdit(plan)}>
                                    <Edit className="h-4 w-4 text-slate-500" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}

                    {plans.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                No development plans found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
