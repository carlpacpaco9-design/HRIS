'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSPMSCycle } from '@/app/actions/spms-calendar'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

type CycleDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CycleDialog({
    open,
    onOpenChange,
}: CycleDialogProps) {
    const [name, setName] = useState('')
    const [periodStart, setPeriodStart] = useState('')
    const [periodEnd, setPeriodEnd] = useState('')
    const [isActive, setIsActive] = useState<boolean>(true)

    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (open) {
            setName('')
            setPeriodStart('')
            setPeriodEnd('')
            setIsActive(true)
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !periodStart || !periodEnd) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)

        const res = await createSPMSCycle({
            name,
            period_start: periodStart,
            period_end: periodEnd,
            is_active: isActive
        })

        setIsSubmitting(false)

        if (res.success) {
            toast.success('SPMS Cycle created successfully')
            onOpenChange(false)
        } else {
            toast.error(res.error || 'Operation failed')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New SPMS Cycle</DialogTitle>
                    <DialogDescription>
                        Create a new performance management period. Setting it as active will deactivate the current one.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Cycle Name *</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder='e.g. "January to June 2026"'
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Period Start *</Label>
                        <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required />
                    </div>

                    <div className="space-y-2">
                        <Label>Period End *</Label>
                        <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="is_active"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                        />
                        <label
                            htmlFor="is_active"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Set as Active
                        </label>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-[#1E3A5F]">
                            {isSubmitting ? 'Saving...' : 'Create Cycle'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
