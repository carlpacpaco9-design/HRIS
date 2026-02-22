'use client'

import { useRouter } from 'next/navigation'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'
import { Eye, Edit, Star, FileText } from 'lucide-react'

type IPCRTableProps = {
    forms: any[]
    isManagerView: boolean
    currentUserId: string
}

export function IPCRTable({ forms, isManagerView, currentUserId }: IPCRTableProps) {
    const router = useRouter()

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft': return <Badge variant="outline" className="text-slate-500 border-slate-300">Draft</Badge>
            case 'submitted': return <Badge className="bg-amber-500 hover:bg-amber-600">Submitted</Badge>
            case 'reviewed': return <Badge className="bg-blue-600 hover:bg-blue-700">Endorsed</Badge>
            case 'finalized': return <Badge className="bg-green-600 hover:bg-green-700">Finalized</Badge>
            case 'returned': return <Badge className="bg-rose-500 hover:bg-rose-600">Returned</Badge>
            default: return <Badge variant="secondary">{status}</Badge>
        }
    }

    const getAdjectivalBadge = (rating: string | null) => {
        if (!rating) return <span className="text-slate-400 italic text-sm">Pending</span>
        switch (rating) {
            case 'Outstanding': return <Badge className="bg-yellow-500 text-yellow-950 font-bold">Outstanding</Badge>
            case 'Very Satisfactory': return <Badge className="bg-green-500 text-green-950">Very Satisfactory</Badge>
            case 'Satisfactory': return <Badge className="bg-blue-500 text-blue-950">Satisfactory</Badge>
            case 'Unsatisfactory': return <Badge className="bg-amber-500 text-amber-950">Unsatisfactory</Badge>
            case 'Poor': return <Badge className="bg-rose-500 text-rose-950">Poor</Badge>
            default: return <Badge variant="secondary">{rating}</Badge>
        }
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        {isManagerView && <TableHead>Employee</TableHead>}
                        <TableHead>Period</TableHead>
                        <TableHead className="text-center">Outputs</TableHead>
                        <TableHead className="text-center">Avg Rating</TableHead>
                        <TableHead>Adjectival</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {forms.map((form) => {
                        const isOwn = form.employee_id === currentUserId

                        let ActionIcon = Eye
                        let actionLabel = "View"
                        let variant: any = "ghost"

                        if (isOwn && (form.status === 'draft' || form.status === 'returned')) {
                            ActionIcon = Edit
                            actionLabel = "Edit"
                            variant = "outline"
                        } else if (isManagerView) {
                            if (form.status === 'submitted' || form.status === 'reviewed') {
                                ActionIcon = Star
                                actionLabel = form.status === 'submitted' ? "Review" : "Finalize"
                                variant = "outline"
                            }
                        }

                        return (
                            <TableRow key={form.id}>
                                {isManagerView && (
                                    <TableCell className="font-medium">
                                        {form.profiles?.full_name}
                                        <div className="text-xs text-slate-500 font-normal">{form.profiles?.division}</div>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <div className="font-medium text-slate-700">
                                        {format(new Date(form.spms_cycles.start_date), 'MMM yyyy')} - {format(new Date(form.spms_cycles.end_date), 'MMM yyyy')}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 h-6 w-6 rounded-full text-xs font-semibold">
                                        {form.output_count}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center font-semibold text-slate-900">
                                    {form.final_average_rating ? form.final_average_rating.toFixed(3) : '—'}
                                </TableCell>
                                <TableCell>{getAdjectivalBadge(form.adjectival_rating)}</TableCell>
                                <TableCell>{getStatusBadge(form.status)}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant={variant}
                                        size="sm"
                                        className={actionLabel !== 'View' ? 'border-[#1E3A5F] text-[#1E3A5F]' : 'text-slate-500'}
                                        onClick={() => router.push(`/dashboard/ipcr/${form.id}`)}
                                    >
                                        <ActionIcon className="mr-2 h-4 w-4" /> {actionLabel}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}

                    {forms.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={isManagerView ? 7 : 6} className="text-center py-8 text-slate-500">
                                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                No IPCR records found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
