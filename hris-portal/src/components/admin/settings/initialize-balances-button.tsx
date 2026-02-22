'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { initializeBalancesForYear } from '@/app/actions/leaves'

export function InitializeBalancesButton({ year }: { year: number }) {
    const [isLoading, setIsLoading] = useState(false)

    const handleInitialize = async () => {
        if (!confirm(`Are you sure you want to initialize leave balances for all active employees for ${year}? This will not affect existing balances.`)) {
            return
        }

        setIsLoading(true)
        const res = await initializeBalancesForYear(year)
        setIsLoading(false)

        if (res.success) {
            toast.success(`Successfully initialized balances for ${res.initialized} employees.`)
        } else {
            toast.error(res.error || 'Failed to initialize balances')
        }
    }

    return (
        <Button
            onClick={handleInitialize}
            disabled={isLoading}
            className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                </>
            ) : (
                <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Initialize Balances for {year}
                </>
            )}
        </Button>
    )
}
