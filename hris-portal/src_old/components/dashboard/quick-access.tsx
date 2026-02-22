'use client'

import { Card } from "@/components/ui/card"
import {
    Users, FileText, CheckSquare, Clock, Zap,
    CalendarDays, TrendingUp, Trophy, Activity,
    Building2, BarChart3, BookOpen, ClipboardCheck, ShieldCheck,
    CalendarOff, LucideIcon
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface PendingCounts {
    pendingLeaves: number
    pendingIPCR: number
    pendingJournals: number
    overdueCalendarEvents: number
}

interface SmartAction {
    icon: ReactNode
    label: string
    href: string
    count?: number
    urgency?: 'normal' | 'amber' | 'red'
}

interface QuickAccessProps {
    userRole?: string
    pendingCounts?: PendingCounts
}

function SmartActionButton({ icon, label, href, count, urgency = 'normal' }: SmartAction) {
    return (
        <Link href={href} className="block">
            <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/60 hover:bg-muted hover:border-primary/30 transition-all cursor-pointer group">
                <span className="text-primary group-hover:scale-110 transition-transform shrink-0">
                    {icon}
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
                {count !== undefined && count > 0 && (
                    <span className={cn(
                        'text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                        urgency === 'red' && 'bg-red-100 text-red-700',
                        urgency === 'amber' && 'bg-amber-100 text-amber-700',
                        urgency === 'normal' && 'bg-primary/10 text-primary',
                    )}>
                        {count}
                    </span>
                )}
            </div>
        </Link>
    )
}

export function QuickAccess({ userRole = 'project_staff', pendingCounts }: QuickAccessProps) {
    const pc = pendingCounts ?? { pendingLeaves: 0, pendingIPCR: 0, pendingJournals: 0, overdueCalendarEvents: 0 }

    const getActions = (): SmartAction[] => {
        switch (userRole) {
            case 'head_of_office':
                return [
                    { icon: <CheckSquare size={16} />, label: 'Approve Leaves', href: '/dashboard/leaves', count: pc.pendingLeaves, urgency: pc.pendingLeaves > 0 ? 'amber' : 'normal' },
                    { icon: <FileText size={16} />, label: 'Approve IPCR', href: '/dashboard/approvals', count: pc.pendingIPCR, urgency: pc.pendingIPCR > 0 ? 'amber' : 'normal' },
                    { icon: <Building2 size={16} />, label: 'Review OPCR', href: '/dashboard/opcr' },
                    { icon: <Trophy size={16} />, label: 'Give Award', href: '/dashboard/rewards' },
                    { icon: <CalendarDays size={16} />, label: 'SPMS Calendar', href: '/dashboard/spms-calendar', count: pc.overdueCalendarEvents, urgency: pc.overdueCalendarEvents > 0 ? 'red' : 'normal' },
                ]
            case 'division_chief':
                return [
                    { icon: <CheckSquare size={16} />, label: 'Approve Leaves', href: '/dashboard/leaves', count: pc.pendingLeaves, urgency: pc.pendingLeaves > 0 ? 'amber' : 'normal' },
                    { icon: <ClipboardCheck size={16} />, label: 'Review Team IPCR', href: '/dashboard/approvals', count: pc.pendingIPCR, urgency: pc.pendingIPCR > 0 ? 'amber' : 'normal' },
                    { icon: <BookOpen size={16} />, label: 'Monitoring Journal', href: '/dashboard/monitoring', count: pc.pendingJournals },
                    { icon: <TrendingUp size={16} />, label: 'Dev Plans', href: '/dashboard/development-plan' },
                ]
            case 'admin_staff':
                return [
                    { icon: <Users size={16} />, label: 'Manage Users', href: '/dashboard/admin' },
                    { icon: <Clock size={16} />, label: 'All DTR', href: '/dashboard/dtr' },
                    { icon: <FileText size={16} />, label: 'All IPCR', href: '/dashboard/ipcr' },
                    { icon: <Trophy size={16} />, label: 'Awards', href: '/dashboard/rewards' },
                    { icon: <ShieldCheck size={16} />, label: 'Audit Logs', href: '/dashboard/admin' },
                ]
            default:
                return [] // project_staff handled separately (grid view below)
        }
    }

    const actions = getActions()
    const showEmployeeGrid = actions.length === 0

    const employeeActions: { label: string; href: string; icon: LucideIcon; iconBg: string; iconColor: string; badge?: number }[] = [
        {
            label: 'File Leave',
            href: '/dashboard/leaves/apply',
            icon: CalendarOff,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            label: 'My DTR',
            href: '/dashboard/dtr',
            icon: Clock,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            label: 'My IPCR',
            href: '/dashboard/ipcr',
            icon: FileText,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600'
        },
        {
            label: 'Dev Plan',
            href: '/dashboard/development-plan',
            icon: TrendingUp,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600'
        }
    ]

    return (
        <Card className="border border-border/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/40 flex items-center gap-2 bg-muted/20">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Quick Actions</h3>
            </div>
            <div className="p-4">
                {showEmployeeGrid ? (
                    <div className="grid grid-cols-2 gap-3">
                        {employeeActions.map(action => (
                            <Link
                                key={action.label}
                                href={action.href}
                                className={cn(
                                    "flex flex-col items-center justify-center",
                                    "gap-2 p-4 rounded-lg",
                                    "border border-border bg-card",
                                    "hover:bg-muted/50 hover:border-primary/30",
                                    "hover:shadow-sm",
                                    "transition-all duration-150",
                                    "cursor-pointer group"
                                )}
                            >
                                {/* Icon container */}
                                <div className="relative">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full",
                                        "flex items-center justify-center",
                                        "transition-colors duration-150",
                                        action.iconBg,
                                        "group-hover:opacity-90"
                                    )}>
                                        <action.icon className={cn(
                                            "w-5 h-5",
                                            action.iconColor
                                        )} />
                                    </div>
                                    {/* Badge overlay if needed in future */}
                                    {action.badge !== undefined && action.badge > 0 && (
                                        <span className="
                                            absolute -top-1 -right-1
                                            w-4 h-4 rounded-full
                                            bg-red-500 text-white
                                            text-[10px] font-bold
                                            flex items-center justify-center
                                        ">
                                            {action.badge}
                                        </span>
                                    )}
                                </div>

                                {/* Label */}
                                <span className="text-xs font-medium text-foreground text-center leading-tight">
                                    {action.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {actions.map(action => (
                            <SmartActionButton key={action.label} {...action} />
                        ))}
                    </div>
                )}
            </div>
        </Card>
    )
}
