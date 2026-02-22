import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getIPCRSummaryReport } from '@/app/actions/ipcr'
import { generateIPCRSummaryExcel } from '@/lib/export/ipcr-summary-xlsx'

export async function GET(request: NextRequest) {
    try {
        // Auth check
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Read query params
        const { searchParams } = new URL(request.url)
        const period_id = searchParams.get('period_id')
        const division_name = searchParams.get('division') ?? undefined
        const period_name = searchParams.get('period_name') ?? 'Period'

        if (!period_id) {
            return NextResponse.json({ error: 'period_id is required' }, { status: 400 })
        }

        // Fetch summary data
        const { data: summary, error } = await getIPCRSummaryReport(period_id)
        if (error || !summary) {
            return NextResponse.json({ error: error ?? 'Summary not found' }, { status: 404 })
        }

        // Generate Excel — coerce avg_rating from string (returned by action's toFixed) to number
        const buffer = generateIPCRSummaryExcel({
            ...summary,
            total_employees: summary.total_staff,
            period_name,
            division_name,
            average_rating: Number(summary.average_rating) || 0,
            individual_ratings: summary.individual_ratings.map((r: any) => ({
                ...r,
                employee: r.staff,
            })),
            division_breakdown: summary.division_breakdown.map((d: any) => ({
                ...d,
                avg_rating: Number(d.avg_rating) || 0,
            })),
        })

        // Build filename
        const safePeriod = period_name.replace(/\s+/g, '_')
        const safeDivision = division_name ? `_division_${division_name.replace(/\s+/g, '_')}` : ''
        const filename = `IPCR_Summary_${safePeriod}${safeDivision}.xlsx`

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString(),
            },
        })
    } catch (err: any) {
        console.error('[IPCR Summary Export Error]', err)
        return NextResponse.json({ error: err.message ?? 'Export failed' }, { status: 500 })
    }
}
