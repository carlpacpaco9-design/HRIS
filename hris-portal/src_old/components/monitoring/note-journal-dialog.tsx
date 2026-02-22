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
import { Badge } from "@/components/ui/badge"
import { CheckCheck, Info } from "lucide-react"
import { toast } from "sonner"
import { noteMonitoringJournal } from "@/app/actions/monitoring"
import { MonitoringJournal } from "@/types/monitoring"
import { format } from "date-fns"

interface NoteJournalDialogProps {
    isOpen: boolean
    onClose: () => void
    journal: MonitoringJournal
    profile: any
}

export function NoteJournalDialog({
    isOpen,
    onClose,
    journal,
    profile
}: NoteJournalDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleNoteJournal = async () => {
        setIsSubmitting(true)
        try {
            const res = await noteMonitoringJournal(journal.id, profile.id)
            if (res.error) throw new Error(res.error)
            toast.success("Journal noted successfully")
            onClose()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const monitoringCount = journal.entries?.filter(e => e.activity_type === 'monitoring').length || 0
    const coachingCount = journal.entries?.filter(e => e.activity_type === 'coaching').length || 0
    const taskCount = journal.tasks?.length || 0
    const accomplishedCount = journal.tasks?.filter(t => t.date_accomplished).length || 0

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Note this Monitoring Journal</DialogTitle>
                    <DialogDescription>
                        Permanent acknowledgment of the division's monitoring activities.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-slate-50 border rounded-lg p-3 space-y-3">
                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                            <span className="text-muted-foreground">Division:</span>
                            <span className="font-bold text-right">{journal.division?.name}</span>

                            <span className="text-muted-foreground">Quarter:</span>
                            <span className="text-right">
                                <Badge variant="outline" className="h-4 text-[10px] font-bold">Q{journal.quarter}</Badge>
                            </span>

                            <span className="text-muted-foreground">Conducted by:</span>
                            <span className="font-bold text-right">{journal.conducted_by_profile?.full_name}</span>
                        </div>

                        <div className="h-px bg-border my-1" />

                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                            <span className="text-muted-foreground">Monitoring Activities:</span>
                            <span className="font-bold text-right">{monitoringCount}</span>

                            <span className="text-muted-foreground">Coaching Activities:</span>
                            <span className="font-bold text-right">{coachingCount}</span>

                            <span className="text-muted-foreground">Total Tasks Tracked:</span>
                            <span className="font-bold text-right">{taskCount}</span>

                            <span className="text-muted-foreground">Accomplished:</span>
                            <span className="font-bold text-right text-green-600 font-mono">{accomplishedCount} / {taskCount}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 text-xs leading-relaxed text-slate-600 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <p>
                            By noting this journal, you acknowledge that the monitoring and coaching activities recorded by <span className="font-bold text-slate-900">{journal.conducted_by_profile?.full_name}</span> for <span className="font-bold text-slate-900">Q{journal.quarter}</span> have been reviewed in accordance with CSC SPMS guidelines.
                        </p>
                    </div>

                    <div className="bg-muted rounded-lg p-3 text-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Noted By</p>
                            <p className="font-bold">{profile.full_name}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Date</p>
                            <p className="font-bold">{format(new Date(), "MMM d, yyyy")}</p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        onClick={handleNoteJournal}
                        disabled={isSubmitting}
                    >
                        <CheckCheck className="h-4 w-4" />
                        {isSubmitting ? "Processing..." : "Confirm — Note Journal"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
