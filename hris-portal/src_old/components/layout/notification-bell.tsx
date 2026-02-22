'use client'

import { useState, ReactNode } from 'react'
import { Bell, FileText, CheckCircle2, XCircle, Building2, BookOpen, Trophy, Clock, TrendingUp, CalendarOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useNotifications, Notification } from '@/hooks/use-notifications'

// ── Icon map per notification type ───────────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
    const map: Record<string, ReactNode> = {
        'ipcr.finalized': <FileText className="w-4 h-4 text-green-500" />,
        'leave.filed': <CalendarOff className="w-4 h-4 text-amber-500" />,
        'leave.approved': <CheckCircle2 className="w-4 h-4 text-green-500" />,
        'leave.rejected': <XCircle className="w-4 h-4 text-red-500" />,
        'opcr.submitted': <Building2 className="w-4 h-4 text-blue-500" />,
        'monitoring.submitted': <BookOpen className="w-4 h-4 text-purple-500" />,
        'monitoring.noted': <CheckCircle2 className="w-4 h-4 text-green-500" />,
        'reward.given': <Trophy className="w-4 h-4 text-amber-500" />,
        'spms.deadline': <Clock className="w-4 h-4 text-red-500" />,
        'development_plan.created': <TrendingUp className="w-4 h-4 text-blue-500" />,
    }
    return <>{map[type] ?? <Bell className="w-4 h-4 text-muted-foreground" />}</>
}

// ── Relative time helper ──────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days = Math.floor(diff / 86_400_000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function NotificationSkeleton() {
    return (
        <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-full" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// ── Notification Item ─────────────────────────────────────────────────────────

function NotificationItem({
    notification,
    onRead,
    onClose,
}: {
    notification: Notification
    onRead: (id: string) => void
    onClose: () => void
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            className={cn(
                'flex gap-3 px-4 py-3 border-b border-border last:border-0',
                'cursor-pointer hover:bg-muted/50 transition-colors',
                !notification.is_read && 'bg-primary/5'
            )}
            onClick={async () => {
                if (!notification.is_read) onRead(notification.id)
                if (notification.action_url) {
                    window.location.href = notification.action_url
                }
                onClose()
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click()
            }}
        >
            {/* Icon circle */}
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <NotificationIcon type={notification.type} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm leading-snug', !notification.is_read && 'font-semibold')}>
                        {notification.title}
                    </p>
                    {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {formatRelativeTime(notification.created_at)}
                </p>
            </div>
        </div>
    )
}

// ── Main Bell Component ───────────────────────────────────────────────────────

export function NotificationBell() {
    const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
        useNotifications()
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id="notification-bell-btn"
                    variant="ghost"
                    size="icon"
                    className="relative text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full"
                    aria-label={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in duration-200"
                            aria-hidden="true"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[380px] p-0 shadow-xl" align="end" sideOffset={8}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                            onClick={markAllAsRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Body */}
                <div className="max-h-[420px] overflow-y-auto">
                    {isLoading ? (
                        <NotificationSkeleton />
                    ) : notifications.length === 0 ? (
                        <div className="py-12 flex flex-col items-center gap-2">
                            <Bell className="w-8 h-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                            <p className="text-xs text-muted-foreground/60">You're all caught up!</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <NotificationItem
                                key={n.id}
                                notification={n}
                                onRead={(id) => markAsRead([id])}
                                onClose={() => setOpen(false)}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-border">
                        <p className="text-[11px] text-muted-foreground text-center">
                            Showing last 20 notifications · Updates every 30 seconds
                        </p>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}
