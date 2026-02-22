import { getEmployeeRoster } from '@/app/actions/dtr'
import { commitDtrBatch } from '@/app/actions/dtr-batch'
import { BulkDtrEncoder } from '@/components/dtr/bulk-dtr-encoder'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { isHRManager, Role } from '@/lib/roles'
import PageContainer from '@/components/layout/page-container'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Bulk DTR Encoding | HRMS',
    description: 'Transcribe paper logbooks into the system in daily batches.',
}

export default async function DtrBatchPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    // Authorization Check
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !isHRManager(profile.role as Role)) {
        redirect('/dashboard')
    }

    // Fetch Employees
    const rosterResponse = await getEmployeeRoster()

    if (!rosterResponse.success || !rosterResponse.data) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-destructive">Error loading roster</h2>
                <p className="text-muted-foreground">{rosterResponse.error}</p>
            </div>
        )
    }

    // Flatten the roster (it's grouped by division in getEmployeeRoster)
    const allEmployees = Object.values(rosterResponse.data).flat().map(emp => ({
        id: emp.id,
        full_name: emp.full_name,
        employee_number: emp.employee_number
    }))

    return (
        <PageContainer title="Bulk DTR Encoding">
            <BulkDtrEncoder
                employees={allEmployees}
            />
        </PageContainer>
    )
}
