'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createDevelopmentPlan, updateDevelopmentPlan, markPlanAchieved } from '@/app/actions/development-plans'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

type DevPlanSheetProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    plan: any
    employees: any[]
    canEdit: boolean
}

export function DevPlanSheet({
    open,
    onOpenChange,
    plan,
    employees,
    canEdit
}: DevPlanSheetProps) {
    const [employeeId, setEmployeeId] = useState('')
    const [aim, setAim] = useState('')
    const [objective, setObjective] = useState('')
    const [tasks, setTasks] = useState('')
    const [outcome, setOutcome] = useState('')
    const [nextStep, setNextStep] = useState('')
    const [targetDate, setTargetDate] = useState('')
    const [reviewDate, setReviewDate] = useState('')
    const [achievedDate, setAchievedDate] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (open) {
            if (plan) {
                setEmployeeId(plan.employee_id)
                setAim(plan.aim || '')
                setObjective(plan.objective || '')
                setTasks(plan.tasks || '')
                setOutcome(plan.outcome || '')
                setNextStep(plan.next_step || '')
                setTargetDate(plan.target_date || '')
                setReviewDate(plan.review_date || '')
                setAchievedDate(plan.achieved_date || '')
            } else {
                setEmployeeId('')
                setAim('')
                setObjective('')
                setTasks('')
                setOutcome('')
                setNextStep('')
                setTargetDate('')
                setReviewDate('')
                setAchievedDate('')
            }
        }
    }, [open, plan])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canEdit) return

        if (!employeeId || !aim || !objective || !tasks || !outcome || !nextStep || !targetDate) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)

        const payload = {
            employee_id: employeeId,
            aim,
            objective,
            tasks,
            outcome,
            next_step: nextStep,
            target_date: targetDate,
            review_date: reviewDate
        }

        let res
        if (plan) {
            res = await updateDevelopmentPlan(plan.id, payload)
        } else {
            res = await createDevelopmentPlan(payload)
        }

        setIsSubmitting(false)

        if (res.success) {
            toast.success(plan ? 'Development Plan Updated' : 'Development Plan Created')
            onOpenChange(false)
        } else {
            toast.error(res.error || 'Operation failed')
        }
    }

    const handleMarkAchieved = async () => {
        if (!canEdit || !plan) return
        if (!achievedDate) {
            toast.error('Please specify Achieved Date first')
            return
        }
        const res = await markPlanAchieved(plan.id, achievedDate)
        if (res.success) {
            toast.success('Plan marked as Achieved')
            onOpenChange(false)
        } else {
            toast.error(res.error || 'Operation failed')
        }
    }

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
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{plan ? 'Development Plan' : 'New Development Plan'}</SheetTitle>
                    <SheetDescription>
                        {plan && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="font-semibold text-slate-800">{plan.employee?.full_name}</span>
                                {getStatusBadge(plan.status)}
                            </div>
                        )}
                        {plan?.ipcr && (
                            <div className="mt-1 text-xs text-slate-500">Linked IPCR: {plan.ipcr.spms_cycles?.name}</div>
                        )}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-6">
                    {!plan && (
                        <div className="space-y-2">
                            <Label>Employee *</Label>
                            <Select value={employeeId} onValueChange={setEmployeeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Aim *</Label>
                            <Input value={aim} onChange={e => setAim(e.target.value)} disabled={!canEdit} required />
                        </div>

                        <div className="space-y-2">
                            <Label>Objective *</Label>
                            <Input value={objective} onChange={e => setObjective(e.target.value)} disabled={!canEdit} required />
                        </div>

                        <div className="space-y-2">
                            <Label>Tasks *</Label>
                            <Textarea value={tasks} onChange={e => setTasks(e.target.value)} disabled={!canEdit} rows={2} required />
                        </div>

                        <div className="space-y-2">
                            <Label>Outcome *</Label>
                            <Textarea value={outcome} onChange={e => setOutcome(e.target.value)} disabled={!canEdit} rows={2} required />
                        </div>

                        <div className="space-y-2">
                            <Label>Next Step *</Label>
                            <Textarea value={nextStep} onChange={e => setNextStep(e.target.value)} disabled={!canEdit} rows={2} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Target Date *</Label>
                            <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} disabled={!canEdit} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Review Date</Label>
                            <Input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} disabled={!canEdit} />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Achieved Date {plan && <span className="text-xs font-normal text-slate-500">(Required for resolving)</span>}</Label>
                            <Input type="date" value={achievedDate} onChange={e => setAchievedDate(e.target.value)} disabled={!canEdit} />
                        </div>
                    </div>

                    {canEdit && (
                        <div className="pt-4 flex flex-col sm:flex-row gap-3">
                            {plan && plan.status !== 'achieved' && (
                                <Button type="button" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 mr-auto" onClick={handleMarkAchieved}>
                                    Mark Achieved
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-[#1E3A5F]">
                                {isSubmitting ? 'Saving...' : 'Save Plan'}
                            </Button>
                        </div>
                    )}
                </form>
            </SheetContent>
        </Sheet>
    )
}
