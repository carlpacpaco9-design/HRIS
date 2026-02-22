'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { createDPCR } from '@/app/actions/dpcr'
import { toast } from 'sonner'
import { DPCRTable } from '@/components/dpcr/dpcr-table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type DPCRClientProps = {
    activeCycle: any
    forms: any[]
    existingDpcrId: string | null
}

export function DPCRClient({ activeCycle, forms, existingDpcrId }: DPCRClientProps) {
    const router = useRouter()
    const [isCreating, setIsCreating] = useState(false)

    const handleNewDPCR = async () => {
        if (!activeCycle) return

        if (existingDpcrId) {
            router.push(`/dashboard/dpcr/${existingDpcrId}`)
            return
        }

        setIsCreating(true)
        const res = await createDPCR({
            spms_cycle_id: activeCycle.id
        })

        if (res.success && res.dpcr_id) {
            toast.success('DPCR Draft Created')
            router.push(`/dashboard/dpcr/${res.dpcr_id}`)
        } else if (res.duplicateId) {
            if (confirm(res.error || 'An DPCR for this cycle already exists. Would you like to edit it?')) {
                router.push(`/dashboard/dpcr/${res.duplicateId}`)
            }
            setIsCreating(false)
        } else {
            toast.error(res.error || 'Failed to create DPCR')
            setIsCreating(false)
        }
    }

    const renderNewButton = () => {
        if (!activeCycle) {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="cursor-not-allowed">
                                <Button disabled className="bg-[#1E3A5F] opacity-50">
                                    <Plus className="mr-2 h-4 w-4" /> New DPCR
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>No active SPMS cycle. Contact your administrator.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        }

        if (existingDpcrId) {
            return (
                <Button onClick={() => router.push(`/dashboard/dpcr/${existingDpcrId}`)} className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Edit className="mr-2 h-4 w-4" /> Edit Current DPCR
                </Button>
            )
        }

        return (
            <Button onClick={handleNewDPCR} disabled={isCreating} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
                <Plus className="mr-2 h-4 w-4" /> {isCreating ? 'Creating...' : 'New DPCR'}
            </Button>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">DPCR</h1>
                    <p className="text-slate-500">Office Performance Commitment and Review</p>
                </div>
                {renderNewButton()}
            </div>

            <div className="mt-6">
                <DPCRTable forms={forms} />
            </div>
        </div>
    )
}
