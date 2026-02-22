'use client'

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ClipboardList, CheckCircle2, UserCircle, Calendar } from "lucide-react"
import { markPlanAchieved } from "@/app/actions/development-plan"
import { toast } from "sonner"
import { DevelopmentPlan } from "@/types/development-plan"
import { format } from "date-fns"

interface AchieveDialogProps {
    isOpen: boolean
    onClose: () => void
    plan: DevelopmentPlan | null
}

export function AchieveDialog({
    isOpen,
    onClose,
    plan
}: AchieveDialogProps) {
    const [achievedDate, setAchievedDate] = useState(new Date().toISOString().split('T')[0])
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!plan) return null

    const handleConfirm = async () => {
        if (!achievedDate) {
            toast.error("Please specify achievement date")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await markPlanAchieved(plan.id, achievedDate)
            if (res.error) throw new Error(res.error)

            toast.success("Development plan marked as achieved")
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <DialogTitle>Mark Plan as Achieved</DialogTitle>
                    </div>
                    <DialogDescription>
                        This will mark the development plan as completed. The achieved date will be recorded for performance documentation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-700">{plan.employee?.full_name}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <ClipboardList className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-600 italic line-clamp-2">"{plan.aim}"</p>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] uppercase font-bold text-slate-500">Target: {plan.target_date ? format(new Date(plan.target_date), "MMM d, yyyy") : "None"}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="achieved-date" className="text-sm font-bold">Achievement Date</Label>
                        <Input
                            id="achieved-date"
                            type="date"
                            value={achievedDate}
                            onChange={(e) => setAchievedDate(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700 gap-2"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Confirming..." : "Confirm Achievement"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
