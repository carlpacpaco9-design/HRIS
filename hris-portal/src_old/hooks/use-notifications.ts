'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Notification = {
    id: string
    type: string
    title: string
    message: string
    entity_type?: string
    entity_id?: string
    action_url?: string
    is_read: boolean
    created_at: string
}

type UseNotificationsReturn = {
    notifications: Notification[]
    unreadCount: number
    isLoading: boolean
    markAsRead: (ids: string[]) => Promise<void>
    markAllAsRead: () => Promise<void>
    refresh: () => Promise<void>
}

const POLL_INTERVAL = 30_000 // 30 seconds

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications(): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications?limit=20')
            if (!res.ok) return
            const data = await res.json()
            setNotifications(data.notifications ?? [])
            setUnreadCount(data.unreadCount ?? 0)
        } catch {
            // Silent fail — don't crash UI on network error
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Initial fetch on mount
    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    // Polling every 30 seconds — clean up on unmount
    useEffect(() => {
        intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL)
        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current)
            }
        }
    }, [fetchNotifications])

    const markAsRead = useCallback(async (ids: string[]) => {
        if (ids.length === 0) return
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
        })
        setNotifications((prev) =>
            prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - ids.length))
    }, [])

    const markAllAsRead = useCallback(async () => {
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markAllRead: true }),
        })
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
    }, [])

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
    }
}
