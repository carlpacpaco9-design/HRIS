import { getLeaveRequests } from '@/app/actions/leaves'
import { getIPCRForms } from '@/app/actions/ipcr'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { LeaveTable } from '@/components/leaves/leave-table'
import { IPCRTable } from '@/components/ipcr/ipcr-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ApprovalsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    const role = profile.role

    // Only these roles can access the approvals page
    if (role !== 'head_of_office' && role !== 'admin_staff' && role !== 'division_chief') {
        redirect('/dashboard')
    }

    // Fetch pending leaves only 
    const { data: leaves } = await getLeaveRequests({ status: 'pending_approval' })
    const pendingLeaves = leaves || []

    // Fetch IPCRs requiring action
    const isHRManager = role === 'head_of_office' || role === 'admin_staff'
    const targetIpcrStatus = isHRManager ? 'reviewed' : 'submitted'
    const { data: ipcrs } = await getIPCRForms({ status: targetIpcrStatus })
    const pendingIpcrs = ipcrs || []

    return (
        <PageContainer title="Approvals">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Approvals</h1>
                <p className="text-slate-500">Items requiring your attention.</p>
            </div>

            <Tabs defaultValue="leaves" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="leaves">
                        Leave Requests
                        {pendingLeaves.length > 0 && (
                            <span className="ml-2 bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                {pendingLeaves.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="ipcr">
                        IPCR
                        {pendingIpcrs.length > 0 && (
                            <span className="ml-2 bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                {pendingIpcrs.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="leaves" className="mt-0">
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 text-slate-900 border-b pb-2">Pending Leave Requests</h2>
                        {!isHRManager && (
                            <p className="text-sm text-amber-600 mb-4 bg-amber-50 p-3 rounded-md border border-amber-200">
                                You are viewing pending leave requests for your division. Only the Head of Office or Admin Staff can approve or reject leaves.
                            </p>
                        )}
                        <LeaveTable
                            leaves={pendingLeaves}
                            isHRManager={isHRManager}
                            isDivisionChief={role === 'division_chief'}
                            currentUserId={user.id}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="ipcr" className="mt-0">
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 text-slate-900 border-b pb-2">
                            {isHRManager ? 'IPCRs Awaiting Finalization' : 'IPCRs Awaiting Endorsement'}
                        </h2>
                        <IPCRTable
                            forms={pendingIpcrs}
                            isManagerView={true}
                            currentUserId={user.id}
                        />
                    </div>
                </TabsContent>
            </Tabs>

        </PageContainer>
    )
}
