import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getOPCRFormById } from '@/app/actions/opcr'
import { generateOPCRDocument } from '@/lib/export/opcr-docx'

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

        // Fetch OPCR with full joins
        const { data: opcr, error } = await getOPCRFormById(id)
        if (error || !opcr) {
            return NextResponse.json({ error: error ?? 'OPCR not found' }, { status: 404 })
        }

        // Generate document
        const buffer = await generateOPCRDocument(opcr)

        // Build filename
        const employeeName = opcr.prepared_by_profile?.full_name
            ?.replace(/\s+/g, '_')
            ?.toUpperCase() ?? 'EMPLOYEE'
        const period = opcr.rating_period?.name
            ?.replace(/\s+/g, '_') ?? 'PERIOD'
        const filename = `OPCR_${employeeName}_${period}.docx`

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString(),
            },
        })
    } catch (err: any) {
        console.error('[OPCR Export Error]', err)
        return NextResponse.json({ error: err.message ?? 'Export failed' }, { status: 500 })
    }
}
