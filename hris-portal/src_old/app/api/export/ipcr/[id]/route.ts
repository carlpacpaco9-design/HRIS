import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getIPCRFormById } from '@/app/actions/ipcr'
import { generateIPCRDocument } from '@/lib/export/ipcr-docx'

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

        // Fetch IPCR with full joins
        const { data: ipcr, error } = await getIPCRFormById(id)
        if (error || !ipcr) {
            return NextResponse.json({ error: error ?? 'IPCR not found' }, { status: 404 })
        }

        // Generate document
        const buffer = await generateIPCRDocument(ipcr)

        // Build filename
        const employeeName = (ipcr as any).employee?.full_name
            ?.replace(/\s+/g, '_')
            ?.toUpperCase() ?? 'EMPLOYEE'
        const period = (ipcr as any).rating_period?.name
            ?.replace(/\s+/g, '_') ?? 'PERIOD'
        const filename = `IPCR_${employeeName}_${period}.docx`

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString(),
            },
        })
    } catch (err: any) {
        console.error('[IPCR Export Error]', err)
        return NextResponse.json({ error: err.message ?? 'Export failed' }, { status: 500 })
    }
}
