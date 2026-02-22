import { createClient } from '@/utils/supabase/server'
import { getDTRPermissions } from '@/lib/dtr-permissions'
import { redirect } from 'next/navigation'
import { StaffDTRDetail } from '@/components/dtr/staff-dtr-detail'
import { PageContainer } from '@/components/layout/page-container'

export default async function StaffDTRPage(props: {
    params: Promise<{ staffId: string }>
}) {
    const { staffId } = await props.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    const permissions = getDTRPermissions(
        adminProfile?.role ?? 'project_staff'
    )

    // Only authorized users can access other staff members' DTR via this route
    if (!permissions.canViewAll) {
        redirect('/dashboard/dtr')
    }

    const { data: adminProfileFull } = await supabase
        .from('profiles')
        .select('role, division')
        .eq('id', user.id)
        .single()

    // Fetch target staff member
    const { data: staff, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', staffId)
        .maybeSingle()

    if (!staff) {
        console.warn("DTR Detail: Staff member not found", staffId)
        if (error) console.error("Fetch error:", error)
        redirect('/dashboard/dtr')
    }

    // SCENARIO TEST 4D: Division isolation check
    if (adminProfileFull?.role === 'division_chief' && staff.division !== adminProfileFull?.division) {
        // Return forbidden / empty state
        return <div className="p-8 flex items-center justify-center text-red-500 font-bold">Forbidden: You can only view DTRs of your own division.</div>
    }

    // Defensive mapping
    let staffDivision = 'No Division'
    if (staff.division) {
        staffDivision = staff.division
    } else if (staff.department) {
        staffDivision = staff.department
    } else if (staff.division_id) {
        staffDivision = 'Assigned (ID)'
    }

    const mappedStaff = {
        ...staff,
        position: staff.position_title || staff.position || 'No position',
        division: staffDivision
    }

    // Fetch current month DTR logs (initial load)
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: dtrLogs, error: logError } = await supabase
        .from('dtr_records')
        .select('*')
        .eq('user_id', staffId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

    if (logError) {
        console.error("DTR Detail: Error fetching logs:", logError)
    }

    return (
        <PageContainer>
            <StaffDTRDetail
                staffMember={mappedStaff as any}
                initialLogs={dtrLogs ?? []}
                permissions={permissions}
                currentMonth={month}
                currentYear={year}
            />
        </PageContainer>
    )
}
