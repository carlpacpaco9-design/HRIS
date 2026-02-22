'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeaveBalanceCards } from '@/components/leaves/leave-balance-cards'
import { LeaveTable } from '@/components/leaves/leave-table'
import { FileLeaveDialog } from '@/components/leaves/file-leave-dialog'
import { LeaveRequest, LeaveBalance } from '@/app/actions/leaves'

type LeaveClientProps = {
    leaves: LeaveRequest[]
    balance: LeaveBalance | null
    role: string
    currentUserId: string
}

export function LeaveClient({ leaves, balance, role, currentUserId }: LeaveClientProps) {
    const router = useRouter()
    const [isFileOpen, setIsFileOpen] = useState(false)

    const isHRManager = role === 'head_of_office' || role === 'admin_staff'
    const isDivisionChief = role === 'division_chief'

    const ownLeaves = leaves.filter(l => l.employee_id === currentUserId)
    const pendingLeaves = leaves.filter(l => l.status === 'pending_approval')

    const handleSave = () => {
        router.refresh()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leave Management</h1>
                    <p className="text-slate-500">Manage your leave applications and balances.</p>
                </div>
                <Button onClick={() => setIsFileOpen(true)} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
                    <Plus className="mr-2 h-4 w-4" /> File Leave
                </Button>
            </div>

            <FileLeaveDialog
                isOpen={isFileOpen}
                onOpenChange={setIsFileOpen}
                balance={balance}
                onSave={handleSave}
            />

            {isHRManager ? (
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="all">All Leaves</TabsTrigger>
                        <TabsTrigger value="pending">Pending <span className="ml-2 bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs">{pendingLeaves.length}</span></TabsTrigger>
                        <TabsTrigger value="my">My Leaves</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-0">
                        <LeaveTable leaves={leaves} isHRManager={true} isDivisionChief={false} currentUserId={currentUserId} />
                    </TabsContent>

                    <TabsContent value="pending" className="mt-0">
                        <LeaveTable leaves={pendingLeaves} isHRManager={true} isDivisionChief={false} currentUserId={currentUserId} />
                    </TabsContent>

                    <TabsContent value="my" className="mt-0">
                        <LeaveBalanceCards balance={balance} />
                        <LeaveTable leaves={ownLeaves} isHRManager={true} isDivisionChief={false} currentUserId={currentUserId} />
                    </TabsContent>
                </Tabs>
            ) : isDivisionChief ? (
                <Tabs defaultValue="division" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="division">Division Leaves</TabsTrigger>
                        <TabsTrigger value="my">My Leaves</TabsTrigger>
                    </TabsList>

                    <TabsContent value="division" className="mt-0">
                        {/* Division Chief sees division leaves but can't approve, so treat isHRManager=false to hide approve/reject buttons */}
                        <LeaveTable leaves={leaves} isHRManager={false} isDivisionChief={true} currentUserId={currentUserId} />
                    </TabsContent>

                    <TabsContent value="my" className="mt-0">
                        <LeaveBalanceCards balance={balance} />
                        <LeaveTable leaves={ownLeaves} isHRManager={false} isDivisionChief={true} currentUserId={currentUserId} />
                    </TabsContent>
                </Tabs>
            ) : (
                // Project Staff / Regular logic
                <div>
                    <LeaveBalanceCards balance={balance} />
                    <h2 className="text-xl font-semibold mb-4 text-slate-900 border-b pb-2">My Leave History</h2>
                    <LeaveTable leaves={ownLeaves} isHRManager={false} isDivisionChief={false} currentUserId={currentUserId} />
                </div>
            )}
        </div>
    )
}
