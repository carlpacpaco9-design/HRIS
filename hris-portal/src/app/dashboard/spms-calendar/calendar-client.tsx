'use client'

import { useState } from 'react'
import { Plus, Calendar, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { SpmsCalendarTable } from '@/components/spms/spms-calendar-table'
import { CycleDialog } from '@/components/spms/cycle-dialog'
import { format } from 'date-fns'

type CalendarClientProps = {
    cycles: any[]
    canManage: boolean
}

export function CalendarClient({
    cycles,
    canManage
}: CalendarClientProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const activeCycle = cycles.find(c => c.is_active)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">SPMS Calendar</h1>
                    <p className="text-slate-500">Performance management schedule {canManage ? '(New Cycle: HR only)' : ''}</p>
                </div>

                {canManage && (
                    <Button onClick={() => setIsDialogOpen(true)} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
                        <Plus className="mr-2 h-4 w-4" /> New Cycle
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg border shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Calendar className="w-24 h-24" />
                        </div>

                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Current Active Cycle</h3>

                        {activeCycle ? (
                            <div className="flex flex-col gap-2">
                                <span className="inline-flex items-center gap-2 text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full w-max text-sm">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    ACTIVE CYCLE
                                </span>
                                <h2 className="text-3xl font-bold text-slate-900">{activeCycle.name}</h2>
                                <p className="text-slate-500 text-lg">
                                    {format(new Date(activeCycle.period_start), 'MMM d, yyyy')} — {format(new Date(activeCycle.period_end), 'MMM d, yyyy')}
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-lg">
                                <AlertCircle className="w-6 h-6" />
                                <div>
                                    <p className="font-semibold">No active cycle found</p>
                                    <p className="text-sm">Please set an active cycle to enable IPCR and DPCR creation.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <SpmsCalendarTable
                        cycles={cycles}
                        canManage={canManage}
                    />
                </div>

                <div className="md:col-span-1">
                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden sticky top-6">
                        <div className="bg-slate-50 p-4 border-b flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-slate-500" />
                            <h3 className="font-semibold text-slate-800">SPMS Activity Calendar</h3>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-slate-500 mb-4">Standard CSC submission deadlines (Annex D)</p>

                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-600">IPCR submission (Jan-Jun)</span>
                                    <span className="font-medium text-slate-900">Jul 5</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-600">IPCR submission (Jul-Dec)</span>
                                    <span className="font-medium text-slate-900">Jan 5</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-600">DPCR submission</span>
                                    <span className="font-medium text-slate-900">Sep 5</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-600">Performance review</span>
                                    <span className="font-medium text-slate-900">Feb 25</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Top performers list</span>
                                    <span className="font-medium text-slate-900">Mar 15</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CycleDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </div>
    )
}
