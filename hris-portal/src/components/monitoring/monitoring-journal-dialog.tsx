'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Eye, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createMonitoringJournal, updateMonitoringJournal } from '@/app/actions/monitoring'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { isHRManager, Role } from '@/lib/roles'

type MonitoringJournalDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    journal: any
    employees: any[]
    cycles: any[]
    currentUserId: string
}

export function MonitoringJournalDialog({
    open,
    onOpenChange,
    journal,
    employees,
    cycles,
    currentUserId
}: MonitoringJournalDialogProps) {
    const [employeeId, setEmployeeId] = useState('')
    const [cycleId, setCycleId] = useState('')
    const [quarter, setQuarter] = useState<string>('1')
    const [dateConducted, setDateConducted] = useState('')
    const [mechanism, setMechanism] = useState('One-on-One')
    const [notes, setNotes] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (open) {
            if (journal) {
                setEmployeeId(journal.employee_id)
                setCycleId(journal.spms_cycle_id)
                setQuarter(journal.quarter.toString())
                setDateConducted(journal.date_conducted)
                setMechanism(journal.monitoring_mechanism)
                setNotes(journal.coaching_notes || '')
            } else {
                setEmployeeId('')
                setCycleId(cycles.find(c => c.is_active)?.id || '')
                setQuarter('1')
                setDateConducted(new Date().toISOString().split('T')[0] || '')
                setMechanism('One-on-One')
                setNotes('')
            }
        }
    }, [open, journal, cycles])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!employeeId || !cycleId || !quarter || !dateConducted || !mechanism) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)

        const payload = {
            employee_id: employeeId,
            spms_cycle_id: cycleId,
            quarter: parseInt(quarter) as 1 | 2 | 3 | 4,
            monitoring_mechanism: mechanism as any,
            coaching_notes: notes,
            date_conducted: dateConducted
        }

        let res
        if (journal) {
            res = await updateMonitoringJournal(journal.id, payload)
        } else {
            res = await createMonitoringJournal(payload)
        }

        setIsSubmitting(false)

        if (res.success) {
            toast.success(journal ? 'Journal Entry Updated' : 'Journal Entry Created')
            onOpenChange(false)
        } else {
            toast.error(res.error || 'Operation failed')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{journal ? 'Edit Entry' : 'New Monitoring Journal'}</DialogTitle>
                    <DialogDescription>
                        Record performance tracking and coaching activities.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Employee *</Label>
                        <Select value={employeeId} onValueChange={setEmployeeId} disabled={!!journal}>
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

                    <div className="space-y-2">
                        <Label>SPMS Cycle *</Label>
                        <Select value={cycleId} onValueChange={setCycleId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Cycle" />
                            </SelectTrigger>
                            <SelectContent>
                                {cycles.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quarter *</Label>
                            <Select value={quarter} onValueChange={setQuarter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Quarter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1st Quarter</SelectItem>
                                    <SelectItem value="2">2nd Quarter</SelectItem>
                                    <SelectItem value="3">3rd Quarter</SelectItem>
                                    <SelectItem value="4">4th Quarter</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Date Conducted *</Label>
                            <Input type="date" value={dateConducted} onChange={e => setDateConducted(e.target.value)} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Mechanism *</Label>
                        <Select value={mechanism} onValueChange={setMechanism}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Mechanism" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="One-on-One">One-on-One</SelectItem>
                                <SelectItem value="Group Meeting">Group Meeting</SelectItem>
                                <SelectItem value="Memo">Memo</SelectItem>
                                <SelectItem value="Others">Others</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Coaching Notes / Remarks</Label>
                        <Textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={4}
                            className="resize-none"
                            placeholder="Summary of discussion..."
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-[#1E3A5F]">
                            {isSubmitting ? 'Saving...' : 'Save Entry'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
