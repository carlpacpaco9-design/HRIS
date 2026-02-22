'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Save, AlertTriangle, Send, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import { saveIPCROutputs, submitIPCR, reviewIPCR, finalizeIPCR, returnIPCR } from '@/app/actions/ipcr'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type IPCREditorProps = {
    ipcr: any
    initialOutputs: any[]
    canEdit: boolean
    canRate: boolean
    canReview: boolean
    canReturn: boolean
    currentUserId: string
}

const CATEGORIES = [
    'Core Function',
    'Support Function',
] as const

type Output = {
    id?: string
    front_id: string
    category: string
    output_order: number
    major_final_output: string
    success_indicator_target: string
    success_indicator_measure: string
    actual_accomplishments: string
    rating_quantity: number | null
    rating_efficiency: number | null
    rating_timeliness: number | null
    rating_average: number | null
    remarks: string
    _deleted?: boolean
}

export function IPCREditor({
    ipcr,
    initialOutputs,
    canEdit,
    canRate,
    canReview,
    canReturn,
    currentUserId
}: IPCREditorProps) {
    const router = useRouter()

    const [outputs, setOutputs] = useState<Output[]>(
        initialOutputs.map(o => ({
            ...o,
            front_id: o.id || Math.random().toString(36).substr(2, 9),
            success_indicator_target: o.success_indicator_target || '',
            success_indicator_measure: o.success_indicator_measure || '',
            actual_accomplishments: o.actual_accomplishments || '',
            remarks: o.remarks || ''
        }))
    )

    const [isSaving, setIsSaving] = useState(false)
    const [isSubmitOpen, setIsSubmitOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [reviewComments, setReviewComments] = useState(ipcr.review_comments || '')
    const [finalRemarks, setFinalRemarks] = useState(ipcr.final_remarks || '')

    // Auto-save logic
    const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)

    const handleOutputChange = (front_id: string, field: keyof Output, value: any) => {
        setOutputs(prev => prev.map(o => o.front_id === front_id ? { ...o, [field]: value } : o))

        if (canEdit) {
            if (autoSaveTimer) clearTimeout(autoSaveTimer)
            setAutoSaveTimer(setTimeout(() => saveDraft(true), 2000))
        }
    }

    const handleRatingChange = (front_id: string, dim: 'rating_quantity' | 'rating_efficiency' | 'rating_timeliness', val: number) => {
        setOutputs(prev => prev.map(o => {
            if (o.front_id === front_id) {
                const o2 = { ...o, [dim]: val }
                const q = o2.rating_quantity || 0
                const e = o2.rating_efficiency || 0
                const t = o2.rating_timeliness || 0
                let count = 0
                let sum = 0
                if (q > 0) { sum += q; count++ }
                if (e > 0) { sum += e; count++ }
                if (t > 0) { sum += t; count++ }
                o2.rating_average = count === 3 ? Number((sum / 3).toFixed(2)) : o.rating_average
                return o2
            }
            return o
        }))
    }

    const addOutput = (category: string) => {
        const existingCount = outputs.filter(o => o.category === category && !o._deleted).length
        setOutputs([
            ...outputs,
            {
                front_id: Math.random().toString(36).substr(2, 9),
                category,
                output_order: existingCount + 1,
                major_final_output: '',
                success_indicator_target: '',
                success_indicator_measure: '',
                actual_accomplishments: '',
                rating_quantity: null,
                rating_efficiency: null,
                rating_timeliness: null,
                rating_average: null,
                remarks: ''
            }
        ])
        if (canEdit) {
            if (autoSaveTimer) clearTimeout(autoSaveTimer)
            setAutoSaveTimer(setTimeout(() => saveDraft(true), 2000))
        }
    }

    const removeOutput = (front_id: string) => {
        setOutputs(prev => prev.map(o => o.front_id === front_id ? { ...o, _deleted: true } : o))
        if (canEdit) {
            if (autoSaveTimer) clearTimeout(autoSaveTimer)
            setAutoSaveTimer(setTimeout(() => saveDraft(true), 2000))
        }
    }

    const saveDraft = async (silent = false) => {
        if (!canEdit) return
        setIsSaving(true)
        const activeOutputs = outputs.filter(o => !o._deleted).map((o, i) => ({
            id: o.id,
            category: o.category,
            output_order: i + 1, // update order blindly per category? no just list order
            major_final_output: o.major_final_output,
            success_indicator_target: o.success_indicator_target,
            success_indicator_measure: o.success_indicator_measure,
            actual_accomplishments: o.actual_accomplishments,
            remarks: o.remarks
        }))

        const res = await saveIPCROutputs({
            ipcr_form_id: ipcr.id,
            outputs: activeOutputs
        })

        setIsSaving(false)
        if (!silent) {
            if (res.success) toast.success('Draft saved')
            else toast.error(res.error || 'Failed to save draft')
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        await saveDraft(true)
        const res = await submitIPCR(ipcr.id)
        setIsSubmitting(false)
        if (res.success) {
            toast.success('IPCR submitted for review')
            setIsSubmitOpen(false)
        } else {
            toast.error(res.error || 'Failed to submit IPCR')
        }
    }

    const handleReview = async () => {
        const res = await reviewIPCR(ipcr.id, reviewComments)
        if (res.success) toast.success('IPCR Indorsed')
        else toast.error(res.error)
    }

    const handleFinalize = async () => {
        const activeOpts = outputs.filter(o => !o._deleted)

        // Check if all have 3 ratings
        for (const o of activeOpts) {
            if (!o.rating_quantity || !o.rating_efficiency || !o.rating_timeliness) {
                toast.error('Please assign all 3 ratings (Q, E, T) to all active outputs before finalizing.')
                return
            }
        }

        const payload = activeOpts.map(o => ({
            output_id: o.id!,
            rating_quantity: o.rating_quantity!,
            rating_efficiency: o.rating_efficiency!,
            rating_timeliness: o.rating_timeliness!
        }))

        const res = await finalizeIPCR(ipcr.id, payload, finalRemarks)
        if (res.success) toast.success('IPCR Finalized')
        else toast.error(res.error)
    }

    const handleReturn = async () => {
        if (!finalRemarks.trim()) {
            toast.error('Please specify reasons for return in final remarks')
            return
        }
        const res = await returnIPCR(ipcr.id, finalRemarks)
        if (res.success) toast.success('IPCR Returned')
        else toast.error(res.error)
    }

    // Calculate live average
    let sumAvg = 0
    let avgCount = 0
    outputs.filter(o => !o._deleted).forEach(o => {
        if (o.rating_average) {
            sumAvg += o.rating_average
            avgCount++
        }
    })

    const liveFinalAvg = avgCount > 0 ? (sumAvg / avgCount) : 0
    let liveAdjectival = 'Pending'
    if (liveFinalAvg >= 5.0) liveAdjectival = 'Outstanding'
    else if (liveFinalAvg >= 4.0) liveAdjectival = 'Very Satisfactory'
    else if (liveFinalAvg >= 3.0) liveAdjectival = 'Satisfactory'
    else if (liveFinalAvg >= 2.0) liveAdjectival = 'Unsatisfactory'
    else if (liveFinalAvg >= 1.0) liveAdjectival = 'Poor'

    if (!canRate && ipcr.final_average_rating) {
        // Use saved ones if not in rating mode
    }

    // RATING COMPONENT
    const RatingButtons = ({ val, onSet }: { val: number | null, onSet: (n: number) => void }) => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    onClick={() => onSet(n)}
                    disabled={!canRate}
                    className={`h-8 w-8 rounded-md text-sm font-semibold transition-colors 
            ${val === n
                            ? 'bg-[#1E3A5F] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }
            ${!canRate && val !== n ? 'opacity-50 cursor-default' : ''}
          `}
                >
                    {n}
                </button>
            ))}
        </div>
    )

    return (
        <div className="space-y-12">
            {CATEGORIES.map(cat => {
                const catOutputs = outputs.filter(o => o.category === cat && !o._deleted)

                return (
                    <div key={cat} className="space-y-4">
                        <h2 className="text-xl font-bold text-[#1E3A5F] border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
                            {cat}S <span className="text-sm font-normal text-slate-500 normal-case ml-2">({catOutputs.length} outputs)</span>
                        </h2>

                        <div className="space-y-6">
                            {catOutputs.map((out, i) => (
                                <div key={out.front_id} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 relative">
                                    {canEdit && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeOutput(out.front_id)}
                                            className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}

                                    <h3 className="text-sm font-bold text-slate-500 mb-4 tracking-tight uppercase">Output #{i + 1}</h3>

                                    <div className="grid gap-4">
                                        <div>
                                            <Label className="text-slate-700 font-semibold">Major Final Output {canEdit && <span className="text-rose-500">*</span>}</Label>
                                            {canEdit ? (
                                                <Input
                                                    value={out.major_final_output}
                                                    onChange={e => handleOutputChange(out.front_id, 'major_final_output', e.target.value)}
                                                    placeholder="Enter MFO"
                                                />
                                            ) : (
                                                <p className="text-slate-900 bg-slate-50 p-2 rounded-md border min-h-10 mt-1">{out.major_final_output}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-slate-700 font-semibold">Success Indicator — Target</Label>
                                                {canEdit ? (
                                                    <Textarea
                                                        value={out.success_indicator_target}
                                                        onChange={e => handleOutputChange(out.front_id, 'success_indicator_target', e.target.value)}
                                                        rows={3} className="resize-none"
                                                    />
                                                ) : (
                                                    <p className="text-slate-900 bg-slate-50 p-2 rounded-md border min-h-20 mt-1 whitespace-pre-wrap">{out.success_indicator_target}</p>
                                                )}
                                            </div>
                                            <div>
                                                <Label className="text-slate-700 font-semibold">Success Indicator — Measure</Label>
                                                {canEdit ? (
                                                    <Textarea
                                                        value={out.success_indicator_measure}
                                                        onChange={e => handleOutputChange(out.front_id, 'success_indicator_measure', e.target.value)}
                                                        rows={3} className="resize-none"
                                                    />
                                                ) : (
                                                    <p className="text-slate-900 bg-slate-50 p-2 rounded-md border min-h-20 mt-1 whitespace-pre-wrap">{out.success_indicator_measure}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-slate-700 font-semibold">Actual Accomplishments</Label>
                                            {canEdit ? (
                                                <Textarea
                                                    value={out.actual_accomplishments}
                                                    onChange={e => handleOutputChange(out.front_id, 'actual_accomplishments', e.target.value)}
                                                    rows={2} className="resize-none"
                                                />
                                            ) : (
                                                <p className="text-slate-900 bg-slate-50 p-2 rounded-md border min-h-10 mt-1 whitespace-pre-wrap">{out.actual_accomplishments || <span className="text-slate-400 italic">None</span>}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label className="text-slate-700 font-semibold">Remarks</Label>
                                            {canEdit ? (
                                                <Input
                                                    value={out.remarks}
                                                    onChange={e => handleOutputChange(out.front_id, 'remarks', e.target.value)}
                                                />
                                            ) : (
                                                <p className="text-slate-900 bg-slate-50 p-2 rounded-md border min-h-10 mt-1">{out.remarks || <span className="text-slate-400 italic">None</span>}</p>
                                            )}
                                        </div>
                                    </div>

                                    {(canRate || ipcr.status === 'finalized' || ipcr.status === 'returned') && (
                                        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-md">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                <div>
                                                    <Label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</Label>
                                                    <RatingButtons val={out.rating_quantity} onSet={v => handleRatingChange(out.front_id, 'rating_quantity', v)} />
                                                </div>
                                                <div>
                                                    <Label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Efficiency</Label>
                                                    <RatingButtons val={out.rating_efficiency} onSet={v => handleRatingChange(out.front_id, 'rating_efficiency', v)} />
                                                </div>
                                                <div>
                                                    <Label className="block mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Timeliness</Label>
                                                    <RatingButtons val={out.rating_timeliness} onSet={v => handleRatingChange(out.front_id, 'rating_timeliness', v)} />
                                                </div>
                                            </div>
                                            <div className="mt-4 sm:mt-0 text-right">
                                                <Label className="block mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Average</Label>
                                                <span className="text-2xl font-bold text-[#1E3A5F]">{out.rating_average ? out.rating_average.toFixed(2) : '—'}</span>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ))}

                            {canEdit && (
                                <Button variant="outline" onClick={() => addOutput(cat)} className="w-full border-dashed border-2 py-8 text-slate-500 hover:text-slate-700 hover:bg-slate-50">
                                    <Plus className="mr-2 h-4 w-4" /> Add {cat} Output
                                </Button>
                            )}
                        </div>
                    </div>
                )
            })}

            {/* FIXED BOTTOM BARS/PANELS */}

            {/* Employee Controls */}
            {canEdit && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-8">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        {isSaving ? <span className="animate-pulse flex items-center gap-1"><Save className="h-4 w-4" /> Saving...</span> : <span className="flex items-center gap-1"><Save className="h-4 w-4" /> Saved</span>}
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => saveDraft(false)} disabled={isSaving}>Save Draft</Button>
                        <Button className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90" onClick={() => setIsSubmitOpen(true)}>
                            <Send className="mr-2 h-4 w-4" /> Submit IPCR
                        </Button>
                    </div>
                </div>
            )}

            {/* Review Panel (Chief / HR) */}
            {canReview && ipcr.status === 'submitted' && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-8 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Review Panel</h3>
                    <div className="space-y-4">
                        <div>
                            <Label>Review Comments (optional)</Label>
                            <Textarea
                                value={reviewComments}
                                onChange={e => setReviewComments(e.target.value)}
                                placeholder="Enter endorsement remarks or feedback..."
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleReview}>
                                Endorse to Head of Office
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Finalize Panel (HR) */}
            {(canRate || canReturn) && ipcr.status === 'reviewed' && (
                <div className="bg-white border-2 border-slate-900 rounded-lg p-6 mt-8 shadow-xl">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500 fill-current" /> Finalize Rating</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <Label>Final Remarks (Required for return)</Label>
                                <Textarea
                                    value={finalRemarks}
                                    onChange={e => setFinalRemarks(e.target.value)}
                                    placeholder="Provide official feedback on performance..."
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-center items-center">
                            <p className="text-slate-500 font-medium uppercase tracking-wider text-sm mb-1">Computed Average</p>
                            <p className="text-5xl font-black text-[#1E3A5F] mb-2">{liveFinalAvg.toFixed(3)}</p>
                            <div className={`px-4 py-1 rounded-full text-sm font-bold
                  ${liveAdjectival === 'Outstanding' ? 'bg-yellow-500 text-yellow-950' :
                                    liveAdjectival === 'Very Satisfactory' ? 'bg-green-500 text-green-950' :
                                        liveAdjectival === 'Satisfactory' ? 'bg-blue-500 text-blue-950' :
                                            liveAdjectival === 'Unsatisfactory' ? 'bg-amber-500 text-amber-950' :
                                                liveAdjectival === 'Poor' ? 'bg-rose-500 text-rose-950' : 'bg-slate-200 text-slate-500'
                                }
                `}>
                                {liveAdjectival}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-slate-100">
                        <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={handleReturn}>
                            Return to Employee
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleFinalize}>
                            Finalize IPCR
                        </Button>
                    </div>
                </div>
            )}

            {/* Final Readonly Display for completed docs */}
            {ipcr.status === 'finalized' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8 shadow-sm text-center">
                    <p className="text-green-800 font-bold text-xl mb-2">Final Rating: {ipcr.final_average_rating?.toFixed(3)} — {ipcr.adjectival_rating}</p>
                    {ipcr.final_remarks && <p className="text-green-700 italic max-w-2xl mx-auto">"{ipcr.final_remarks}"</p>}
                </div>
            )}

            <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit IPCR for Review?</DialogTitle>
                        <DialogDescription>
                            Once submitted, you cannot edit this IPCR until it is returned to you. Make sure all your accomplishments are accurately reflected.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
                            {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
