'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createAward } from '@/app/actions/rewards'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from '@/utils/supabase/client'

type GiveAwardDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    employees: any[]
}

export function GiveAwardDialog({
    open,
    onOpenChange,
    employees
}: GiveAwardDialogProps) {
    const [employeeId, setEmployeeId] = useState('')
    const [awardType, setAwardType] = useState('')
    const [otherAwardType, setOtherAwardType] = useState('')
    const [awardPeriod, setAwardPeriod] = useState('')
    const [basisIpcrId, setBasisIpcrId] = useState<string>('none')
    const [givenAt, setGivenAt] = useState('')
    const [remarks, setRemarks] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [finalizedIpcrs, setFinalizedIpcrs] = useState<any[]>([])

    useEffect(() => {
        if (open) {
            setEmployeeId('')
            setAwardType('')
            setOtherAwardType('')
            setAwardPeriod('')
            setBasisIpcrId('none')
            setGivenAt(new Date().toISOString().split('T')[0] || '')
            setRemarks('')
        }
    }, [open])

    useEffect(() => {
        async function loadIpcrs() {
            if (!employeeId) {
                setFinalizedIpcrs([])
                setBasisIpcrId('none')
                return
            }
            const supabase = createClient()
            const { data } = await supabase
                .from('ipcr_forms')
                .select('id, spms_cycles(name)')
                .eq('employee_id', employeeId)
                .eq('status', 'finalized')
                .order('created_at', { ascending: false })

            setFinalizedIpcrs(data || [])
            setBasisIpcrId('none')
        }
        loadIpcrs()
    }, [employeeId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const finalAwardType = awardType === 'Other' ? otherAwardType : awardType

        if (!employeeId || !finalAwardType || !awardPeriod || !givenAt) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)

        const res = await createAward({
            employee_id: employeeId,
            award_type: finalAwardType,
            award_period: awardPeriod,
            basis_ipcr_id: basisIpcrId !== 'none' ? basisIpcrId : undefined,
            given_at: givenAt,
            remarks
        })

        setIsSubmitting(false)

        if (res.success) {
            toast.success('Award given successfully')
            onOpenChange(false)
        } else {
            toast.error(res.error || 'Operation failed')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Give Award</DialogTitle>
                    <DialogDescription>
                        Record PRAISE awards and recognitions for an employee.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
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

                    <div className="space-y-2">
                        <Label>Award Type *</Label>
                        <Select value={awardType} onValueChange={setAwardType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Award Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PRAISE Award">PRAISE Award</SelectItem>
                                <SelectItem value="Best Employee">Best Employee</SelectItem>
                                <SelectItem value="Best Division">Best Division</SelectItem>
                                <SelectItem value="Certificate of Recognition">Certificate of Recognition</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {awardType === 'Other' && (
                        <div className="space-y-2">
                            <Label>Specify Award Type *</Label>
                            <Input value={otherAwardType} onChange={e => setOtherAwardType(e.target.value)} required />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Period *</Label>
                        <Input
                            value={awardPeriod}
                            onChange={e => setAwardPeriod(e.target.value)}
                            placeholder="e.g. January to June 2026"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Basis IPCR (Optional)</Label>
                        <Select value={basisIpcrId} onValueChange={setBasisIpcrId} disabled={!employeeId || finalizedIpcrs.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder={!employeeId ? "Select an employee first" : finalizedIpcrs.length === 0 ? "No finalized IPCRs found" : "Select IPCR basis"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {finalizedIpcrs.map(ipcr => (
                                    <SelectItem key={ipcr.id} value={ipcr.id}>{ipcr.spms_cycles?.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Date Given *</Label>
                        <Input type="date" value={givenAt} onChange={e => setGivenAt(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                        <Label>Remarks</Label>
                        <Textarea
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            rows={3}
                            className="resize-none"
                            placeholder="Additional details..."
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-[#1E3A5F]">
                            {isSubmitting ? 'Saving...' : 'Give Award'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
