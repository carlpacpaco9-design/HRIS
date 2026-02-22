'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { MonitoringTable } from '@/components/monitoring/monitoring-table'
import { MonitoringJournalDialog } from '@/components/monitoring/monitoring-journal-dialog'
import { Role } from '@/lib/roles'

type MonitoringClientProps = {
    journals: any[]
    employees: any[]
    cycles: any[]
    canCreate: boolean
    currentUserId: string
    currentUserRole: Role
    currentUserDivision: string
}

export function MonitoringClient({
    journals,
    employees,
    cycles,
    canCreate,
    currentUserId,
    currentUserRole,
    currentUserDivision
}: MonitoringClientProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedJournal, setSelectedJournal] = useState<any>(null)

    const handleEdit = (journal: any) => {
        setSelectedJournal(journal)
        setIsDialogOpen(true)
    }

    const handleOpenDialog = () => {
        setSelectedJournal(null)
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Monitoring & Coaching</h1>
                    <p className="text-slate-500">Performance tracking journals</p>
                </div>

                {canCreate && (
                    <Button onClick={handleOpenDialog} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
                        <Plus className="mr-2 h-4 w-4" /> New Entry
                    </Button>
                )}
            </div>

            <div className="mt-6">
                <MonitoringTable
                    journals={journals}
                    onEdit={handleEdit}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                />
            </div>

            <MonitoringJournalDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                journal={selectedJournal}
                employees={employees}
                cycles={cycles}
                currentUserId={currentUserId}
            />
        </div>
    )
}
