import { LeaveApprovalDashboard } from '@/components/leave/leave-approval-dashboard'
import { LeaveLedgerView } from '@/components/leave/leave-ledger-view'
import PageContainer from '@/components/layout/page-container'
import { Metadata } from 'next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileCheck, History } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Leave Administration | HRMS',
    description: 'Manage employee leave applications and credit ledger.',
}

export default function LeaveAdminPage() {
    // Mock data for Ledger demo as per requirements
    const mockLedgerEntries = [
        {
            period: 'Dec 2025',
            particulars: 'Balance Forwarded',
            vl_earned: null,
            vl_taken: null,
            vl_balance: 15.000,
            sl_earned: null,
            sl_taken: null,
            sl_balance: 12.500
        },
        {
            period: 'Jan 2026',
            particulars: 'Earned for Jan',
            vl_earned: 1.250,
            vl_taken: null,
            vl_balance: 16.250,
            sl_earned: 1.250,
            sl_taken: null,
            sl_balance: 13.750
        },
        {
            period: 'Jan 15, 2026',
            particulars: 'Vacation Leave',
            vl_earned: null,
            vl_taken: 2.000,
            vl_balance: 14.250,
            sl_earned: null,
            sl_taken: null,
            sl_balance: 13.750
        },
        {
            period: 'Feb 2026',
            particulars: 'Earned for Feb',
            vl_earned: 1.250,
            vl_taken: null,
            vl_balance: 15.500,
            sl_earned: 1.250,
            sl_taken: null,
            sl_balance: 15.000
        }
    ]

    return (
        <PageContainer title="Leave Management Admin">
            <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Leave Administration</h2>
                <p className="text-muted-foreground">
                    Audit applications and maintain employee leave ledger cards.
                </p>
            </div>

            <Tabs defaultValue="pending" className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="pending" className="gap-2">
                        <FileCheck className="w-4 h-4" />
                        Pending Approvals
                    </TabsTrigger>
                    <TabsTrigger value="ledger" className="gap-2">
                        <History className="w-4 h-4" />
                        Leave Ledger (Demo)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    <LeaveApprovalDashboard />
                </TabsContent>

                <TabsContent value="ledger">
                    <LeaveLedgerView
                        employeeName="JUAN D. VALDEZ"
                        entries={mockLedgerEntries}
                    />
                </TabsContent>
            </Tabs>
        </PageContainer>
    )
}
