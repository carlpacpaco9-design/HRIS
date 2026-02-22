'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Send, Clock, Target, ShieldCheck, CheckCircle2, Edit2 } from "lucide-react"
import { addTarget, deleteTarget, updateTarget, submitIPCR, cancelSubmission } from "@/app/actions/ipcr"
import { DownloadWordButton } from '@/components/ipcr/download-word-button'
import AccomplishmentInput from '@/components/ipcr/accomplishment-input'
import EvidenceModal from "@/components/ipcr/evidence-modal"

// Helper to map DB status to UI colors
const statusColors = {
    draft: 'bg-slate-500',
    pending_approval: 'bg-amber-500',
    approved: 'bg-blue-600',
    rated: 'bg-green-600'
}

const statusLabels = {
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    approved: 'Approved / Locked',
    rated: 'Rated'
}

import { TargetForm } from '@/components/ipcr/target-form'
import { TargetFormValues, IPCRFormValues } from '@/lib/validations'
import { IPCRForm } from '@/components/ipcr/ipcr-form'
import { toast } from 'sonner'
import { updateAccomplishments } from '@/app/actions/assessment'

export default function IPCRClient({ cycle, commitment, profile }: { cycle: any, commitment: any, profile: any }) {
    // Group targets locally for display
    const targets = commitment.spms_targets || []

    // Progress Calculation
    const completedTargets = targets.filter((t: any) => t.actual_accomplishment).length
    const progressPercentage = targets.length > 0 ? (completedTargets / targets.length) * 100 : 0

    // State for Tabs
    const [activeTab, setActiveTab] = useState('strategic')

    // Add/Edit Target States
    const [editingTarget, setEditingTarget] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isFullIPCRDrawerOpen, setIsFullIPCRDrawerOpen] = useState(false)

    // Automatic Status Detection
    const isEmpty = targets.length === 0
    const effectiveStatus = isEmpty ? 'draft' : commitment.status

    const isDraft = effectiveStatus === 'draft'
    const isPending = effectiveStatus === 'pending_approval'
    const isApproved = effectiveStatus === 'approved'
    const isRated = effectiveStatus === 'rated'

    // Permissions
    const canEditTargets = isDraft
    const canEditAccomplishments = isApproved
    const isReadOnly = isPending || isApproved || isRated

    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const categoryTitles = {
        strategic: { title: 'Strategic Priorities', desc: 'High-impact targets aligned with goals.', color: 'text-blue-700', bg: 'bg-blue-50' },
        core: { title: 'Core Functions', desc: 'Essential duties of your position.', color: 'text-indigo-700', bg: 'bg-indigo-50' },
        support: { title: 'Support Functions', desc: 'Ancillary tasks supporting core operations.', color: 'text-slate-700', bg: 'bg-slate-50' }
    }

    const info = categoryTitles[activeTab as keyof typeof categoryTitles]

    async function handleSave(data: TargetFormValues) {
        setIsSaving(true)

        if (editingTarget?.id) {
            const result = await updateTarget(editingTarget.id, { output: data.output, indicators: data.indicators })
            if (result.success) {
                setEditingTarget(null)
                setIsDialogOpen(false)
            }
        } else {
            const result = await addTarget(commitment.id, {
                mfo_category: activeTab,
                output: data.output,
                indicators: data.indicators
            })
            if (result.success) {
                setIsDialogOpen(false)
            }
        }
        setIsSaving(false)
    }

    function openEdit(target: any) {
        setEditingTarget(target)
        setIsDialogOpen(true)
    }

    function openAdd() {
        setEditingTarget(null)
        setIsDialogOpen(true)
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure?')) return
        await deleteTarget(id)
    }

    async function handleFullIPCRSubmit(data: IPCRFormValues) {
        setIsSaving(true)
        try {
            // Mapping logic: In a real app we'd need a batch update.
            // For now, we'll iterate through outputs.
            // Preservation of existing actions:
            for (const output of data.outputs) {
                // If this output title exists in our current targets, we might update.
                // But without IDs in the form, it's hard to track perfectly.
                // We'll treat this as a "Save Draft" or "Submission preparation" logic.
                // If it's a completely new output description, we add it.
                const existing = targets.find((t: any) => t.output === output.output_title)

                if (existing) {
                    await updateTarget(existing.id, {
                        output: output.output_title,
                        indicators: output.success_indicator
                    })
                    if (output.actual_accomplishments !== existing.actual_accomplishment) {
                        await updateAccomplishments(existing.id, output.actual_accomplishments || "")
                    }
                } else {
                    await addTarget(commitment.id, {
                        mfo_category: activeTab,
                        output: output.output_title,
                        indicators: output.success_indicator
                    })
                }
            }

            toast.success("IPCR updated successfully")
            setIsFullIPCRDrawerOpen(false)
            window.location.reload()
        } catch (err) {
            toast.error("Failed to save IPCR data")
        } finally {
            setIsSaving(false)
        }
    }

    if (!isMounted) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* 1. Global Page Actions (Top Right) */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="font-semibold text-slate-900">Performance Management</span>
                    <span>/</span>
                    <span>Individual Commitment</span>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsFullIPCRDrawerOpen(true)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Manage IPCR
                    </Button>

                    {effectiveStatus !== 'draft' && (
                        <div className="bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-slate-200 shadow-sm">
                            <DownloadWordButton commitmentId={commitment.id} />
                        </div>
                    )}

                    {!isEmpty && !isReadOnly && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-4">
                                    <Send className="mr-2 h-4 w-4" />
                                    Submit IPCR
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden bg-white border-none shadow-2xl">
                                <DialogHeader className="p-6 bg-white border-b border-slate-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-blue-100 p-2.5 rounded-xl">
                                            <Send className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Submit Commitment</DialogTitle>
                                    </div>
                                    <DialogDescription className="text-slate-500 text-sm leading-relaxed">
                                        Are you ready to submit your IPCR for review? Your supervisor will be notified to approve your targets.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" className="font-semibold text-slate-500 hover:text-slate-700 h-10">
                                            Cancel
                                        </Button>
                                    </DialogTrigger>
                                    <form action={async () => { await submitIPCR(commitment.id) }}>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-lg shadow-blue-200 rounded-xl h-10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                            Confirm Submission
                                        </Button>
                                    </form>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {commitment.status === 'pending_approval' && (
                        <form action={async () => { await cancelSubmission(commitment.id) }}>
                            <Button variant="outline" size="sm" type="submit" className="border-red-200 text-red-600 hover:bg-red-50">
                                Cancel Submission
                            </Button>
                        </form>
                    )}
                </div>
            </div>

            {/* 2. Main Layout (Sidebar Removed) */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                {/* Top Info Bar (Migrated from Sidebar) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="space-y-1">
                            <h1 className="font-bold text-slate-900 text-lg leading-tight">My IPCR</h1>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {cycle.title}</span>
                                <Badge className={`${statusColors[effectiveStatus as keyof typeof statusColors]} border-0 px-2 py-0.5 text-[10px]`}>
                                    {statusLabels[effectiveStatus as keyof typeof statusLabels]}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-1 md:max-w-md">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">Completion</span>
                        <div className="space-y-1 flex-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span>{Math.round(progressPercentage)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[600px] flex flex-col">

                    {/* 1. Header Section */}
                    <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900">{info.title}</h3>
                            <p className="text-sm text-slate-500">{info.desc}</p>
                        </div>

                        {!isReadOnly && (
                            <Dialog
                                open={isDialogOpen}
                                onOpenChange={(open) => {
                                    if (isSaving) return
                                    setIsDialogOpen(open)
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        onClick={openAdd}
                                        className={`${info.bg} ${info.color} hover:opacity-90 border-0 shadow-none font-medium h-10 px-4 rounded-lg`}
                                    >
                                        <Plus className="h-4 w-4 mr-1.5" />
                                        Add Target
                                    </Button>
                                </DialogTrigger>
                                <DialogContent
                                    className="sm:max-w-[550px] p-0 overflow-hidden bg-white border-none shadow-2xl max-h-[90vh] flex flex-col"
                                    onPointerDownOutside={(e) => { if (isSaving) e.preventDefault() }}
                                    onEscapeKeyDown={(e) => { if (isSaving) e.preventDefault() }}
                                >
                                    <DialogHeader className="p-6 bg-white border-b border-slate-100 flex-shrink-0">
                                        <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                                            {editingTarget ? 'Edit Target' : 'Add New Target'}
                                        </DialogTitle>
                                        <DialogDescription className="text-slate-500 mt-1 text-xs leading-relaxed">
                                            {editingTarget ? `Modify your ${info.title} target.` : `Define a new ${info.title} target.`}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex-1 overflow-y-auto">
                                        <TargetForm
                                            key={isDialogOpen ? (editingTarget?.id || 'new') : 'closed'}
                                            initialValues={{
                                                mfo_category: activeTab as any,
                                                output: editingTarget?.output || "",
                                                indicators: editingTarget?.indicators || ""
                                            }}
                                            onSubmit={handleSave}
                                            onCancel={() => setIsDialogOpen(false)}
                                            isSaving={isSaving}
                                            title={info.title}
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>


                    {/* 2. Navigation Tabs */}
                    <div className="px-6 py-5 bg-slate-50/30 border-b border-slate-100">
                        <TabsList className="flex flex-wrap w-full sm:w-auto bg-transparent p-0 gap-4 h-auto">
                            <TabsTrigger
                                value="strategic"
                                className="flex-1 sm:flex-none items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-blue-600 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-200"
                            >
                                <Target className="w-4 h-4" />
                                Strategic Priorities
                            </TabsTrigger>
                            <TabsTrigger
                                value="core"
                                className="flex-1 sm:flex-none items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-indigo-600 data-[state=active]:border-indigo-600 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-200"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Core Functions
                            </TabsTrigger>
                            <TabsTrigger
                                value="support"
                                className="flex-1 sm:flex-none items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 data-[state=active]:border-slate-800 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-slate-200"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Support Functions
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* 3. Content Area */}
                    <div className="flex-1">
                        {['strategic', 'core', 'support'].map((category) => (
                            <TabsContent key={category} value={category} className="mt-0 p-0 focus-visible:outline-none">
                                <TargetTable
                                    targets={targets.filter((t: any) => t.mfo_category === category)}
                                    isReadOnly={isReadOnly}
                                    status={effectiveStatus}
                                    handleDelete={handleDelete}
                                    handleEdit={openEdit}
                                    canEditAccomplishments={canEditAccomplishments}
                                />
                            </TabsContent>
                        ))}
                    </div>
                </div>
            </Tabs>

            <IPCRForm
                isOpen={isFullIPCRDrawerOpen}
                onOpenChange={setIsFullIPCRDrawerOpen}
                onSubmit={handleFullIPCRSubmit}
                onSaveDraft={handleFullIPCRSubmit}
                isSaving={isSaving}
                userDivision={profile?.department || "Administrative Division"}
                initialData={{
                    period_from: cycle.start_date,
                    period_to: cycle.end_date,
                    outputs: targets.map((t: any) => ({
                        output_title: t.output,
                        success_indicator: t.indicators,
                        actual_accomplishments: t.actual_accomplishment || "",
                        rating_q: t.quality_score,
                        rating_e: t.quantity_score,
                        rating_t: t.timeliness_score,
                        rating_average: t.average_score,
                        remarks: t.remarks || ""
                    }))
                } as any}
            />
        </div >
    )
}

function TargetTable({ targets, isReadOnly, status, handleDelete, handleEdit, canEditAccomplishments }: any) {
    const showAccomplishmentColumn = status !== 'draft'

    return (
        <div className="relative w-full overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                        <TableHead className="w-[30%] font-bold text-slate-700 uppercase text-xs tracking-wider py-4 pl-6">Major Final Output</TableHead>
                        <TableHead className="w-[35%] font-bold text-slate-700 uppercase text-xs tracking-wider py-4">Success Indicators</TableHead>
                        {showAccomplishmentColumn && <TableHead className="w-[30%] font-bold text-slate-700 uppercase text-xs tracking-wider py-4">Actual Accomplishments</TableHead>}
                        {!isReadOnly && <TableHead className="w-[10%] py-4"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {targets.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={showAccomplishmentColumn ? 4 : 3} className="h-64 text-center">
                                <EmptyState
                                    icon={Target}
                                    title="No Targets Set"
                                    description="Click 'Add Target' above to start."
                                />
                            </TableCell>
                        </TableRow>
                    )}
                    {targets.map((target: any) => (
                        <TableRow key={target.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                            <TableCell className="align-top py-5 px-6">
                                <div className="font-semibold text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">{target.output}</div>
                            </TableCell>
                            <TableCell className="align-top py-5 px-4 bg-slate-50/30">
                                <div className="whitespace-pre-wrap text-slate-600 text-sm leading-relaxed">{target.indicators}</div>
                            </TableCell>
                            {showAccomplishmentColumn && (
                                <TableCell className="align-top py-5 px-4">
                                    <div className="space-y-3">
                                        <AccomplishmentInput
                                            targetId={target.id}
                                            initialValue={target.actual_accomplishment}
                                            isReadOnly={!canEditAccomplishments}
                                        />
                                        <div className="flex justify-end">
                                            <EvidenceModal targetId={target.id} isLocked={!canEditAccomplishments} />
                                        </div>
                                    </div>
                                </TableCell>
                            )}
                            {!isReadOnly && (
                                <TableCell className="text-right align-top py-5 px-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(target)}
                                            className="text-slate-300 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(target.id)}
                                            className="text-slate-300 hover:text-red-600 hover:bg-red-50 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
