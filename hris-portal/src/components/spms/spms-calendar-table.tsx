'use client'

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'
import { Calendar, Check } from 'lucide-react'
import { setActiveCycle } from '@/app/actions/spms-calendar'
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

type SpmsCalendarTableProps = {
    cycles: any[]
    canManage: boolean
}

export function SpmsCalendarTable({ cycles, canManage }: SpmsCalendarTableProps) {
    const handleSetActive = async (id: string) => {
        const res = await setActiveCycle(id)
        if (res.success) {
            toast.success('Active cycle updated')
        } else {
            toast.error(res.error || 'Failed to update active cycle')
        }
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead>Cycle Name</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cycles.map((cycle) => (
                        <TableRow key={cycle.id}>
                            <TableCell className="font-medium text-slate-900">{cycle.name}</TableCell>
                            <TableCell>
                                {cycle.period_start && cycle.period_end ?
                                    `${format(new Date(cycle.period_start), 'MMM d, yyyy')} — ${format(new Date(cycle.period_end), 'MMM d, yyyy')}` :
                                    '—'}
                            </TableCell>
                            <TableCell>
                                {cycle.is_active ? (
                                    <Badge className="bg-green-500 hover:bg-green-600 border-none shadow-sm">Active</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-slate-500">Inactive</Badge>
                                )}
                            </TableCell>
                            {canManage && (
                                <TableCell className="text-right">
                                    {!cycle.is_active ? (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                                                    Set Active
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Set as Active Cycle?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will deactivate the current active cycle and set "{cycle.name}" as the active performance management period.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleSetActive(cycle.id)} className="bg-blue-600 hover:bg-blue-700">Confirm</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    ) : (
                                        <span className="inline-flex items-center text-green-600 text-sm font-medium mr-2">
                                            <Check className="w-4 h-4 mr-1" /> Current
                                        </span>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}

                    {cycles.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={canManage ? 4 : 3} className="text-center py-8 text-slate-500">
                                <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                No SPMS cycles have been created yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
