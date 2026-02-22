import { IpcrApprovalDashboard } from '@/components/spms/ipcr-approval-dashboard'
import PageContainer from '@/components/layout/page-container'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Performance Reviews | Admin',
    description: 'Manage and approve staff IPCR forms.',
}

export default function IpcrApprovalsPage() {
    return (
        <PageContainer title="IPCR Approvals">
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Performance Review Workflow</h2>
                <p className="text-muted-foreground">
                    Audit and approve staff Individual Performance Commitment and Review (IPCR) documents.
                </p>
            </div>

            <IpcrApprovalDashboard />
        </PageContainer>
    )
}
