'use client'

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'
import { Edit, FileText, Trash2 } from 'lucide-react'
import { Role, isHRManager } from '@/lib/roles'
import { deleteMonitoringJournal } from '@/app/actions/monitoring'
import { toast } from 'sonner'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type MonitoringTableProps = {
    journals: any[]
    onEdit: (journal: any) => void
    currentUserId: string
    currentUserRole: Role
}

export function MonitoringTable({ journals, onEdit, currentUserId, currentUserRole }: MonitoringTableProps) {
    const handleDelete = async (id: string) => {
        const res = await deleteMonitoringJournal(id)
        if (res.success) {
            toast.success('Journal entry deleted')
        } else {
            toast.error(res.error || 'Failed to delete journal')
        }
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead>Employee</TableHead>
                        <TableHead>Quarter</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Mechanism</TableHead>
                        <TableHead>Conducted By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {journals.map((journal) => {
                        const canEditOrDelete = isHRManager(currentUserRole) || journal.division_chief_id === currentUserId

                        return (
                            <TableRow key={journal.id}>
                                <TableCell>
                                    <div className="font-medium text-slate-900">{journal.employee?.full_name}</div>
                                    <div className="text-xs text-slate-500">{journal.spms_cycles?.name}</div>
                                </TableCell>
                                <TableCell>Q{journal.quarter}</TableCell>
                                <TableCell>{format(new Date(journal.date_conducted), 'MMM d, yyyy')}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-slate-600 bg-slate-50">{journal.monitoring_mechanism}</Badge>
                                </TableCell>
                                <TableCell>{journal.division_chief?.full_name}</TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-2">
                                    {canEditOrDelete && (
                                        <>
                                            <Button variant="ghost" size="sm" onClick={() => onEdit(journal)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Journal Entry?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. Are you sure you want to permanently delete this monitoring journal entry?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(journal.id)} className="bg-rose-600 hover:bg-rose-700">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                    )}
                                    {!canEditOrDelete && (
                                        <span className="text-xs text-slate-400 italic">Read-only</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}

                    {journals.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                No monitoring journals found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
