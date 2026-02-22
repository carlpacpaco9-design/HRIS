'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createIPCR } from '@/app/actions/ipcr'
import { toast } from 'sonner'
import { IPCRTable } from '@/components/ipcr/ipcr-table'
import { isHRManager, isDivisionChief, Role } from '@/lib/roles'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type IPCRClientProps = {
    activeCycle: any
    forms: any[]
    role: string
    currentUserId: string
    existingIpcrId: string | null
}

export function IPCRClient({ activeCycle, forms, role, currentUserId, existingIpcrId }: IPCRClientProps) {
    const router = useRouter()
    const [isCreating, setIsCreating] = useState(false)

    const isHR = isHRManager(role as Role)
    const isChief = isDivisionChief(role as Role)
    const isManager = isHR || isChief

    const ownForms = forms.filter(f => f.employee_id === currentUserId)

    const handleNewIPCR = async () => {
        if (!activeCycle) return

        if (existingIpcrId) {
            if (confirm('You already have an IPCR for this period. Would you like to edit it?')) {
                router.push(`/dashboard/ipcr/${existingIpcrId}`)
            }
            return
        }

        setIsCreating(true)
        const res = await createIPCR({
            spms_cycle_id: activeCycle.id
        })

        if (res.success && res.ipcr_id) {
            toast.success('IPCR Draft Created')
            router.push(`/dashboard/ipcr/${res.ipcr_id}`)
        } else if (res.duplicateId) {
            if (confirm(res.error || 'You already have an IPCR for this period. Would you like to edit it?')) {
                router.push(`/dashboard/ipcr/${res.duplicateId}`)
            }
            setIsCreating(false)
        } else {
            toast.error(res.error || 'Failed to create IPCR')
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
                                    <Plus className="mr-2 h-4 w-4" /> New IPCR
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

        if (existingIpcrId) {
            return (
                <Button onClick={() => router.push(`/dashboard/ipcr/${existingIpcrId}`)} className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Edit className="mr-2 h-4 w-4" /> Edit Current IPCR
                </Button>
            )
        }

        return (
            <Button onClick={handleNewIPCR} disabled={isCreating} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
                <Plus className="mr-2 h-4 w-4" /> {isCreating ? 'Creating...' : 'New IPCR'}
            </Button>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">IPCR</h1>
                    <p className="text-slate-500">Individual Performance Commitment and Review</p>
                </div>
                {renderNewButton()}
            </div>

            {isManager ? (
                <Tabs defaultValue="my" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="my">My IPCR</TabsTrigger>
                        <TabsTrigger value="all">{isHR ? 'All Employees' : 'My Division'}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="my" className="mt-0">
                        <IPCRTable forms={ownForms} isManagerView={false} currentUserId={currentUserId} />
                    </TabsContent>

                    <TabsContent value="all" className="mt-0">
                        <IPCRTable forms={forms} isManagerView={true} currentUserId={currentUserId} />
                    </TabsContent>
                </Tabs>
            ) : (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4 text-slate-900 border-b pb-2">My IPCR History</h2>
                    <IPCRTable forms={ownForms} isManagerView={false} currentUserId={currentUserId} />
                </div>
            )}
        </div>
    )
}
