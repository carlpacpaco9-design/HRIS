'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useIdleTimer } from '@/hooks/use-idle-timer'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert, LogOut, Clock } from 'lucide-react'

// Timeout Configuration: 15 minutes total
const LOGOUT_TIME = 15 * 60 * 1000 // 15 minutes
const WARNING_THRESHOLD = 60 * 1000 // 1 minute warning

export function SessionTimeout() {
    const router = useRouter()
    const supabase = createClient()
    const [open, setOpen] = useState(false)
    const [countdown, setCountdown] = useState(60)

    const handleLogout = async () => {
        setOpen(false)
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    const { isWarning, resetTimers } = useIdleTimer({
        timeout: LOGOUT_TIME,
        warningThreshold: WARNING_THRESHOLD,
        onWarning: () => {
            setOpen(true)
            setCountdown(60)
        },
        onIdle: handleLogout,
    })

    // Synchronize countdown with warning state
    useEffect(() => {
        let interval: NodeJS.Timeout

        if (open && countdown > 0) {
            interval = setInterval(() => {
                setCountdown((prev) => prev - 1)
            }, 1000)
        } else if (countdown === 0) {
            handleLogout()
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [open, countdown])

    const handleStayLoggedIn = () => {
        setOpen(false)
        resetTimers()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md border-t-4 border-t-amber-500">
                <DialogHeader>
                    <div className="mx-auto bg-amber-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Clock className="h-6 w-6 text-amber-600 animate-pulse" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold">Session Expiring</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        For security, you will be logged out in <span className="font-bold text-amber-600 text-lg">{countdown}</span> seconds due to inactivity.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="bg-slate-50 p-4 rounded-lg flex items-start gap-3 border border-slate-100">
                        <ShieldAlert className="h-5 w-5 text-slate-400 mt-0.5" />
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Unattended sessions are a security risk in government systems. Please confirm you are still active to maintain your connection.
                        </p>
                    </div>
                </div>
                <DialogFooter className="flex-row gap-3 sm:justify-center">
                    <Button variant="outline" className="flex-1" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Log Out
                    </Button>
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleStayLoggedIn}>
                        I'm Still Here
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
