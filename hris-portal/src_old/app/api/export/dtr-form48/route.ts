import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateForm48DOCX } from '@/lib/export/dtr-form48-docx'
import { getStaffDTR } from '@/app/actions/dtr-admin'

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    // Optional: Allow admin to export for others
    const targetStaffId = searchParams.get('userId')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    // Permission check if exporting for another user
    let exportStaffId = user.id
    if (targetStaffId && targetStaffId !== user.id) {
        const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = currentUserProfile?.role
        if (role !== 'admin_staff' && role !== 'head_of_office') {
            exportStaffId = user.id
        } else {
            exportStaffId = targetStaffId
        }
    }

    // Fetch Staff Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, position, department, division')
        .eq('id', exportStaffId)
        .single()

    if (!profile) {
        return new NextResponse('Staff member not found', { status: 404 })
    }

    // Fetch DTR Logs
    // Re-using the action logic, but actions are internal. 
    // We can call the action function directly if it's exported and server-compatible.
    // dtr-admin.ts functions are marked 'use server' but can be imported here?
    // Yes, 'use server' functions can be called from route handlers.

    const dtrData = await getStaffDTR(exportStaffId, month, year)

    // Transform to simpler DTRLog format expected by generator
    const logs = dtrData.map(day => ({
        log_date: day.date,
        am_arrival: day.logs?.am_arrival || null,
        am_departure: day.logs?.am_departure || null,
        pm_arrival: day.logs?.pm_arrival || null,
        pm_departure: day.logs?.pm_departure || null,
        undertime_hours: day.logs?.undertime_hours || 0,
        undertime_minutes: day.logs?.undertime_minutes || 0
    }))

    try {
        const docBuffer = await generateForm48DOCX({
            staff: {
                full_name: profile.full_name || 'Unknown',
                position: profile.position || '',
                division: profile.division || ''
            },
            month,
            year,
            logs
        })

        const filename = `DTR_${profile.full_name.replace(/\s+/g, '_')}_${year}_${month}.docx`

        return new NextResponse(docBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })

    } catch (err: any) {
        console.error('Export Error:', err)
        return new NextResponse('Failed to generate DOCX', { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const month = parseInt(body.month || String(new Date().getMonth() + 1))
        const year = parseInt(body.year || String(new Date().getFullYear()))
        const targetStaffId = body.employee_id || body.userId;

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        let exportStaffId = user.id
        if (targetStaffId && targetStaffId !== user.id) {
            const { data: currentUserProfile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            const role = currentUserProfile?.role
            if (role !== 'admin_staff' && role !== 'head_of_office') {
                // As per test requirement, return own DTR only instead of throwing forbidden if not authorized 
                // Alternatively, we can just enforce exportStaffId = user.id
                exportStaffId = user.id
            } else {
                exportStaffId = targetStaffId
            }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, position, department, division')
            .eq('id', exportStaffId)
            .single()

        if (!profile) return new NextResponse('Staff member not found', { status: 404 })

        const dtrData = await getStaffDTR(exportStaffId, month, year)

        const logs = dtrData.map(day => ({
            log_date: day.date,
            am_arrival: day.logs?.am_arrival || null,
            am_departure: day.logs?.am_departure || null,
            pm_arrival: day.logs?.pm_arrival || null,
            pm_departure: day.logs?.pm_departure || null,
            undertime_hours: day.logs?.undertime_hours || 0,
            undertime_minutes: day.logs?.undertime_minutes || 0
        }))

        const docBuffer = await generateForm48DOCX({
            staff: {
                full_name: profile.full_name || 'Unknown',
                position: profile.position || '',
                division: profile.division || ''
            },
            month,
            year,
            logs
        })

        const filename = `DTR_${profile.full_name.replace(/\s+/g, '_')}_${year}_${month}.docx`

        return new NextResponse(docBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })
    } catch (err: any) {
        return new NextResponse('Failed to generate DOCX', { status: 500 })
    }
}
