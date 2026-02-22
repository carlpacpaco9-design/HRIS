import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { isHRManager, Role } from '@/lib/roles'
import { getDTRByMonth, DTRLog } from '@/app/actions/dtr'
import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    AlignmentType,
    WidthType,
    BorderStyle,
    VerticalAlign,
    ColumnBreak,
} from 'docx'
import { getDaysInMonth, format, isWeekend } from 'date-fns'

function formatTimeForForm48(time: string | null): string {
    if (!time) return ""
    const [hourStr, minuteStr] = time.split(':')
    const hour = parseInt(hourStr ?? '0', 10)
    const minute = minuteStr ?? '00'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minute}`
}

function splitUndertime(totalMinutes: number): { hours: string; minutes: string } {
    if (totalMinutes === 0) {
        return { hours: "", minutes: "" }
    }
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return {
        hours: hours > 0 ? hours.toString() : "",
        minutes: mins > 0 ? mins.toString() : "",
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const employeeId = searchParams.get('employeeId')
        const month = searchParams.get('month')
        const year = searchParams.get('year')

        if (!employeeId || !month || !year) {
            return new NextResponse('Missing parameters', { status: 400 })
        }

        const m = parseInt(month)
        const y = parseInt(year)

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return new NextResponse('Unauthorized', { status: 401 })

        const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = currentUserProfile?.role as Role
        if (user.id !== employeeId && !isHRManager(role)) {
            return new NextResponse('Forbidden', { status: 403 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', employeeId)
            .single()

        if (!profile) return new NextResponse('Employee not found', { status: 404 })

        const dtrResult = await getDTRByMonth(employeeId, m, y)
        if (!dtrResult.success) {
            return new NextResponse(dtrResult.error || 'Failed to fetch DTR', { status: 500 })
        }

        const logs = (dtrResult.data || []) as DTRLog[]

        // Data for Docx
        const lastName = profile.full_name.split(',')[0]?.trim() ?? profile.full_name
        const dateObjForMonthCount = new Date(y, m - 1)
        const monthNameFull = format(dateObjForMonthCount, 'MMMM yyyy')
        const daysInMonthCount = getDaysInMonth(dateObjForMonthCount)

        const filename = `Form48_${lastName}_${monthNameFull.replace(' ', '')}.docx`

        // Layout Constants - Narrow Layout for 2-column
        const cw = [500, 850, 850, 850, 850, 850, 850] // sums to 5600
        const totalW = 5600

        const tableBorders = {
            top: { style: BorderStyle.SINGLE, size: 4 },
            bottom: { style: BorderStyle.SINGLE, size: 4 },
            left: { style: BorderStyle.SINGLE, size: 4 },
            right: { style: BorderStyle.SINGLE, size: 4 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4 },
            insideVertical: { style: BorderStyle.SINGLE, size: 4 },
        }

        const noBorders = {
            top: { style: BorderStyle.NONE, size: 0, color: "auto" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
        }

        const createCell = (text: string, colSpan = 1, rowSpan = 1, bold = false, align = AlignmentType.CENTER, shading?: string) => {
            return new TableCell({
                columnSpan: colSpan,
                rowSpan: rowSpan,
                shading: shading ? { fill: shading } : undefined,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 20, bottom: 20, left: 20, right: 20 },
                children: [new Paragraph({ alignment: align, children: [new TextRun({ text, bold, size: 16, font: "Arial" })] })],
            })
        }

        const getColumnContent = () => {
            // DTR Rows
            const rows: TableRow[] = []

            // Row 1
            rows.push(new TableRow({
                children: [
                    createCell("Day", 1, 2, true),
                    createCell("A.M.", 2, 1, true),
                    createCell("P.M.", 2, 1, true),
                    createCell("Undertime", 2, 1, true),
                ]
            }))

            // Row 2
            rows.push(new TableRow({
                children: [
                    createCell("Arrival", 1, 1, true),
                    createCell("Depar-\nture", 1, 1, true),
                    createCell("Arrival", 1, 1, true),
                    createCell("Depar-\nture", 1, 1, true),
                    createCell("Hours", 1, 1, true),
                    createCell("Min-\nutes", 1, 1, true),
                ]
            }))

            // Day Rows
            for (let day = 1; day <= 31; day++) {
                if (day <= daysInMonthCount) {
                    const fullDateStr = `${y}-${m.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
                    const log = logs.find(l => l.log_date === fullDateStr)
                    const isWkend = isWeekend(new Date(`${fullDateStr}T00:00:00`))
                    const shading = isWkend ? "F2F2F2" : undefined

                    if (log) {
                        const totalMins = (log.undertime_hours * 60) + log.undertime_minutes
                        const ut = splitUndertime(totalMins)
                        rows.push(new TableRow({
                            height: { value: 240, rule: "atLeast" },
                            children: [
                                createCell(day.toString(), 1, 1, true, AlignmentType.CENTER, shading),
                                createCell(formatTimeForForm48(log.am_arrival), 1, 1, false, AlignmentType.CENTER, shading),
                                createCell(formatTimeForForm48(log.am_departure), 1, 1, false, AlignmentType.CENTER, shading),
                                createCell(formatTimeForForm48(log.pm_arrival), 1, 1, false, AlignmentType.CENTER, shading),
                                createCell(formatTimeForForm48(log.pm_departure), 1, 1, false, AlignmentType.CENTER, shading),
                                createCell(ut.hours, 1, 1, false, AlignmentType.CENTER, shading),
                                createCell(ut.minutes, 1, 1, false, AlignmentType.CENTER, shading),
                            ]
                        }))
                    } else {
                        rows.push(new TableRow({
                            height: { value: 240, rule: "atLeast" },
                            children: [
                                createCell(day.toString(), 1, 1, true, AlignmentType.CENTER, shading),
                                createCell("", 1, 1, false, AlignmentType.CENTER, shading),
                                createCell("", 1, 1, false, AlignmentType.CENTER, shading),
                                createCell("", 1, 1, false, AlignmentType.CENTER, shading),
                                createCell("", 1, 1, false, AlignmentType.CENTER, shading),
                                createCell("", 1, 1, false, AlignmentType.CENTER, shading),
                                createCell("", 1, 1, false, AlignmentType.CENTER, shading),
                            ]
                        }))
                    }
                } else {
                    // padding for 31 days
                    rows.push(new TableRow({
                        height: { value: 240, rule: "atLeast" },
                        children: [
                            createCell(day.toString(), 1, 1, true, AlignmentType.CENTER),
                            createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""),
                        ]
                    }))
                }
            }

            // Total Row
            const overallMins = logs.reduce((sum, log) => sum + ((log.undertime_hours * 60) + log.undertime_minutes), 0)
            const totalUt = splitUndertime(overallMins)
            rows.push(new TableRow({
                height: { value: 240, rule: "atLeast" },
                children: [
                    createCell(""), createCell(""), createCell(""), createCell(""),
                    createCell("Total", 1, 1, true),
                    createCell(totalUt.hours, 1, 1, true),
                    createCell(totalUt.minutes, 1, 1, true),
                ]
            }))

            const dtrTable = new Table({
                width: { size: totalW, type: WidthType.DXA },
                columnWidths: cw,
                borders: tableBorders,
                rows: rows
            })

            return [
                new Paragraph({
                    children: [new TextRun({ text: "Civil Service Form No. 48", size: 16, italics: true, font: "Arial" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "DAILY TIME RECORD", bold: true, size: 24, font: "Arial" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "-----o0o-----", size: 16, font: "Arial" })]
                }),
                new Paragraph({ spacing: { before: 200 }, children: [] }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } },
                    children: [new TextRun({ text: profile.full_name.toUpperCase(), bold: true, size: 16, font: "Arial" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "(Name)", size: 16, font: "Arial" })]
                }),
                new Paragraph({ spacing: { before: 200 }, children: [] }),

                new Table({
                    width: { size: totalW, type: WidthType.DXA },
                    columnWidths: [2000, 3600],
                    borders: noBorders,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    columnSpan: 2,
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({ text: `For the month of `, size: 16, font: "Arial", italics: true }),
                                                new TextRun({ text: monthNameFull, size: 16, font: "Arial", underline: {} })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: "Official hours for arrival", size: 16, font: "Arial", italics: true })] }),
                                        new Paragraph({ children: [new TextRun({ text: "and departure", size: 16, font: "Arial", italics: true })] }),
                                    ]
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: "Regular days ___________________", size: 16, font: "Arial", italics: true })] }),
                                        new Paragraph({ children: [new TextRun({ text: "Saturdays ______________________", size: 16, font: "Arial", italics: true })] }),
                                    ]
                                })
                            ]
                        })
                    ]
                }),

                new Paragraph({ spacing: { before: 100 }, children: [] }),
                dtrTable,

                new Paragraph({
                    spacing: { before: 200 },
                    children: [new TextRun({
                        text: "I certify on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from office.",
                        size: 16,
                        italics: true,
                        font: "Arial"
                    })]
                }),

                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400 },
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } },
                    children: [new TextRun({ text: " ", font: "Arial" })]
                }),

                new Paragraph({
                    spacing: { before: 300 },
                    children: [new TextRun({ text: "VERIFIED as to the prescribed office hours:", size: 16, italics: true, font: "Arial" })]
                }),

                new Paragraph({
                    spacing: { before: 400 },
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "ATTY. MHELYGENE D. TESORO-RAMOS, REA", size: 16, font: "Arial" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "Provincial Assessor", size: 16, font: "Arial" })]
                }),

                new Paragraph({
                    spacing: { before: 400 },
                    alignment: AlignmentType.CENTER,
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } },
                    children: [new TextRun({ text: " ", font: "Arial" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "In Charge", size: 16, font: "Arial" })]
                }),
            ]
        }

        const doc = new Document({
            sections: [{
                properties: {
                    column: { count: 2, space: 720 },
                    page: { size: { width: 12240, height: 20160 }, margin: { top: 720, bottom: 720, left: 1080, right: 1080 } }
                },
                children: [
                    ...getColumnContent(),
                    new Paragraph({ children: [new ColumnBreak()] }),
                    ...getColumnContent()
                ]
            }]
        })

        const buffer = await Packer.toBuffer(doc)

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })

    } catch (error: any) {
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
    }
}
