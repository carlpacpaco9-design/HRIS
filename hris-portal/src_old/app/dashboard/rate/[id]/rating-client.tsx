'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // Use correct router for app directory
import { Button } from "@/components/ui/button"
// import { Textarea } from "@/components/ui/textarea" // Removed to use native for stability
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { saveTargetRating, finalizeRating } from "@/app/actions/rating"
import EvidenceModal from "@/components/ipcr/evidence-modal" // Reused for viewing
import DownloadIPCRButton from "@/components/pdf/download-button"
import { Loader2, Save, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Use a simple Input/Select component for Q/E/T
// Or modify EvidenceModal to be "View Only" if locked
// EvidenceModal logic already handled view/delete. We pass isLocked=true here.

export default function RatingClient({ data }: { data: any }) {
    const router = useRouter()
    const [targets, setTargets] = useState(data.spms_targets || [])
    const [finalComments, setFinalComments] = useState(data.comments || '')
    const [grandAverage, setGrandAverage] = useState(0)
    const [isSaving, setIsSaving] = useState(false)

    // Calculate Grand Average whenever targets change
    useEffect(() => {
        const total = targets.reduce((acc: number, t: any) => acc + (t.average_score || 0), 0)
        const avg = total > 0 ? total / targets.length : 0
        setGrandAverage(parseFloat(avg.toFixed(2)))
    }, [targets])

    async function handleScoreChange(targetId: string, field: 'q' | 'e' | 't', value: string) {
        const numValue = parseInt(value)
        if (isNaN(numValue)) return // Handle empty string gracefully

        // Clip 1-5
        const validValue = Math.min(Math.max(numValue, 1), 5)

        // Optimistic UI Update first
        const updatedTargets = targets.map((t: any) => {
            if (t.id === targetId) {
                const newScores = {
                    q: field === 'q' ? validValue : (t.quantity_score || 0), // Mapping DB names
                    e: field === 'e' ? validValue : (t.quality_score || 0),
                    t: field === 't' ? validValue : (t.timeliness_score || 0)
                }
                const avg = parseFloat(((newScores.q + newScores.e + newScores.t) / 3).toFixed(2))

                // Trigger Background Save
                saveTargetRating(targetId, newScores.q, newScores.e, newScores.t)

                return {
                    ...t,
                    quantity_score: newScores.q,
                    quality_score: newScores.e,
                    timeliness_score: newScores.t,
                    average_score: avg
                }
            }
            return t
        })
        setTargets(updatedTargets)
    }

    async function onFinalize() {
        setIsSaving(true)
        await finalizeRating(data.id, finalComments)
        setIsSaving(false)
        router.push('/dashboard/approvals') // Redirect back to list
    }

    const isRated = data.status === 'rated'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b pb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                </div>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{data.profiles.full_name}</h2>
                        <p className="text-slate-500">{data.profiles.position_title}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-500">Grand Average</p>
                        <div className={`text-3xl font-bold ${grandAverage >= 4.5 ? 'text-purple-600' : grandAverage >= 3 ? 'text-green-600' : 'text-amber-600'}`}>
                            {grandAverage}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rating Table */}
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[30%]">Major Output / Indicators</TableHead>
                            <TableHead className="w-[10%] text-center">Evidence</TableHead>
                            <TableHead className="w-[10%] text-center">Quality (E)</TableHead>
                            <TableHead className="w-[10%] text-center">Efficiency (Q)</TableHead>
                            <TableHead className="w-[10%] text-center">Timeliness (T)</TableHead>
                            <TableHead className="w-[10%] text-center font-bold">Average</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {targets.map((target: any) => (
                            <TableRow key={target.id}>
                                <TableCell className="align-top">
                                    <p className="font-medium text-sm">{target.output}</p>
                                    <p className="text-xs text-slate-500 whitespace-pre-wrap mt-1">{target.indicators}</p>
                                </TableCell>
                                <TableCell className="text-center align-top pt-3">
                                    {/* Reuse EvidenceModal in locked view mode */}
                                    <EvidenceModal targetId={target.id} isLocked={true} />
                                </TableCell>
                                <TableCell className="text-center align-top">
                                    <Input
                                        type="number"
                                        min={1} max={5}
                                        value={target.quality_score || ''} // Using 'E' mapping per context above, actually usually Q=Quality, E=Efficiency, T=Timeliness. Let's fix labels visually.
                                        onChange={(e) => handleScoreChange(target.id, 'e', e.target.value)}
                                        className="w-16 mx-auto text-center"
                                        disabled={isRated}
                                    />
                                </TableCell>
                                <TableCell className="text-center align-top">
                                    <Input
                                        type="number"
                                        min={1} max={5}
                                        value={target.quantity_score || ''} // Using 'Q'
                                        onChange={(e) => handleScoreChange(target.id, 'q', e.target.value)}
                                        className="w-16 mx-auto text-center"
                                        disabled={isRated}
                                    />
                                </TableCell>
                                <TableCell className="text-center align-top">
                                    <Input
                                        type="number"
                                        min={1} max={5}
                                        value={target.timeliness_score || ''} // Using 'T'
                                        onChange={(e) => handleScoreChange(target.id, 't', e.target.value)}
                                        className="w-16 mx-auto text-center"
                                        disabled={isRated}
                                    />
                                </TableCell>
                                <TableCell className="text-center align-top pt-3">
                                    <Badge variant={target.average_score >= 4 ? 'default' : target.average_score >= 3 ? 'secondary' : 'destructive'}>
                                        {target.average_score || '0.00'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Footer Actions */}
            {!isRated ? (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Final Supervisor Comments / Feedback</label>
                    <textarea
                        value={finalComments}
                        onChange={(e) => setFinalComments(e.target.value)}
                        placeholder="Enter overall feedback..."
                        className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mb-4"
                        rows={4}
                    />
                    <div className="flex justify-end">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-white" disabled={isSaving}>
                                    <CheckCircle2 className="mr-2 h-5 w-5" />
                                    Finalize Rating
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Finalize Performance Rating?</DialogTitle>
                                </DialogHeader>
                                <p className="text-slate-600">
                                    This will calculate the final grand average and lock the rating permanently.
                                    Grand Average: <span className="font-bold text-slate-900">{grandAverage}</span>
                                </p>
                                <DialogFooter>
                                    <Button onClick={onFinalize} disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirm & Submit
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            ) : (
                <div className="flex justify-end bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <div className="text-right">
                        <p className="text-sm text-slate-500 mb-2">Rating Finalized. You can now download the official form.</p>
                        <DownloadIPCRButton commitmentId={data.id} />
                    </div>
                </div>
            )}
        </div>
    )
}
