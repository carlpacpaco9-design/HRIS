'use client'

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'
import { Award, Trash2 } from 'lucide-react'
import { deleteAward } from '@/app/actions/rewards'
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

type RewardsTableProps = {
    awards: any[]
    canDelete: boolean
}

export function RewardsTable({ awards, canDelete }: RewardsTableProps) {
    const handleDelete = async (id: string) => {
        const res = await deleteAward(id)
        if (res.success) {
            toast.success('Award deleted')
        } else {
            toast.error(res.error || 'Failed to delete award')
        }
    }

    return (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead>Employee</TableHead>
                        <TableHead>Award Type</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Basis IPCR</TableHead>
                        <TableHead>Given By</TableHead>
                        <TableHead>Date</TableHead>
                        {canDelete && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {awards.map((award) => (
                        <TableRow key={award.id}>
                            <TableCell>
                                <div className="font-medium text-slate-900">{award.employee?.full_name}</div>
                                <div className="text-xs text-slate-500">{award.employee?.division}</div>
                            </TableCell>
                            <TableCell>
                                <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-400 border-none shadow-sm">
                                    <Award className="w-3 h-3 mr-1" />
                                    {award.award_type}
                                </Badge>
                            </TableCell>
                            <TableCell>{award.award_period}</TableCell>
                            <TableCell>
                                {award.basis_ipcr_id ? (
                                    <div className="text-sm">
                                        {award.ipcr?.spms_cycles?.name}
                                        <Badge variant="outline" className="ml-2 text-[10px] h-4 leading-3">
                                            {award.ipcr?.adjectival_rating} ({award.ipcr?.final_average_rating})
                                        </Badge>
                                    </div>
                                ) : (
                                    <span className="text-slate-400 italic">None</span>
                                )}
                            </TableCell>
                            <TableCell>{award.given_by_profile?.full_name}</TableCell>
                            <TableCell>{award.given_at ? format(new Date(award.given_at), 'MMM d, yyyy') : '—'}</TableCell>
                            {canDelete && (
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Award Record?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. Are you sure you want to permanently delete this award?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(award.id)} className="bg-rose-600 hover:bg-rose-700">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}

                    {awards.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={canDelete ? 7 : 6} className="text-center py-8 text-slate-500">
                                <Award className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                No awards have been recorded yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
