'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Users, Trophy, Star, Plus, CheckCircle2 } from 'lucide-react'
import { EligibleStaff, AwardType, AWARD_TYPE_CONFIG } from '@/types/rewards'

const ALL_AWARD_TYPES: AwardType[] = [
    'praise_award', 'performance_bonus', 'step_increment',
    'certificate_of_recognition', 'scholarship'
]

const CHIP_COLOR_MAP: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-700 border-amber-300',
    green: 'bg-green-100 text-green-700 border-green-300',
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    purple: 'bg-purple-100 text-purple-700 border-purple-300',
    teal: 'bg-teal-100 text-teal-700 border-teal-300',
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface EligibleStaffPanelProps {
    staff: EligibleStaff[]
    periodName: string
    onGiveAward: (staffMember: EligibleStaff, awardType?: AwardType) => void
}

export function EligibleStaffPanel({
    staff,
    periodName,
    onGiveAward,
}: EligibleStaffPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true)

    return (
        <Card className="border border-border/60 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div
                className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20 cursor-pointer select-none"
                onClick={() => setIsExpanded(prev => !prev)}
            >
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Eligible Staff — {periodName}</h3>
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5">
                        {staff.length}
                    </span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    {isExpanded
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>

            {/* Card Content */}
            {isExpanded && (
                <div className="p-4">
                    {staff.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No eligible staff for this rating period</p>
                            <p className="text-xs mt-1 max-w-xs mx-auto">
                                Staff members need a finalized IPCR with Outstanding or Very Satisfactory rating to be eligible.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {staff.map(emp => {
                                const allGiven = ALL_AWARD_TYPES.every(t => emp.existing_awards.includes(t))

                                return (
                                    <div
                                        key={emp.staff_id}
                                        className="border border-border rounded-lg p-3 flex items-start justify-between gap-3 hover:border-primary/30 transition-colors"
                                    >
                                        {/* Left: Staff Info */}
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                                {getInitials(emp.full_name)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{emp.full_name}</p>
                                                <Badge variant="outline" className="text-[10px] mt-0.5 border-border/60">
                                                    {emp.division_name}
                                                </Badge>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-2xl font-bold text-primary leading-none">
                                                        {emp.final_average_rating.toFixed(2)}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'text-[10px]',
                                                            emp.adjectival_rating === 'Outstanding'
                                                                ? 'bg-amber-100 text-amber-700 border-amber-300'
                                                                : 'bg-blue-100 text-blue-700 border-blue-300'
                                                        )}
                                                    >
                                                        {emp.adjectival_rating === 'Outstanding'
                                                            ? <Trophy className="w-2.5 h-2.5 mr-1" />
                                                            : <Star className="w-2.5 h-2.5 mr-1" />}
                                                        {emp.adjectival_rating}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Award Chips */}
                                        <div className="flex flex-col gap-1 shrink-0">
                                            {ALL_AWARD_TYPES.map(type => {
                                                const cfg = AWARD_TYPE_CONFIG[type]
                                                const isGiven = emp.existing_awards.includes(type)
                                                const praiseDisabled = cfg.outstandingOnly && emp.adjectival_rating !== 'Outstanding'
                                                const isAvailable = !isGiven && !praiseDisabled

                                                if (isGiven) {
                                                    return (
                                                        <div
                                                            key={type}
                                                            className={cn(
                                                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                                                                CHIP_COLOR_MAP[cfg.color]
                                                            )}
                                                        >
                                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                                            {cfg.label.split(' ')[0]}
                                                        </div>
                                                    )
                                                }

                                                if (isAvailable) {
                                                    return (
                                                        <button
                                                            key={type}
                                                            onClick={() => onGiveAward(emp, type)}
                                                            className={cn(
                                                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-dashed transition-colors',
                                                                'border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5'
                                                            )}
                                                        >
                                                            <Plus className="w-2.5 h-2.5" />
                                                            {cfg.label.split(' ')[0]}
                                                        </button>
                                                    )
                                                }

                                                // Praise disabled for VS
                                                return (
                                                    <div
                                                        key={type}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-dashed border-border/40 text-muted-foreground/40 cursor-not-allowed"
                                                    >
                                                        <Plus className="w-2.5 h-2.5" />
                                                        {cfg.label.split(' ')[0]}
                                                    </div>
                                                )
                                            })}
                                            {allGiven && (
                                                <p className="text-[10px] text-green-600 font-medium text-center mt-1">
                                                    ✓ All awards given
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </Card>
    )
}
