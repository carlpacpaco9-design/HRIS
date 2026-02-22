'use client'

import Link from 'next/link'
import { Trophy, Banknote, TrendingUp, Award, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AwardType } from '@/types/rewards'

const AWARD_ICONS: Record<AwardType, React.ElementType> = {
    praise_award: Trophy,
    performance_bonus: Banknote,
    step_increment: TrendingUp,
    certificate_of_recognition: Award,
    scholarship: GraduationCap,
}

const STATUS_CONFIG = {
    approved: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
    awarded: { label: 'Awarded', className: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
}

interface RecentAward {
    id: string
    award_type: AwardType
    award_title: string
    status: 'approved' | 'awarded' | 'cancelled'
    employee?: { full_name: string }
}

interface RewardsWidgetProps {
    recentAwards: RecentAward[]
}

export function RewardsWidget({ recentAwards }: RewardsWidgetProps) {
    return (
        <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Awards This Period
                </h3>
                <Link href="/dashboard/rewards" className="text-xs text-primary hover:underline">
                    View all →
                </Link>
            </div>
            <div className="space-y-2">
                {recentAwards.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                        No awards given yet this period
                    </p>
                ) : recentAwards.map(award => {
                    const Icon = AWARD_ICONS[award.award_type] || Trophy
                    const statusCfg = STATUS_CONFIG[award.status]
                    return (
                        <div key={award.id} className="flex items-center gap-2 text-sm">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="flex-1 truncate font-medium text-xs">
                                {award.employee?.full_name || '—'}
                            </span>
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', statusCfg.className)}>
                                {statusCfg.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
