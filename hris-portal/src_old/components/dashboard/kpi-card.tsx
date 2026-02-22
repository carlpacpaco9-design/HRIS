'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ReactNode } from 'react'

export type KPICardProps = {
    icon: ReactNode
    iconColor: 'amber' | 'blue' | 'green' | 'purple' | 'red' | 'rose'
    value: string | number
    label: string
    sublabel?: string
    badge?: { text: string; color: 'amber' | 'green' | 'red' | 'blue' }
    trend?: 'up' | 'down' | 'stable'
    progressBar?: { value: number; color: string }
    statusBadge?: string
    href?: string
}

const ICON_BG: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    rose: 'bg-rose-100 text-rose-600',
}

const BADGE_STYLE: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'text-muted-foreground',
    submitted: 'text-blue-600',
    reviewed: 'text-purple-600',
    approved: 'text-green-600',
    returned: 'text-red-600',
    finalized: 'text-primary font-bold',
    'not started': 'text-muted-foreground',
    'not_started': 'text-muted-foreground',
}

export function KPICard({
    icon, iconColor, value, label, sublabel,
    badge, trend, progressBar, statusBadge, href
}: KPICardProps) {
    const content = (
        <div className={cn(
            'bg-card border border-border rounded-lg p-4 shadow-sm flex flex-col justify-between h-full',
            href && 'cursor-pointer hover:border-primary/50 transition-colors',
        )}>
            <div className="flex justify-between items-start mb-3">
                <div className={cn('rounded-md p-2 shrink-0', ICON_BG[iconColor])}>
                    {icon}
                </div>
                {badge && (
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', BADGE_STYLE[badge.color])}>
                        {badge.text}
                    </span>
                )}
            </div>

            <div>
                <div className={cn(
                    'text-2xl font-bold tracking-tight leading-none mb-1',
                    statusBadge && STATUS_COLORS[statusBadge.toLowerCase()] || 'text-foreground'
                )}>
                    {value}
                </div>
                <div className="text-sm font-medium text-foreground/80">{label}</div>
                {sublabel && (
                    <div className="text-xs text-muted-foreground/70 mt-0.5">{sublabel}</div>
                )}

                {progressBar && (
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn('h-full rounded-full transition-all duration-700', `bg-${progressBar.color}-500`)}
                            style={{ width: `${Math.min(100, progressBar.value)}%` }}
                        />
                    </div>
                )}

                {trend && (
                    <div className={cn(
                        'flex items-center gap-1 text-xs mt-1.5',
                        trend === 'up' && 'text-green-600',
                        trend === 'down' && 'text-red-500',
                        trend === 'stable' && 'text-muted-foreground',
                    )}>
                        {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                        {trend === 'down' && <TrendingDown className="w-3 h-3" />}
                        {trend === 'stable' && <Minus className="w-3 h-3" />}
                        <span>vs last period</span>
                    </div>
                )}
            </div>
        </div>
    )

    if (href) return <Link href={href} className="block h-full">{content}</Link>
    return content
}
