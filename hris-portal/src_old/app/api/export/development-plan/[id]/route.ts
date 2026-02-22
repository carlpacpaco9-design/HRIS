import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getDevelopmentPlanById } from '@/app/actions/development-plan'
import { generateDevelopmentPlanDocument } from '@/lib/export/development-plan-docx'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Auth check
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Fetch Development Plan with full joins
        const { data: plan, error } = await getDevelopmentPlanById(id)
        if (error || !plan) {
            return NextResponse.json({ error: error ?? 'Development plan not found' }, { status: 404 })
        }

        // Generate document
        const buffer = await generateDevelopmentPlanDocument(plan)

        // Build filename
        const employeeName = plan.employee?.full_name
            ?.replace(/\s+/g, '_')
            ?.toUpperCase() ?? 'EMPLOYEE'
        const planDate = plan.plan_date
            ? new Date(plan.plan_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }).replace('/', '-')
            : 'DATE'
        const filename = `Development_Plan_${employeeName}_${planDate}.docx`

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString(),
            },
        })
    } catch (err: any) {
        console.error('[Development Plan Export Error]', err)
        return NextResponse.json({ error: err.message ?? 'Export failed' }, { status: 500 })
    }
}
