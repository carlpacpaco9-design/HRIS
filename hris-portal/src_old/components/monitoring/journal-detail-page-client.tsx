'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    ChevronLeft,
    CalendarClock,
    FileText,
    Plus,
    Send,
    CheckCheck,
    Save,
    Trash2,
    PencilLine,
    CheckCircle,
    UserCircle,
    ClipboardList,
    Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import { MonitoringJournal, MonitoringEntry, MonitoringTask } from "@/types/monitoring"
import {
    submitMonitoringJournal,
    deleteMonitoringEntry,
    deleteMonitoringTask,
    updateMonitoringTask
} from "@/app/actions/monitoring"
import { ActivityDialog } from "@/components/monitoring/activity-dialog"
import { TaskDialog } from "@/components/monitoring/task-dialog"
import { NoteJournalDialog } from "@/components/monitoring/note-journal-dialog"
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

interface JournalDetailPageClientProps {
    profile: any
    journal: MonitoringJournal
    employees: any[]
}

export function JournalDetailPageClient({
    profile,
    journal,
    employees
}: JournalDetailPageClientProps) {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Handle hydration
    useEffect(() => {
        setMounted(true)
    }, [])

    // Dialog states
    const [activityDialogOpen, setActivityDialogOpen] = useState(false)
    const [editingActivity, setEditingActivity] = useState<MonitoringEntry | undefined>()
    const [activityType, setActivityType] = useState<'monitoring' | 'coaching'>('monitoring')

    const [taskDialogOpen, setTaskDialogOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<MonitoringTask | undefined>()

    const [noteDialogOpen, setNoteDialogOpen] = useState(false)

    const isDraft = journal.status === 'draft'
    const isSubmitted = journal.status === 'submitted'
    const isChief = profile.role === 'division_chief'
    const isHead = profile.role === 'head_of_office'

    const handleOpenActivityDialog = (type: 'monitoring' | 'coaching', activity?: MonitoringEntry) => {
        setActivityType(type)
        setEditingActivity(activity)
        setActivityDialogOpen(true)
    }

    const handleOpenTaskDialog = (task?: MonitoringTask) => {
        setEditingTask(task)
        setTaskDialogOpen(true)
    }

    const handleSubmitJournal = async () => {
        setIsSubmitting(true)
        try {
            const res = await submitMonitoringJournal(journal.id)
            if (res.error) throw new Error(res.error)
            toast.success("Journal submitted successfully")
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteActivity = async (id: string) => {
        try {
            const res = await deleteMonitoringEntry(id)
            if (res.error) throw new Error(res.error)
            toast.success("Activity deleted")
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleDeleteTask = async (id: string) => {
        try {
            const res = await deleteMonitoringTask(id)
            if (res.error) throw new Error(res.error)
            toast.success("Task deleted")
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const handleMarkTaskAccomplished = async (id: string) => {
        try {
            const res = await updateMonitoringTask(id, {
                date_accomplished: new Date().toISOString().split('T')[0]
            })
            if (res.error) throw new Error(res.error)
            toast.success("Task marked as accomplished")
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    const getMechanismLabel = (mechanism: string, other?: string) => {
        const labels: Record<string, string> = {
            'one_on_one': 'One-on-One Meeting',
            'group_meeting': 'Group Meeting',
            'memo': 'Written Memo',
            'field_visit': 'Field Visit/Observation',
            'email': 'Email Correspondence',
            'other': `Other: ${other}`
        }
        return labels[mechanism] || mechanism
    }

    const getTaskStatus = (task: MonitoringTask) => {
        if (task.date_accomplished) return { label: "Accomplished", color: "bg-green-100 text-green-700" }
        if (task.date_assigned) {
            if (!mounted) return { label: "—", color: "bg-slate-100 text-slate-700" }
            const assignedDate = new Date(task.date_assigned)
            if (assignedDate < new Date()) return { label: "Pending", color: "bg-amber-100 text-amber-700" }
            return { label: "Upcoming", color: "bg-blue-100 text-blue-700" }
        }
        return { label: "Not Started", color: "bg-slate-100 text-slate-700" }
    }

    const renderStatusBadge = (status: string) => {
        const variants: Record<string, { bg: string, text: string, label: string }> = {
            'draft': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Draft' },
            'submitted': { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Submitted' },
            'noted': { bg: 'bg-green-100', text: 'text-green-600', label: 'Noted' }
        }
        const v = variants[status] || variants.draft
        return <Badge className={cn("border-none", v.bg, v.text)}>{v.label}</Badge>
    }

    const monitoringEntries = journal.entries?.filter(e => e.activity_type === 'monitoring') || []
    const coachingEntries = journal.entries?.filter(e => e.activity_type === 'coaching') || []

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Q{journal.quarter} Monitoring Journal</h1>
                            {renderStatusBadge(journal.status)}
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {journal.rating_period?.name} · {journal.division?.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isDraft && isChief && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className="gap-2" disabled={monitoringEntries.length === 0 && coachingEntries.length === 0}>
                                    <Send className="h-4 w-4" /> Submit Journal
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Submit Monitoring Journal?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will send the journal to the Provincial Assessor for notation. You will won't be able to make further changes.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSubmitJournal}>Submit Now</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    {isSubmitted && isHead && (
                        <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={() => setNoteDialogOpen(true)}>
                            <CheckCheck className="h-4 w-4" /> Note Journal
                        </Button>
                    )}
                </div>
            </div>

            {/* Header Card */}
            <Card className="bg-muted/30 border-none shadow-sm overflow-hidden">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Division / Office</p>
                            <p className="font-semibold text-slate-800">{journal.division?.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conducted By</p>
                            <p className="font-semibold text-slate-800">{journal.conducted_by_profile?.full_name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conducted Date</p>
                            <p className="font-semibold text-slate-800">{journal.conducted_date ? format(new Date(journal.conducted_date), "MMMM d, yyyy") : "Not set"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Noted By</p>
                            <p className="font-semibold text-slate-800">{journal.noted_by_profile?.full_name || <span className="text-muted-foreground italic font-normal">Pending</span>}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="activities" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="activities" className="gap-2">
                        <Users className="h-4 w-4" /> Monitoring & Coaching
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="gap-2">
                        <ClipboardList className="h-4 w-4" /> Task Tracking
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Monitoring & Coaching Activities */}
                <TabsContent value="activities" className="space-y-8 pt-6">
                    {/* A. Monitoring Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-slate-800">Monitoring Activities</h2>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-600">{monitoringEntries.length}</Badge>
                            </div>
                            {isDraft && isChief && (
                                <Button size="sm" variant="outline" onClick={() => handleOpenActivityDialog('monitoring')}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Monitoring
                                </Button>
                            )}
                        </div>

                        <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="w-[120px]">Date</TableHead>
                                        <TableHead className="w-[180px]">Mechanism</TableHead>
                                        <TableHead>Participants</TableHead>
                                        <TableHead>Notes</TableHead>
                                        {isDraft && isChief && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monitoringEntries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                                                No monitoring activities recorded yet
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        monitoringEntries.map((e) => (
                                            <TableRow key={e.id}>
                                                <TableCell className="font-medium">{format(new Date(e.activity_date), "MMM d, yyyy")}</TableCell>
                                                <TableCell>{getMechanismLabel(e.mechanism, e.mechanism_other)}</TableCell>
                                                <TableCell>
                                                    <div className="flex -space-x-2">
                                                        {e.participants.slice(0, 3).map((p, i) => (
                                                            <div key={i} className="w-7 h-7 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary" title={p}>
                                                                {p.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                        ))}
                                                        {e.participants.length > 3 && (
                                                            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                +{e.participants.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[300px] truncate" title={e.notes}>{e.notes || "—"}</TableCell>
                                                {isDraft && isChief && (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenActivityDialog('monitoring', e)}>
                                                                <PencilLine className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteActivity(e.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* B. Coaching Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-slate-800">Coaching Activities</h2>
                                <Badge variant="secondary" className="bg-amber-50 text-amber-600">{coachingEntries.length}</Badge>
                            </div>
                            {isDraft && isChief && (
                                <Button size="sm" variant="outline" onClick={() => handleOpenActivityDialog('coaching')}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Coaching
                                </Button>
                            )}
                        </div>

                        <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="w-[120px]">Date</TableHead>
                                        <TableHead className="w-[180px]">Mechanism</TableHead>
                                        <TableHead>Participants</TableHead>
                                        <TableHead>Notes</TableHead>
                                        {isDraft && isChief && <TableHead className="text-right">Actions</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {coachingEntries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                                                No coaching activities recorded yet
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        coachingEntries.map((e) => (
                                            <TableRow key={e.id}>
                                                <TableCell className="font-medium">{format(new Date(e.activity_date), "MMM d, yyyy")}</TableCell>
                                                <TableCell>{getMechanismLabel(e.mechanism, e.mechanism_other)}</TableCell>
                                                <TableCell>
                                                    <div className="flex -space-x-2">
                                                        {e.participants.slice(0, 3).map((p, i) => (
                                                            <div key={i} className="w-7 h-7 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary" title={p}>
                                                                {p.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                        ))}
                                                        {e.participants.length > 3 && (
                                                            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                +{e.participants.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[300px] truncate" title={e.notes}>{e.notes || "—"}</TableCell>
                                                {isDraft && isChief && (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenActivityDialog('coaching', e)}>
                                                                <PencilLine className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteActivity(e.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                {/* Tab 2: Task Tracking Tool */}
                <TabsContent value="tasks" className="space-y-4 pt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-slate-800">Task Tracking Tool</h2>
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-600">{journal.tasks?.length || 0}</Badge>
                        </div>
                        {isDraft && isChief && (
                            <Button size="sm" variant="outline" onClick={() => handleOpenTaskDialog()}>
                                <Plus className="h-4 w-4 mr-2" /> Add Task
                            </Button>
                        )}
                    </div>

                    <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[100px]">Task ID</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Action Officer</TableHead>
                                    <TableHead>Output</TableHead>
                                    <TableHead>Assigned</TableHead>
                                    <TableHead>Accomplished</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Remarks</TableHead>
                                    {isDraft && isChief && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {journal.tasks?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-48 text-center text-muted-foreground italic">
                                            No tasks recorded yet
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    journal.tasks?.map((t) => {
                                        const status = getTaskStatus(t)
                                        return (
                                            <TableRow key={t.id}>
                                                <TableCell className="font-mono text-[10px]">{t.task_id_no || "—"}</TableCell>
                                                <TableCell className="font-medium">{t.subject}</TableCell>
                                                <TableCell>{t.action_officer?.full_name || "—"}</TableCell>
                                                <TableCell className="max-w-[150px] truncate" title={t.output}>{t.output || "—"}</TableCell>
                                                <TableCell className="text-xs">{t.date_assigned ? format(new Date(t.date_assigned), "MMM d") : "—"}</TableCell>
                                                <TableCell className="text-xs">{t.date_accomplished ? format(new Date(t.date_accomplished), "MMM d") : "—"}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn("border-none text-[10px]", status.color)}>{status.label}</Badge>
                                                </TableCell>
                                                <TableCell className="max-w-[150px] truncate" title={t.remarks}>{t.remarks || "—"}</TableCell>
                                                {isDraft && isChief && (
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            {!t.date_accomplished && (
                                                                <Button
                                                                    variant="ghost" size="icon" className="h-8 w-8 text-green-600"
                                                                    onClick={() => handleMarkTaskAccomplished(t.id)}
                                                                    title="Mark Accomplished"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenTaskDialog(t)}>
                                                                <PencilLine className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteTask(t.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <ActivityDialog
                isOpen={activityDialogOpen}
                onClose={() => setActivityDialogOpen(false)}
                journal={journal}
                activityType={activityType}
                initialData={editingActivity}
                employees={employees}
            />

            <TaskDialog
                isOpen={taskDialogOpen}
                onClose={() => setTaskDialogOpen(false)}
                journal={journal}
                initialData={editingTask}
                employees={employees}
            />

            <NoteJournalDialog
                isOpen={noteDialogOpen}
                onClose={() => setNoteDialogOpen(false)}
                journal={journal}
                profile={profile}
            />
        </div>
    )
}
