'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { RewardsTable } from '@/components/rewards/rewards-table'
import { GiveAwardDialog } from '@/components/rewards/give-award-dialog'
import { Role } from '@/lib/roles'

type RewardsClientProps = {
    awards: any[]
    employees: any[]
    canCreate: boolean
    currentUserRole: Role
}

export function RewardsClient({
    awards,
    employees,
    canCreate,
    currentUserRole
}: RewardsClientProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{currentUserRole === 'project_staff' ? 'My Awards' : 'Rewards & Incentives'}</h1>
                    <p className="text-slate-500">PRAISE awards and recognition</p>
                </div>

                {canCreate && (
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
                        <Plus className="mr-2 h-4 w-4" /> Give Award
                    </Button>
                )}
            </div>

            <div className="mt-6">
                <RewardsTable
                    awards={awards}
                    canDelete={canCreate}
                />
            </div>

            <GiveAwardDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                employees={employees}
            />
        </div>
    )
}
