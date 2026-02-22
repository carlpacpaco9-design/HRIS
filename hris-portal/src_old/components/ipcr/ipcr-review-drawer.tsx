'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FormFieldWrapper } from "@/components/ui/form-field-wrapper"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ClipboardCheck, Info, MessageSquare } from "lucide-react"
import { reviewIPCRForm } from "@/app/actions/ipcr"
import { toast } from "sonner"
import { IPCRForm } from "@/types/ipcr"

interface IPCRReviewDrawerProps {
    isOpen: boolean
    onClose: () => void
    form: IPCRForm | null
    profile: any
}

export function IPCRReviewDrawer({
    isOpen,
    onClose,
    form,
    profile
}: IPCRReviewDrawerProps) {
    const [remarks, setRemarks] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const handleReview = async () => {
        if (!form) return
        if (remarks.length < 20) {
            toast.error("Review remarks must be at least 20 characters long")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await reviewIPCRForm(form.id, {
                review_remarks: remarks,
                reviewed_by: profile.id
            })

            if (res.error) throw new Error(res.error)

            toast.success("IPCR reviewed successfully")
            onClose()
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!form) return null

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
            <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0">
                <SheetHeader className="p-6 border-b shrink-0 bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                            <ClipboardCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold">Review IPCR — {form.employee?.full_name}</SheetTitle>
                            <SheetDescription className="flex items-center gap-2">
                                {form.division?.name} · {form.rating_period?.name}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-8">

                            {/* Outputs Table */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        Project Staff's Performance Outputs
                                    </h3>
                                    <Badge variant="outline">{form.outputs?.length} Outputs</Badge>
                                </div>

                                <div className="rounded-xl border border-border overflow-hidden bg-card">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[40%]">Output / Indicators</TableHead>
                                                <TableHead>Accomplishments</TableHead>
                                                <TableHead className="text-center">Q</TableHead>
                                                <TableHead className="text-center">E</TableHead>
                                                <TableHead className="text-center">T</TableHead>
                                                <TableHead className="text-center">Avg</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {form.outputs?.map((o) => (
                                                <TableRow key={o.id}>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <p className="font-semibold text-xs leading-tight">{o.output_title}</p>
                                                            <p className="text-[10px] text-muted-foreground line-clamp-2">{o.success_indicator}</p>
                                                            <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0 h-4">
                                                                {o.category?.replace('_', ' ')}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-[11px] text-muted-foreground align-top py-4">
                                                        {o.actual_accomplishments || "No accomplishments encoded yet"}
                                                    </TableCell>
                                                    <TableCell className="text-center font-medium">{o.rating_q || '—'}</TableCell>
                                                    <TableCell className="text-center font-medium">{o.rating_e || '—'}</TableCell>
                                                    <TableCell className="text-center font-medium">{o.rating_t || '—'}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-bold text-primary">
                                                            {o.average_rating ? o.average_rating.toFixed(2) : (o.rating_q && o.rating_e && o.rating_t ? ((o.rating_q + o.rating_e + o.rating_t) / 3).toFixed(2) : '—')}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </section>

                            {/* Remarks Section */}
                            <section className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" /> Review Remarks
                                </h3>

                                <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-xl space-y-4">
                                    <FormFieldWrapper
                                        label="Remarks and Observations"
                                        required
                                        hint="Provide constructive feedback on the project staff's performance outputs"
                                    >
                                        <Textarea
                                            placeholder="Enter review remarks (min 20 characters)..."
                                            className="min-h-[120px] bg-white border-blue-200 focus-visible:ring-blue-500"
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                        />
                                    </FormFieldWrapper>

                                    <div className="flex items-start gap-2 text-xs text-blue-600 font-medium italic">
                                        <Info className="h-4 w-4 shrink-0" />
                                        <p>Your remarks will be visible to the project staff and the Provincial Assessor during final approval.</p>
                                    </div>
                                </div>
                            </section>

                        </div>
                    </ScrollArea>
                </div>

                <SheetFooter className="p-6 border-t bg-slate-50 shrink-0 gap-3">
                    <Button variant="outline" className="flex-1 h-11" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 h-11 shadow-lg shadow-primary/20"
                        onClick={handleReview}
                        disabled={isSubmitting || remarks.length < 20}
                    >
                        {isSubmitting ? "Submitting Review..." : "Submit Review"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
