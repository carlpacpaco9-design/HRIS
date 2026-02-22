import { LeaveApplicationForm } from '@/components/leave/leave-application-form'
import PageContainer from '@/components/layout/page-container'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Apply for Leave | HRMS',
    description: 'Digital CSC Form 6 - Application for Leave',
}

export default function LeaveApplicationPage() {
    return (
        <PageContainer title="Leave Management">
            <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Application for Leave</h2>
                <p className="text-muted-foreground">
                    Official Civil Service Commission (CSC) Form 6 Digitized Interface.
                </p>
            </div>

            <LeaveApplicationForm />
        </PageContainer>
    )
}
