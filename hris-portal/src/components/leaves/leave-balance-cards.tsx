'use client'

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LeaveBalance } from "@/app/actions/leaves"

export function LeaveBalanceCards({ balance }: { balance: LeaveBalance | null }) {
    if (!balance) return null

    const cards = [
        {
            title: 'Vacation Leave',
            total: balance.vacation_leave_total,
            used: balance.vacation_leave_used,
            abbr: 'VL'
        },
        {
            title: 'Sick Leave',
            total: balance.sick_leave_total,
            used: balance.sick_leave_used,
            abbr: 'SL'
        },
        {
            title: 'Special Privilege',
            total: balance.special_leave_total,
            used: balance.special_leave_used,
            abbr: 'SPL'
        },
        {
            title: 'Emergency Leave',
            total: balance.emergency_leave_total,
            used: balance.emergency_leave_used,
            abbr: 'EL'
        }
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {cards.map((card, i) => {
                const remaining = Math.max(0, card.total - card.used)
                const percent = Math.min(100, Math.round((remaining / card.total) * 100))

                let colorClass = 'bg-green-500' // Using bg prefix for Progress
                if (percent <= 25) colorClass = 'bg-rose-500'
                else if (percent <= 50) colorClass = 'bg-amber-500'

                return (
                    <div key={i} className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="text-sm font-medium text-slate-500 mb-2 truncate" title={card.title}>
                            {card.title}
                        </div>
                        <div className="flex items-end gap-2 mb-3">
                            <span className="text-3xl font-bold text-slate-900">{remaining}</span>
                            <span className="text-sm font-medium text-slate-500 mb-1">of {card.total} days</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Progress value={percent} className="h-2 flex-1" indicatorColor={colorClass} />
                            <span className="text-xs font-medium text-slate-500 min-w-[30px] text-right">{percent}%</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
