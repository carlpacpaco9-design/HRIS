import { getProfile } from '@/app/actions/profile'
import { createClient } from '@/utils/supabase/server'
import { getDTRPermissions } from '@/lib/dtr-permissions'
import { AdminDTRView } from '@/components/dtr/admin-dtr-view'
import { StaffDTRView } from '@/components/dtr/staff-dtr-view'
import { PageContainer } from '@/components/layout/page-container'
import { redirect } from 'next/navigation'

export default async function DTRPage() {
    const profile = await getProfile()
    const supabase = await createClient()

    if (!profile) {
        redirect('/dashboard')
    }

    const role = profile.role || 'project_staff'
    const permissions = getDTRPermissions(role)

    // ADMIN/HEAD/CHIEF/PMT → Staff roster view
    if (permissions.canViewAll) {
        // Try to fetch as many columns as possible but be safe
        // Note: position_title is the standard, division_id and department are used across the app
        const { data: staff, error: staffError } = await supabase
            .from('profiles')
            .select('*') // Using * is safer when column names are inconsistent
            .eq('is_active', true)
            .not('role', 'eq', 'admin_staff')
            .order('full_name')

        if (staffError) {
            console.error("DTR Page: Error fetching staff:", staffError)
        }

        // Map columns to match AdminDTRView expectations
        const mappedStaff = (staff || []).map(s => {
            // Some parts of the app use 'division' (text), some use 'division_id' (UUID), some use 'department'
            let staffDivision = 'No Division'

            if (s.division) {
                staffDivision = s.division
            } else if (s.department) {
                staffDivision = s.department
            } else if (s.division_id) {
                // If we only have UUID, we'd ideally join, but for now just label it
                staffDivision = 'Assigned (ID)'
            }

            return {
                ...s,
                position: s.position_title || s.position || 'No position',
                division: staffDivision
            }
        })

        // Filter for Division Chiefs if necessary
        let finalStaff = mappedStaff
        if (role === 'division_chief') {
            const myDiv = profile.division_id || profile.division || profile.department
            if (myDiv) {
                finalStaff = mappedStaff.filter(s =>
                    s.division_id === myDiv ||
                    s.division === myDiv ||
                    s.department === myDiv
                )
            }
        }

        return (
            <PageContainer>
                <AdminDTRView
                    staff={finalStaff as any[]}
                    currentUser={profile as any}
                />
            </PageContainer>
        )
    }

    // STAFF → Own DTR view
    return (
        <PageContainer>
            <StaffDTRView
                currentUser={profile as any}
                permissions={permissions}
            />
        </PageContainer>
    )
}
