'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex bg-white h-full min-h-[400px] flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-rose-200">
            <div className="p-3 bg-rose-50 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                {process.env.NODE_ENV === 'development' ? error.message : "An unexpected error occurred while loading this page."}
            </p>

            <div className="flex gap-4">
                <Button onClick={() => reset()} className="bg-[#1E3A5F]">
                    Try Again
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
            </div>
        </div>
    )
}
