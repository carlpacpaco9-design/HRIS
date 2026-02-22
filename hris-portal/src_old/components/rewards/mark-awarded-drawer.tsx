'use client'

import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckCircle2, Trophy, Star, Calendar, Info } from 'lucide-react'
import { RewardIncentive, AWARD_TYPE_CONFIG } from '@/types/rewards'
import { markAsAwarded } from '@/app/actions/rewards'

interface MarkAwardedDrawerProps {
    isOpen: boolean
    onClose: () => void
    reward: RewardIncentive | null
}

export function MarkAwardedDrawer({ isOpen, onClose, reward }: MarkAwardedDrawerProps) {
    const [awardDate, setAwardDate] = useState(new Date().toISOString().split('T')[0])
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!reward) return null

    const config = AWARD_TYPE_CONFIG[reward.award_type]

    const handleConfirm = async () => {
        if (!awardDate) {
            toast.error('Please select an award date')
            return
        }
        setIsSubmitting(true)
        try {
            const result = await markAsAwarded(reward.id, awardDate)
            if (result.error) {
                toast.error(result.error)
                return
            }
            toast.success('Award recorded as given')
            onClose()
        } catch {
            toast.error('Failed to update award')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="sm:max-w-md w-full flex flex-col p-0 overflow-hidden">
                <SheetHeader className="p-6 border-b shrink-0 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-2.5 rounded-xl shadow-sm border border-green-200/50">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold tracking-tight">Confirm Presentation</SheetTitle>
                            <SheetDescription className="text-xs">
                                Record the official presentation of this award.
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Award Summary Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-800">{reward.staff?.full_name || '—'}</p>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'text-[9px] h-4 font-bold uppercase tracking-wider',
                                        reward.basis_rating === 'Outstanding'
                                            ? 'bg-amber-100 text-amber-700 border-amber-300'
                                            : 'bg-blue-100 text-blue-700 border-blue-300'
                                    )}
                                >
                                    {reward.basis_rating}
                                </Badge>
                            </div>
                            <div className="p-1 bg-white rounded-lg border border-slate-200 shadow-inner">
                                {reward.basis_rating === 'Outstanding'
                                    ? <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                    : <Star className="w-3.5 h-3.5 text-blue-500" />}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{config.label}</p>
                            <p className="text-sm font-semibold text-slate-700">{reward.award_title}</p>
                        </div>
                    </div>

                    {/* Award Date Selection */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="award-date" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" /> Presentation Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="award-date"
                                type="date"
                                value={awardDate}
                                onChange={e => setAwardDate(e.target.value)}
                                className="h-11 border-slate-200 bg-slate-50 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        {/* Confirmation Context */}
                        <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 flex gap-3">
                            <div className="bg-green-100 h-6 w-6 rounded-full flex items-center justify-center shrink-0">
                                <Info className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <p className="text-xs text-green-800 leading-relaxed font-medium">
                                This will record that <strong>{reward.award_title}</strong> has been
                                officially given to <strong>{reward.staff?.full_name}</strong>.
                                This updates the official SPMS electronic records.
                            </p>
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-6 border-t shrink-0 bg-slate-50/80 backdrop-blur-sm sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3 sm:justify-between items-center w-full">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 text-white font-bold"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>Recording...</>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Confirm Presentation
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
