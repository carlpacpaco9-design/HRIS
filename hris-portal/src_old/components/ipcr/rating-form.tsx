'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { submitRating, finalizeAssessment } from '@/app/actions/assessment'
import { Loader2, Save, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function RatingForm({ commitment, employee }: { commitment: any, employee: any }) {
    const router = useRouter()
    const [targets, setTargets] = useState(commitment.spms_targets || [])
    const [isFinalizing, setIsFinalizing] = useState(false)

    // Helper to update local state for live calc
    const updateLocalTarget = (id: string, field: string, value: any) => {
        setTargets((prev: any[]) => prev.map(t => {
            if (t.id === id) {
                const updated = { ...t, [field]: value }
                // Recalculate average if Q/E/T changes
                if (['quantity_score', 'quality_score', 'timeliness_score'].includes(field)) {
                    const q = Number(field === 'quantity_score' ? value : updated.quantity_score) || 0
                    const e = Number(field === 'quality_score' ? value : updated.quality_score) || 0
                    const t_score = Number(field === 'timeliness_score' ? value : updated.timeliness_score) || 0

                    updated.average_score = (q + e + t_score) / 3
                }
                return updated
            }
            return t
        }))
    }

    const handleRatingChange = async (targetId: string, field: 'quantity_score' | 'quality_score' | 'timeliness_score' | 'remarks', value: string) => {
        // Update local UI instanty
        updateLocalTarget(targetId, field, value)
    }

    const saveRating = async (target: any) => {
        const res = await submitRating(
            target.id,
            Number(target.quantity_score),
            Number(target.quality_score),
            Number(target.timeliness_score),
            target.remarks
        )
        if (res.error) {
            toast.error(res.error)
        } else {
            // Optional: toast.success('Saved') - might be too spammy intended for auto-save feel
            // leaving it silent unless error, or small indicator
        }
        router.refresh()
    }

    const onFinalize = async () => {
        // Validation check before even calling server
        const incomplete = targets.some((t: any) =>
            !t.quantity_score || !t.quality_score || !t.timeliness_score ||
            Number(t.quantity_score) < 1 || Number(t.quality_score) < 1 || Number(t.timeliness_score) < 1
        )

        if (incomplete) {
            toast.error("Cannot finalize: Please rate ALL targets first with scores 1-5.")
            return
        }

        if (!confirm("Are you sure you want to finalize this rating? This cannot be undone.")) return
        setIsFinalizing(true)
        const res = await finalizeAssessment(commitment.id)
        if (res.error) {
            toast.error(res.error)
            setIsFinalizing(false)
        } else {
            toast.success('Assessment Finalized Successfully')
            router.push('/dashboard/approvals')
        }
    }

    // Group by Category
    const categories = ['strategic', 'core', 'support']

    return (
        <div className="space-y-6">
            <Card className="bg-slate-50 border-slate-200">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">{employee.name}</CardTitle>
                            <CardDescription>{employee.position_title} - {employee.department}</CardDescription>
                        </div>
                        <Badge variant={commitment.status === 'rated' ? "default" : "secondary"}>
                            {commitment.status.toUpperCase()}
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            {categories.map(category => {
                const categoryTargets = targets.filter((t: any) => t.mfo_category === category)
                if (categoryTargets.length === 0) return null

                return (
                    <Card key={category}>
                        <CardHeader className="py-3 bg-slate-100/50">
                            <CardTitle className="text-sm font-bold uppercase text-slate-600">
                                {category} Functions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[20%]">MFO / Indicators</TableHead>
                                        <TableHead className="w-[25%]">Actual Accomplishments</TableHead>
                                        <TableHead className="w-[8%] text-center">Q</TableHead>
                                        <TableHead className="w-[8%] text-center">E</TableHead>
                                        <TableHead className="w-[8%] text-center">T</TableHead>
                                        <TableHead className="w-[8%] text-center">Avg</TableHead>
                                        <TableHead className="w-[20%]">Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categoryTargets.map((target: any) => {
                                        const isUnrated = !target.average_score || target.average_score === 0;
                                        // Also check individual scores for completeness visual
                                        const isIncomplete = !target.quantity_score || !target.quality_score || !target.timeliness_score;

                                        return (
                                            <TableRow key={target.id} className={cn(
                                                (isUnrated || isIncomplete) && commitment.status !== 'rated' ? "bg-red-50 hover:bg-red-100/50" : ""
                                            )}>
                                                <TableCell className="align-top text-xs text-slate-700">
                                                    <div className="font-semibold mb-1">{target.output}</div>
                                                    <div className="text-slate-500 whitespace-pre-wrap">{target.indicators}</div>
                                                    {(isUnrated || isIncomplete) && commitment.status !== 'rated' && (
                                                        <Badge variant="destructive" className="mt-2 text-[10px] h-5 px-1.5">Pending Rating</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="align-top text-sm bg-slate-50/50">
                                                    <div className="whitespace-pre-wrap">{target.actual_accomplishment || '-'}</div>
                                                </TableCell>

                                                {/* Rating Inputs */}
                                                {['quantity_score', 'quality_score', 'timeliness_score'].map((field) => (
                                                    <TableCell key={field} className="align-top p-1">
                                                        <Input
                                                            type="number"
                                                            min="1" max="5"
                                                            className={cn(
                                                                "h-9 w-full text-center px-1",
                                                                (!target[field] || target[field] < 1) && commitment.status !== 'rated' ? "border-red-300 bg-red-50 focus-visible:ring-red-400" : ""
                                                            )}
                                                            value={target[field] || ''}
                                                            onChange={(e) => handleRatingChange(target.id, field as any, e.target.value)}
                                                            onBlur={() => saveRating(target)}
                                                            disabled={commitment.status === 'rated'}
                                                        />
                                                    </TableCell>
                                                ))}

                                                <TableCell className="align-top text-center font-bold text-blue-600 bg-slate-50">
                                                    {target.average_score ? Number(target.average_score).toFixed(2) : '-'}
                                                </TableCell>
                                                <TableCell className="align-top p-1">
                                                    <Textarea
                                                        className="min-h-[60px] text-xs resize-none"
                                                        placeholder="Remarks..."
                                                        value={target.remarks || ''}
                                                        onChange={(e) => handleRatingChange(target.id, 'remarks', e.target.value)}
                                                        onBlur={() => saveRating(target)}
                                                        disabled={commitment.status === 'rated'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )
            })}

            {commitment.status !== 'rated' && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg flex justify-end gap-4 z-50 md:pl-64">
                    <div className="mr-auto flex items-center gap-2 text-slate-600">
                        <Badge variant="outline">Grand Average: {
                            (targets.reduce((acc: number, t: any) => acc + (Number(t.average_score) || 0), 0) / (targets.length || 1)).toFixed(2)
                        }</Badge>
                    </div>
                    <Button
                        size="lg"
                        onClick={onFinalize}
                        disabled={isFinalizing}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isFinalizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Finalize Assessment
                    </Button>
                </div>
            )}
        </div>
    )
}
