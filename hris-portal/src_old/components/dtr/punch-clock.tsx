'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Clock, MapPin, LogIn, LogOut, Loader2, CheckCircle2 } from "lucide-react"
import { punchClock, PunchType } from "@/app/actions/dtr"
import { format } from "date-fns"
import { formatTime12h } from '@/lib/utils'

export function PunchClock({ initialLog }: { initialLog: any }) {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [log, setLog] = useState(initialLog)
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)

    // Update real-time clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Get location on mount
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn("Geolocation denied/unavailable"),
                { enableHighAccuracy: true }
            )
        }
    }, [])

    const handlePunch = async (type: PunchType) => {
        setIsLoading(type)

        // Final attempt to get location right before punch if not already set
        let finalLat = location?.lat
        let finalLng = location?.lng

        if (!location && "geolocation" in navigator) {
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject)
                })
                finalLat = pos.coords.latitude
                finalLng = pos.coords.longitude
            } catch (e) {
                console.warn("Could not get location for punch")
            }
        }

        const res = await punchClock(type, finalLat, finalLng)
        setIsLoading(null)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(`${type.replace('_', ' ').toUpperCase()} Recorded at ${formatTime12h(res.time)}`)
            // Update local state to show current punch
            setLog({ ...log, [type]: res.time })
        }
    }

    const punchButtons: { type: PunchType, label: string, icon: any, color: string }[] = [
        { type: 'am_in', label: 'AM Arrival', icon: LogIn, color: 'bg-green-600 hover:bg-green-700' },
        { type: 'am_out', label: 'AM Departure', icon: LogOut, color: 'bg-orange-600 hover:bg-orange-700' },
        { type: 'pm_in', label: 'PM Arrival', icon: LogIn, color: 'bg-blue-600 hover:bg-blue-700' },
        { type: 'pm_out', label: 'PM Departure', icon: LogOut, color: 'bg-red-600 hover:bg-red-700' },
    ]

    return (
        <Card className="max-w-md mx-auto overflow-hidden border-none shadow-xl bg-slate-900 text-white">
            <CardHeader className="text-center pb-2 bg-slate-800/50">
                <CardDescription className="text-slate-400 capitalize pt-2">
                    {format(currentTime, 'EEEE, MMMM d, yyyy')}
                </CardDescription>
                <div className="text-5xl font-mono font-bold tracking-widest text-blue-400 py-4 tabular-nums">
                    {format(currentTime, 'hh:mm:ss a')}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <MapPin className={`h-3 w-3 ${location ? 'text-green-500' : 'text-slate-600'}`} />
                    {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Detecting Location..."}
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                    {punchButtons.map((btn) => {
                        const isDone = !!log?.[btn.type]
                        const Icon = btn.icon

                        return (
                            <Button
                                key={btn.type}
                                size="lg"
                                variant={isDone ? "outline" : "default"}
                                className={`h-24 flex flex-col gap-2 transition-all duration-300 ${isDone
                                    ? 'border-slate-700 bg-slate-800/50 text-slate-400 cursor-default opacity-50'
                                    : `${btn.color} text-white shadow-lg active:scale-95`
                                    }`}
                                onClick={() => !isDone && handlePunch(btn.type)}
                                disabled={isDone || (isLoading !== null)}
                            >
                                {isLoading === btn.type ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : isDone ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                ) : (
                                    <Icon className="h-6 w-6" />
                                )}
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-bold uppercase tracking-tighter">{btn.label}</span>
                                    {isDone && (
                                        <span className="text-[10px] font-mono mt-1 text-green-400">
                                            {log[btn.type]}
                                        </span>
                                    )}
                                </div>
                            </Button>
                        )
                    })}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Morning IN:</span>
                        <span className="font-mono text-slate-200">{formatTime12h(log?.am_in)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Morning OUT:</span>
                        <span className="font-mono text-slate-200">{formatTime12h(log?.am_out)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Afternoon IN:</span>
                        <span className="font-mono text-slate-200">{formatTime12h(log?.pm_in)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Afternoon OUT:</span>
                        <span className="font-mono text-slate-200">{formatTime12h(log?.pm_out)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
