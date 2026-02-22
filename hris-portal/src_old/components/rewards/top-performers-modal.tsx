'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    Trophy, Banknote, TrendingUp, Award, GraduationCap,
    Star, FileBarChart, Users, Download, Printer
} from 'lucide-react'
import { AwardType, AWARD_TYPE_CONFIG } from '@/types/rewards'

const AWARD_ICONS: Record<AwardType, React.ElementType> = {
    praise_award: Trophy,
    performance_bonus: Banknote,
    step_increment: TrendingUp,
    certificate_of_recognition: Award,
    scholarship: GraduationCap,
}

interface TopPerformer {
    rank: number
    staff_id: string
    full_name: string
    avatar_url?: string
    division_name: string
    final_average_rating: number
    adjectival_rating: string
    awards: Array<{ award_type: AwardType; status: string }>
}

interface TopPerformersModalProps {
    isOpen: boolean
    onClose: () => void
    outstanding: TopPerformer[]
    verySatisfactory: TopPerformer[]
    ratingPeriods: Array<{ id: string; name: string }>
    activePeriodId: string
    onPeriodChange?: (periodId: string) => void
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function PerformerRow({ performer, showTrophy }: { performer: TopPerformer; showTrophy?: boolean }) {
    const givenAwards = performer.awards.filter(a => a.status !== 'cancelled')

    return (
        <tr className="border-b border-border/40 hover:bg-muted/20 transition-colors">
            <td className="py-2.5 px-3 text-sm font-bold text-center">
                {showTrophy && performer.rank === 1 ? (
                    <Trophy className="w-4 h-4 text-amber-500 mx-auto" />
                ) : (
                    <span className="text-muted-foreground">{performer.rank}</span>
                )}
            </td>
            <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {getInitials(performer.full_name)}
                    </div>
                    <span className="text-sm font-medium">{performer.full_name}</span>
                </div>
            </td>
            <td className="py-2.5 px-3 text-xs text-muted-foreground">{performer.division_name}</td>
            <td className="py-2.5 px-3 text-center">
                <span className="text-sm font-bold text-primary">{performer.final_average_rating.toFixed(2)}</span>
            </td>
            <td className="py-2.5 px-3">
                <div className="flex flex-wrap gap-1">
                    {givenAwards.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">None yet</span>
                    ) : givenAwards.map((award, i) => {
                        const cfg = AWARD_TYPE_CONFIG[award.award_type]
                        const Icon = AWARD_ICONS[award.award_type]
                        return (
                            <Badge key={i} variant="outline" className="text-[10px] gap-1">
                                <Icon className="w-2.5 h-2.5" />
                                {cfg.label.split(' ')[0]}
                            </Badge>
                        )
                    })}
                </div>
            </td>
        </tr>
    )
}

export function TopPerformersModal({
    isOpen,
    onClose,
    outstanding,
    verySatisfactory,
    ratingPeriods,
    activePeriodId,
    onPeriodChange,
}: TopPerformersModalProps) {
    const [selectedPeriod, setSelectedPeriod] = useState(activePeriodId)

    const totalOutstanding = outstanding.length
    const totalVS = verySatisfactory.length
    const totalAwards = [...outstanding, ...verySatisfactory]
        .reduce((sum, p) => sum + p.awards.filter(a => a.status !== 'cancelled').length, 0)
    const pendingAwards = [...outstanding, ...verySatisfactory]
        .reduce((sum, p) => sum + p.awards.filter(a => a.status === 'approved').length, 0)

    const handlePeriodChange = (val: string) => {
        setSelectedPeriod(val)
        onPeriodChange?.(val)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            <FileBarChart className="w-5 h-5 text-primary" />
                            Top Performers Report
                        </DialogTitle>
                        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                            <SelectTrigger className="w-[200px] h-8 text-xs">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                {ratingPeriods.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="text-xs">
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Summary Row */}
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: 'Outstanding', value: totalOutstanding, color: 'amber', icon: Trophy },
                            { label: 'Very Satisfactory', value: totalVS, color: 'blue', icon: Star },
                            { label: 'Awards Given', value: totalAwards, color: 'green', icon: Award },
                            { label: 'Pending Awards', value: pendingAwards, color: 'orange', icon: Users },
                        ].map(({ label, value, color, icon: Icon }) => (
                            <div key={label} className={cn(
                                'rounded-lg p-3 border text-center',
                                color === 'amber' && 'bg-amber-50 border-amber-200',
                                color === 'blue' && 'bg-blue-50 border-blue-200',
                                color === 'green' && 'bg-green-50 border-green-200',
                                color === 'orange' && 'bg-orange-50 border-orange-200',
                            )}>
                                <p className="text-2xl font-bold">{value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Outstanding Performers */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <h3 className="font-semibold text-sm">Outstanding Performers</h3>
                            <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px]" variant="outline">
                                {outstanding.length}
                            </Badge>
                        </div>
                        {outstanding.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                                <p className="text-sm">No Outstanding performers this period</p>
                            </div>
                        ) : (
                            <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-center w-12">Rank</th>
                                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Staff Member</th>
                                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Division</th>
                                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-center">Rating</th>
                                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Awards Given</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {outstanding.map(p => (
                                            <PerformerRow key={p.staff_id} performer={p} showTrophy />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border" />

                    {/* Very Satisfactory Performers */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-blue-500" />
                            <h3 className="font-semibold text-sm">Very Satisfactory Performers</h3>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-[10px]" variant="outline">
                                {verySatisfactory.length}
                            </Badge>
                        </div>
                        {verySatisfactory.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                                <p className="text-sm">No Very Satisfactory performers this period</p>
                            </div>
                        ) : (
                            <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-muted/40">
                                        <tr>
                                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-center w-12">Rank</th>
                                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Staff Member</th>
                                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Division</th>
                                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-center">Rating</th>
                                            <th className="py-2 px-3 text-xs font-semibold text-muted-foreground text-left">Awards Given</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {verySatisfactory.map(p => (
                                            <PerformerRow key={p.staff_id} performer={p} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <p className="text-xs text-muted-foreground italic border-t border-border pt-3">
                        This report is based on finalized IPCR ratings for the selected rating period.
                        Per CSC SPMS guidelines, only staff with Outstanding and Very Satisfactory ratings are
                        eligible for performance-based awards and incentives.
                    </p>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button
                        variant="outline"
                        onClick={() => toast.info('Export available in Phase 14')}
                    >
                        <Download className="w-4 h-4 mr-2" /> Export Excel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => toast.info('Print available in Phase 14')}
                    >
                        <Printer className="w-4 h-4 mr-2" /> Print Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
