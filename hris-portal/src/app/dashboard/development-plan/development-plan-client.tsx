'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { DevPlanTable } from '@/components/development-plans/dev-plan-table'
import { DevPlanSheet } from '@/components/development-plans/dev-plan-sheet'

type DevelopmentPlanClientProps = {
    plans: any[]
    employees: any[]
    canCreate: boolean
}

export function DevelopmentPlanClient({
    plans,
    employees,
    canCreate
}: DevelopmentPlanClientProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<any>(null)

    const handleEdit = (plan: any) => {
        setSelectedPlan(plan)
        setIsSheetOpen(true)
    }

    const handleOpenSheet = () => {
        setSelectedPlan(null)
        setIsSheetOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Development Plans</h1>
                    <p className="text-slate-500">Professional development tracking {canCreate ? '(Create Plan: HR only)' : ''}</p>
                </div>

                {canCreate && (
                    <Button onClick={handleOpenSheet} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
                        <Plus className="mr-2 h-4 w-4" /> Create Plan
                    </Button>
                )}
            </div>

            <div className="mt-6">
                <DevPlanTable
                    plans={plans}
                    onEdit={handleEdit}
                />
            </div>

            <DevPlanSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                plan={selectedPlan}
                employees={employees}
                canEdit={canCreate}
            />
        </div>
    )
}
