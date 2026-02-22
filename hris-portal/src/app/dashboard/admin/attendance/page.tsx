import { AdminAttendanceDashboard } from '@/components/admin/dtr/admin-attendance-dashboard'
import PageContainer from '@/components/layout/page-container'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Staff Daily Time Records | Admin',
    description: 'Review and print monthly Form 48 reports for all staff members.',
}

export default function AdminAttendancePage() {
    return (
        <PageContainer title="Attendance Management">
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Staff Daily Time Records</h2>
                <p className="text-muted-foreground">
                    Generate official CSC Form 48 for individual staff review and approval.
                </p>
            </div>

            <AdminAttendanceDashboard />
        </PageContainer>
    )
}
