'use client'

import { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
            <div className="p-4 rounded-full bg-red-50 text-red-500 mb-2">
                <AlertCircle className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Something went wrong!</h2>
            <p className="text-slate-500 max-w-md">
                We encountered an unexpected error while loading the dashboard. Please try refreshing the page.
            </p>
            <div className="pt-4">
                <Button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                </Button>
            </div>
        </div>
    )
}
