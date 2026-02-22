'use client'

import { useState, useMemo, useEffect } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
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
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import {
    CheckCircle,
    RotateCcw,
    MessageSquare,
    Info,
    Calculator,
    Calendar,
    AlertCircle
} from "lucide-react"
import { approveIPCRForm, returnIPCRForm } from "@/app/actions/ipcr"
import { toast } from "sonner"
import { IPCRForm } from "@/types/ipcr"
import { cn } from "@/lib/utils"

interface IPCRApprovalDrawerProps {
    isOpen: boolean
    onClose: () => void
    form: IPCRForm | null
    profile: any
}

const RATING_LABELS: Record<number, string> = {
    5: "Outstanding",
    4: "Very Satisfactory",
    3: "Satisfactory",
    2: "Unsatisfactory",
    1: "Poor"
}

type ApprovalFormValues = {
    output_ratings: {
        output_id: string
        rating_q: number
        rating_e: number
        rating_t: number
        remarks: string
    }[]
    comments_recommendations: string
    discussed_with_employee: boolean
    discussion_date: string
}

export function IPCRApprovalDrawer({
    isOpen,
    onClose,
    form,
    profile
}: IPCRApprovalDrawerProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isReturning, setIsReturning] = useState(false)
    const [returnReason, setReturnReason] = useState("")
    const [showReturnDialog, setShowReturnDialog] = useState(false)
    const router = useRouter()

    const defaultValues = useMemo(() => {
        if (!form) return {}
        return {
            output_ratings: form.outputs?.map(o => ({
                output_id: o.id,
                rating_q: o.rating_q || 0,
                rating_e: o.rating_e || 0,
                rating_t: o.rating_t || 0,
                remarks: o.remarks || ""
            })) || [],
            comments_recommendations: form.comments_recommendations || "",
            discussed_with_employee: false,
            discussion_date: new Date().toISOString().split('T')[0]
        }
    }, [form])

    const { register, control, handleSubmit, setValue, getValues, watch } = useForm<ApprovalFormValues>({
        defaultValues: defaultValues as ApprovalFormValues
    })

    const { fields } = useFieldArray({
        control,
        name: "output_ratings"
    })

    const watchedRatings = watch("output_ratings")

    const rowAverages = useMemo(() => {
        return watchedRatings?.map(o => {
            const q = Number(o.rating_q) || 0
            const e = Number(o.rating_e) || 0
            const t = Number(o.rating_t) || 0
            const counts = [o.rating_q, o.rating_e, o.rating_t].filter(r => r > 0).length
            return counts > 0 ? (q + e + t) / counts : 0
        }) || []
    }, [watchedRatings])

    const finalAverage = useMemo(() => {
        const validScores = rowAverages.filter((a: number) => a > 0)
        return validScores.length > 0 ? validScores.reduce((acc: number, v: number) => acc + v, 0) / validScores.length : 0
    }, [rowAverages])

    const adjectivalRating = useMemo(() => {
        const rounded = Math.round(finalAverage)
        return RATING_LABELS[rounded] || "N/A"
    }, [finalAverage])

    // Reset form when drawer opens with new form
    useEffect(() => {
        if (isOpen && form) {
            setValue('output_ratings', form.outputs?.map(o => ({
                output_id: o.id,
                rating_q: o.rating_q || 0,
                rating_e: o.rating_e || 0,
                rating_t: o.rating_t || 0,
                remarks: o.remarks || ""
            })) || [])
            setValue('comments_recommendations', form.comments_recommendations || "")
        }
    }, [isOpen, form, setValue])

    const handleApprove = async (data: any) => {
        if (!form) return
        if (!data.comments_recommendations || data.comments_recommendations.length < 5) {
            toast.error("Please provide comments and recommendations")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await approveIPCRForm(form.id, {
                final_average_rating: finalAverage,
                adjectival_rating: adjectivalRating,
                comments_recommendations: data.comments_recommendations,
                output_ratings: data.output_ratings
            })

            if (res.error) throw new Error(res.error)

            toast.success("IPCR approved successfully")
            onClose()
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReturn = async () => {
        if (!form) return
        if (returnReason.length < 20) {
            toast.error("Return reason must be at least 20 characters long")
            return
        }

        setIsReturning(true)
        try {
            const res = await returnIPCRForm(form.id, {
                return_reason: returnReason
            })

            if (res.error) throw new Error(res.error)

            toast.success("IPCR returned for revision")
            setShowReturnDialog(false)
            onClose()
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsReturning(false)
        }
    }

    if (!form) return null

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
            <SheetContent side="right" className="sm:max-w-3xl w-full flex flex-col p-0 overflow-hidden">
                <SheetHeader className="p-6 border-b shrink-0 bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold">Approve IPCR — {form.employee?.full_name}</SheetTitle>
                            <SheetDescription>
                                {form.division?.name} · {form.rating_period?.name}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-8 pb-10">

                            {/* Outputs Ratings Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                        Performance Outputs — Final Rating
                                    </h3>
                                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Head Review</Badge>
                                </div>

                                <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[35%]">MFO / Indicator</TableHead>
                                                <TableHead className="text-center w-[10%]">Q</TableHead>
                                                <TableHead className="text-center w-[10%]">E</TableHead>
                                                <TableHead className="text-center w-[10%]">T</TableHead>
                                                <TableHead className="text-center w-[10%] text-primary">Avg</TableHead>
                                                <TableHead className="w-[25%]">Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {form.outputs?.map((o, index) => (
                                                <TableRow key={o.id}>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <p className="font-semibold text-[11px] leading-tight line-clamp-2">{o.output_title}</p>
                                                            <p className="text-[10px] text-muted-foreground line-clamp-1 italic">{o.success_indicator}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input
                                                            type="number" step="0.5" min="1" max="5"
                                                            className="h-8 text-center px-1 font-medium bg-white border-primary/20 focus-visible:ring-primary"
                                                            {...register(`output_ratings.${index}.rating_q`, { valueAsNumber: true })}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input
                                                            type="number" step="0.5" min="1" max="5"
                                                            className="h-8 text-center px-1 font-medium bg-white border-primary/20 focus-visible:ring-primary"
                                                            {...register(`output_ratings.${index}.rating_e`, { valueAsNumber: true })}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input
                                                            type="number" step="0.5" min="1" max="5"
                                                            className="h-8 text-center px-1 font-medium bg-white border-primary/20 focus-visible:ring-primary"
                                                            {...register(`output_ratings.${index}.rating_t`, { valueAsNumber: true })}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="font-bold text-primary text-xs">
                                                            {rowAverages[index] > 0 ? rowAverages[index].toFixed(2) : "—"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="p-2">
                                                        <Input
                                                            placeholder="Notes..."
                                                            className="h-8 text-[10px] bg-white border-muted"
                                                            {...register(`output_ratings.${index}.remarks`)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </section>

                            {/* Final Assessment Section */}
                            <section className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                    <div className="flex flex-col items-center justify-center p-8 bg-primary/5 rounded-2xl border border-primary/20 relative group">
                                        <Calculator className="absolute top-2 right-2 h-10 w-10 opacity-5" />
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Final Average Rating</span>
                                        <span className="text-5xl font-black text-primary tracking-tighter">{finalAverage.toFixed(2)}</span>
                                        <Badge className={cn(
                                            "mt-3 px-4 py-1 text-[10px] h-6",
                                            finalAverage >= 4.5 ? "bg-green-600" :
                                                finalAverage >= 3.5 ? "bg-blue-600" :
                                                    finalAverage >= 2.5 ? "bg-amber-600" :
                                                        "bg-red-600"
                                        )}>
                                            {adjectivalRating}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <FormFieldWrapper label="Comments & Recommendations" required>
                                            <Textarea
                                                placeholder="Provide final assessment remarks..."
                                                className="min-h-[140px] resize-none border-primary/20 shadow-sm"
                                                {...register("comments_recommendations")}
                                            />
                                        </FormFieldWrapper>
                                    </div>
                                </div>

                                <div className="bg-muted/40 p-4 rounded-xl border border-border flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="discussed"
                                            {...register("discussed_with_employee")}
                                        />
                                        <label htmlFor="discussed" className="text-sm font-medium leading-none cursor-pointer">
                                            Discussed with employee (CSC Compliance)
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            className="h-8 w-[140px] text-xs"
                                            {...register("discussion_date")}
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex gap-3 text-xs text-blue-700">
                                <Info className="h-5 w-5 shrink-0" />
                                <p>
                                    Approval represents the final validation of the employee's performance outputs.
                                    Once approved, the rating will be locked and can only be modified by the PMT or Admin.
                                </p>
                            </div>

                        </div>
                    </ScrollArea>
                </div>

                <SheetFooter className="p-6 border-t bg-slate-50 shrink-0 gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 h-11 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                        onClick={() => setShowReturnDialog(true)}
                        disabled={isSubmitting}
                    >
                        <RotateCcw className="h-4 w-4 mr-2" /> Return for Revision
                    </Button>
                    <Button
                        className="flex-1 h-11 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                        onClick={handleSubmit(handleApprove)}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Approving..." : "Approve IPCR"}
                    </Button>
                </SheetFooter>
            </SheetContent>

            {/* Return Reason Dialog */}
            <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600 uppercase tracking-tight font-bold">
                            <RotateCcw className="h-5 w-5" /> Return IPCR for Revision
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <FormFieldWrapper
                            label="Reason for returning"
                            required
                            hint="Specify what needs to be improved or corrected."
                        >
                            <Textarea
                                placeholder="Ex: Please clarify output #2 targets as they seem unrealistic..."
                                className="min-h-[120px] focus:ring-amber-500"
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                            />
                        </FormFieldWrapper>
                        {returnReason.length < 20 && returnReason.length > 0 && (
                            <p className="text-[10px] text-amber-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Minimum 20 characters required.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700"
                            onClick={handleReturn}
                            disabled={isReturning || returnReason.length < 20}
                        >
                            {isReturning ? "Returning..." : "Confirm Return"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Sheet>
    )
}
