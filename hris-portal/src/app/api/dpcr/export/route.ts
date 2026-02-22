import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { isHRManager, isDivisionChief, Role } from '@/lib/roles'
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    Table,
    TableRow,
    TableCell,
    WidthType,
    PageBreak,
    BorderStyle
} from 'docx'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const dpcrId = searchParams.get('dpcr_id')

        if (!dpcrId) return new NextResponse('Missing dpcr_id parameter', { status: 400 })

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return new NextResponse('Unauthorized', { status: 401 })

        const { data: profile } = await supabase.from('profiles').select('role, division').eq('id', user.id).single()
        const role = profile?.role as Role

        const { data: dpcr, error } = await supabase
            .from('dpcr_forms')
            .select('*, profiles!dpcr_forms_prepared_by_fkey(full_name, position), approver:profiles!dpcr_forms_approved_by_fkey(full_name), spms_cycles(start_date, end_date)')
            .eq('id', dpcrId)
            .single()

        if (error || !dpcr) return new NextResponse('DPCR not found', { status: 404 })

        const { data: outputs } = await supabase
            .from('dpcr_outputs')
            .select('*')
            .eq('dpcr_form_id', dpcrId)
            .order('output_order', { ascending: true })

        const activeOutputs = (outputs || []).filter(o => !o._deleted)

        const coreFunc = activeOutputs.filter(o => o.category === 'Core Function')
        const suppFunc = activeOutputs.filter(o => o.category === 'Support Function')

        const startMonth = new Date(dpcr.spms_cycles.start_date).getMonth()
        const periodText = startMonth < 6 ? "January to June" : "July to December"
        const semesterText = startMonth < 6 ? "1ST" : "2ND"
        const year = new Date(dpcr.spms_cycles.start_date).getFullYear()

        const createText = (text: string, bold = false, size = 20, align: any = AlignmentType.LEFT) => {
            return new Paragraph({
                alignment: align,
                children: [new TextRun({ text, bold, size, font: "Arial" })]
            })
        }

        const createCell = (text: string, colSpan = 1, rowSpan = 1, bold = false, align: any = AlignmentType.LEFT, shading?: string) => {
            return new TableCell({
                columnSpan: colSpan,
                rowSpan: rowSpan,
                shading: shading ? { fill: shading } : undefined,
                children: [createText(text, bold, 20, align)],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
            })
        }

        const createCellMultiParagraphs = (paragraphs: Paragraph[], colSpan = 1, rowSpan = 1, align: any = AlignmentType.LEFT) => {
            return new TableCell({
                columnSpan: colSpan,
                rowSpan: rowSpan,
                children: paragraphs,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
            })
        }

        const borderStyle = { style: BorderStyle.SINGLE, size: 4, color: "000000" }
        const tableBorders = {
            top: borderStyle, bottom: borderStyle,
            left: borderStyle, right: borderStyle,
            insideHorizontal: borderStyle, insideVertical: borderStyle,
        }

        const mfoWidth = 2000
        const siWidth = 2400
        const indWidth = 1400
        const actWidth = 1546
        const ratWidth = 400
        const remWidth = 800
        const cw = [mfoWidth, siWidth, indWidth, actWidth, ratWidth, ratWidth, ratWidth, ratWidth, remWidth]

        const createMainContentRows = (opts: any[], emptyRowsCount: number) => {
            const rows: TableRow[] = []
            let count = 0
            for (const o of opts) {
                count++
                rows.push(new TableRow({
                    children: [
                        createCellMultiParagraphs([
                            createText(`${count}. ${o.major_final_output || ''}`)
                        ], 1, 1),
                        createCellMultiParagraphs([
                            createText(`Target/Measure: ${o.success_indicators || ''}`)
                        ], 1, 1),
                        createCell(o.division_accountable || "", 1, 1),
                        createCell(o.actual_accomplishments || "", 1, 1),
                        createCell(o.rating_quantity ? String(o.rating_quantity) : "", 1, 1, false, AlignmentType.CENTER),
                        createCell(o.rating_efficiency ? String(o.rating_efficiency) : "", 1, 1, false, AlignmentType.CENTER),
                        createCell(o.rating_timeliness ? String(o.rating_timeliness) : "", 1, 1, false, AlignmentType.CENTER),
                        createCell(o.rating_average ? o.rating_average.toFixed(2) : "", 1, 1, false, AlignmentType.CENTER),
                        createCell(o.remarks || "", 1, 1),
                    ]
                }))
            }
            while (count < emptyRowsCount) {
                count++
                rows.push(new TableRow({ children: cw.map(() => createCell('', 1, 1)) }))
            }
            return rows
        }

        const mainTable = new Table({
            width: { size: 9746, type: WidthType.DXA },
            columnWidths: cw,
            borders: tableBorders,
            rows: [
                new TableRow({
                    children: [
                        createCell("MFO", 1, 2, true, AlignmentType.CENTER),
                        createCell("SUCCESS INDICATOR (TARGET + MEASURE)", 1, 2, true, AlignmentType.CENTER),
                        createCell("Division/Individuals Accountable", 1, 2, true, AlignmentType.CENTER),
                        createCell("Actual Accomplishments", 1, 2, true, AlignmentType.CENTER),
                        createCell("Rating", 4, 1, true, AlignmentType.CENTER),
                        createCell("Remarks", 1, 2, true, AlignmentType.CENTER),
                    ]
                }),
                new TableRow({
                    children: [
                        createCell("Q", 1, 1, true, AlignmentType.CENTER),
                        createCell("E", 1, 1, true, AlignmentType.CENTER),
                        createCell("T", 1, 1, true, AlignmentType.CENTER),
                        createCell("A", 1, 1, true, AlignmentType.CENTER),
                    ]
                }),
                new TableRow({
                    children: [
                        createCell("CORE FUNCTION", 9, 1, true, AlignmentType.LEFT, "EEEEEE")
                    ]
                }),
                ...createMainContentRows(coreFunc, 3),
                new TableRow({
                    children: [
                        createCell("SUPPORT FUNCTION", 9, 1, true, AlignmentType.LEFT, "EEEEEE")
                    ]
                }),
                ...createMainContentRows(suppFunc, 3),
            ]
        })

        const coreAvgList = coreFunc.filter(o => o.rating_average).map(o => o.rating_average as number)
        const suppAvgList = suppFunc.filter(o => o.rating_average).map(o => o.rating_average as number)

        const coreAvg = coreAvgList.length ? (coreAvgList.reduce((a, b) => a + b, 0) / coreAvgList.length).toFixed(3) : ""
        const suppAvg = suppAvgList.length ? (suppAvgList.reduce((a, b) => a + b, 0) / suppAvgList.length).toFixed(3) : ""

        const summaryTable = new Table({
            width: { size: 9746, type: WidthType.DXA },
            borders: tableBorders,
            rows: [
                new TableRow({
                    children: [
                        createCell("CATEGORY", 1, 1, true, AlignmentType.CENTER),
                        createCell("MFO", 1, 1, true, AlignmentType.CENTER),
                        createCell("RATING", 1, 1, true, AlignmentType.CENTER),
                    ]
                }),
                new TableRow({
                    children: [
                        createCell("CORE FUNCTIONS", 1, 1, true),
                        createCell(coreFunc.length.toString(), 1, 1, false, AlignmentType.CENTER),
                        createCell(coreAvg, 1, 1, false, AlignmentType.CENTER),
                    ]
                }),
                new TableRow({
                    children: [
                        createCell("SUPPORT FUNCTIONS", 1, 1, true),
                        createCell(suppFunc.length.toString(), 1, 1, false, AlignmentType.CENTER),
                        createCell(suppAvg, 1, 1, false, AlignmentType.CENTER),
                    ]
                }),
                new TableRow({
                    children: [
                        createCell("FINAL AVERAGE RATING", 2, 1, true),
                        createCell(dpcr.final_average_rating ? dpcr.final_average_rating.toFixed(3) : "", 1, 1, true, AlignmentType.CENTER),
                    ]
                }),
                new TableRow({
                    children: [
                        createCell("ADJECTIVAL RATING", 2, 1, true),
                        createCell(dpcr.adjectival_rating || "", 1, 1, true, AlignmentType.CENTER),
                    ]
                }),
            ]
        })

        const noBorders = {
            top: { style: BorderStyle.NONE, size: 0, color: "auto" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
            left: { style: BorderStyle.NONE, size: 0, color: "auto" },
            right: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
        }

        const approvalTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
                new TableRow({
                    children: [
                        createCellMultiParagraphs([
                            createText("Approved by:"),
                            createText(""),
                            createText("Atty. Mhelygene D. Tesoro-Ramos, REA", true),
                            createText("Provincial Assessor"),
                            createText("Date: ________________"),
                        ], 1, 1, AlignmentType.LEFT),
                        createCellMultiParagraphs([
                            createText(""),
                            createText("Employee", true),
                            createText(""),
                            createText(""),
                            createText("Date: ________________"),
                            createText(""),
                            createText("RATING LEGEND:", true),
                            createText("5 - Outstanding"),
                            createText("4 - Very Satisfactory"),
                            createText("3 - Satisfactory"),
                            createText("2 - Unsatisfactory"),
                            createText("1 - Poor"),
                        ], 1, 1, AlignmentType.LEFT),
                    ]
                })
            ]
        })

        const sigCw = [2500, 700, 2500, 700, 2500, 700]
        const signatureTable = new Table({
            width: { size: 9600, type: WidthType.DXA },
            columnWidths: sigCw,
            borders: tableBorders,
            rows: [
                new TableRow({
                    children: [
                        createCellMultiParagraphs([
                            createText("Discussed with:"),
                            createText(""),
                            createText(""),
                            createText(dpcr.profiles?.full_name || "", true, 20, AlignmentType.CENTER),
                        ]),
                        createCellMultiParagraphs([createText("Date", true, 20, AlignmentType.CENTER)]),
                        createCellMultiParagraphs([
                            createText("Assessed by:"),
                            createText("I certify that I discussed my assessment of the performance with the employee."),
                            createText(""),
                            createText("Atty. Mhelygene D. Tesoro-Ramos, REA", true, 20, AlignmentType.CENTER),
                        ]),
                        createCellMultiParagraphs([createText("Date", true, 20, AlignmentType.CENTER)]),
                        createCellMultiParagraphs([
                            createText("Final Rating by:"),
                            createText(""),
                            createText(""),
                            createText("Atty. Mhelygene D. Tesoro-Ramos, REA", true, 20, AlignmentType.CENTER),
                        ]),
                        createCellMultiParagraphs([createText("Date", true, 20, AlignmentType.CENTER)]),
                    ]
                }),
                new TableRow({
                    children: [
                        createCell("Employee", 1, 1, false, AlignmentType.CENTER),
                        createCell("", 1, 1, false, AlignmentType.CENTER),
                        createCell("Head of Office", 1, 1, false, AlignmentType.CENTER),
                        createCell("", 1, 1, false, AlignmentType.CENTER),
                        createCell("Head of Office", 1, 1, false, AlignmentType.CENTER),
                        createCell("", 1, 1, false, AlignmentType.CENTER),
                    ]
                })
            ]
        })

        const p2cw = [2400, 2400, 1946, 1000, 1000, 1000]

        const createP2Rows = (opts: any[], emptyRowsCount: number) => {
            const rows: TableRow[] = []
            let count = 0
            for (const o of opts) {
                count++
                rows.push(new TableRow({
                    children: [
                        createCell(`${count}. ${o.major_final_output || ''}`, 1, 1),
                        createCell(`Target/Measure: ${o.success_indicators || ''}`, 1, 1),
                        createCell(o.actual_accomplishments || "", 1, 1),
                        createCell(o.rating_quantity ? String(o.rating_quantity) : "", 1, 1, false, AlignmentType.CENTER),
                        createCell(o.rating_timeliness ? String(o.rating_timeliness) : "", 1, 1, false, AlignmentType.CENTER),
                        createCell(o.rating_efficiency ? String(o.rating_efficiency) : "", 1, 1, false, AlignmentType.CENTER),
                    ]
                }))
            }
            while (count < emptyRowsCount) {
                count++
                rows.push(new TableRow({ children: p2cw.map(() => createCell('', 1, 1)) }))
            }
            return rows
        }

        const page2Table = new Table({
            width: { size: 9746, type: WidthType.DXA },
            columnWidths: p2cw,
            borders: tableBorders,
            rows: [
                new TableRow({
                    children: [
                        createCell("FUNCTIONS", 1, 2, true, AlignmentType.CENTER),
                        createCell(`${semesterText} SEMESTER`, 2, 1, true, AlignmentType.CENTER),
                        createCell("QUALITY", 1, 2, true, AlignmentType.CENTER),
                        createCell("TIMELINESS", 1, 2, true, AlignmentType.CENTER),
                        createCell("EFFICIENCY", 1, 2, true, AlignmentType.CENTER),
                    ]
                }),
                new TableRow({
                    children: [
                        createCell("TARGET", 1, 1, true, AlignmentType.CENTER),
                        createCell("OUTPUT", 1, 1, true, AlignmentType.CENTER),
                    ]
                }),
                new TableRow({
                    children: [
                        createCell("Core Function", 3, 1, true),
                        createCell("Q()+T()/2)=E()", 3, 1, true, AlignmentType.CENTER),
                    ]
                }),
                ...createP2Rows(coreFunc, 3),
                new TableRow({
                    children: [
                        createCell("Support Function", 3, 1, true),
                        createCell("Q()+T()/2)=E()", 3, 1, true, AlignmentType.CENTER),
                    ]
                }),
                ...createP2Rows(suppFunc, 3),
            ]
        })

        const doc = new Document({
            sections: [{
                properties: { page: { margin: { top: 720, bottom: 720, left: 1080, right: 1080 } } },
                children: [
                    createText("DEPARTMENT PERFORMANCE COMMITMENT AND REVIEW (DPCR)", true, 24, AlignmentType.CENTER),
                    new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),

                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        children: [
                            new TextRun({ text: "I, ", font: "Arial", size: 20 }),
                            new TextRun({ text: dpcr.profiles?.full_name || "", font: "Arial", size: 20, bold: true }),
                            new TextRun({ text: ", of the Provincial Assessor's Office, commit to deliver and agree to be rated on the attainment of the following targets in accordance with the indicated measures for the period ", font: "Arial", size: 20 }),
                            new TextRun({ text: `${periodText} ${year}`, font: "Arial", size: 20, bold: true }),
                            new TextRun({ text: ".", font: "Arial", size: 20 }),
                        ]
                    }),

                    new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),
                    approvalTable,
                    new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),

                    mainTable,
                    new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),

                    summaryTable,
                    new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),

                    signatureTable,
                    new Paragraph({ spacing: { before: 100, after: 100 }, children: [] }),
                    createText("Legend: Q - Quality  E - Efficiency  T - Timeliness  A - Average", false, 16, AlignmentType.LEFT),

                    new Paragraph({ children: [new PageBreak()] }),
                    createText("PROVINCIAL ASSESSOR'S OFFICE", true, 24, AlignmentType.CENTER),
                    createText(`OUTPUT FOR ${semesterText} SEMESTER CY ${year}`, true, 20, AlignmentType.CENTER),
                    new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),

                    page2Table,
                    new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),

                    createText(`Employee: ${dpcr.profiles?.full_name || "______________________"}`, true, 20, AlignmentType.LEFT),
                ]
            }]
        });

        const buffer = await Packer.toBuffer(doc);
        const filename = `DPCR_${dpcr.profiles?.full_name?.replace(/\s+/g, '_') || 'Department'}_${year}.docx`;

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
    }
}
