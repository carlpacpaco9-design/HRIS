'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface IdleTimerProps {
    timeout: number // Total time in ms
    onIdle: () => void // Function to call when idle
    onWarning: () => void // Function to call when approaching idle
    warningThreshold: number // Time in ms before timeout to trigger warning
}

export function useIdleTimer({
    timeout,
    onIdle,
    onWarning,
    warningThreshold
}: IdleTimerProps) {
    const [isIdle, setIsIdle] = useState(false)
    const [isWarning, setIsWarning] = useState(false)

    const timeoutTimer = useRef<NodeJS.Timeout | null>(null)
    const warningTimer = useRef<NodeJS.Timeout | null>(null)

    const resetTimers = useCallback(() => {
        // Clear existing timers
        if (timeoutTimer.current) clearTimeout(timeoutTimer.current)
        if (warningTimer.current) clearTimeout(warningTimer.current)

        setIsIdle(false)
        setIsWarning(false)

        // Set new warning timer (e.g., at 14 mins)
        warningTimer.current = setTimeout(() => {
            setIsWarning(true)
            onWarning()
        }, timeout - warningThreshold)

        // Set new timeout timer (e.g., at 15 mins)
        timeoutTimer.current = setTimeout(() => {
            setIsIdle(true)
            onIdle()
        }, timeout)
    }, [timeout, onIdle, onWarning, warningThreshold])

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

        const handleActivity = () => {
            resetTimers()
        }

        // Initialize timers
        resetTimers()

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity)
        })

        // Cleanup
        return () => {
            if (timeoutTimer.current) clearTimeout(timeoutTimer.current)
            if (warningTimer.current) clearTimeout(warningTimer.current)
            events.forEach(event => {
                window.removeEventListener(event, handleActivity)
            })
        }
    }, [resetTimers])

    return { isIdle, isWarning, resetTimers }
}
