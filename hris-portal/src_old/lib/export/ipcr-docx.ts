import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, HeightRule,
    UnderlineType,
} from 'docx'
import { IPCRForm } from '@/types/ipcr'
import {
    PORTRAIT_CONTENT_WIDTH, LETTER_WIDTH, LETTER_HEIGHT,
    MARGIN_HALF_INCH, BORDER_SINGLE, BORDER_NONE, CELL_BORDER_SINGLE, CELL_BORDER_NONE, CELL_MARGIN,
    PT9, PT10, PT11, PT13, shadeCell, emptyCell, textCell, adjectivalLabel,
} from './docx-helpers'

// ── IPCR portrait column widths (must sum to 10800) ──────────────────────────
const COL = {
    output: 2800,
    indicator: 2800,
    accomplishments: 2200,
    q: 400,
    e: 400,
    t: 400,
    a: 400,
    remarks: 1400,
}
// 2800+2800+2200+400+400+400+400+1400 = 10800 ✓

const HEADER_FILL = 'D9D9D9'

function underlineRun(text: string, size = PT11): TextRun {
    return new TextRun({ text, underline: { type: UnderlineType.SINGLE }, size, font: 'Times New Roman' })
}

// ── Table header rows ────────────────────────────────────────────────────────
function buildTableHeaders(): TableRow[] {
    const hCell = (text: string, width: number, colSpan?: number, rowSpan?: number) =>
        new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text, bold: true, size: PT9, font: 'Times New Roman' })],
                alignment: AlignmentType.CENTER,
            })],
            width: { size: width, type: WidthType.DXA },
            shading: shadeCell(HEADER_FILL),
            borders: CELL_BORDER_SINGLE,
            margins: CELL_MARGIN,
            verticalAlign: 'center',
            ...(colSpan && { columnSpan: colSpan }),
            ...(rowSpan && { rowSpan }),
        })

    const row1 = new TableRow({
        tableHeader: true,
        children: [
            hCell('OUTPUT', COL.output, undefined, 2),
            hCell('SUCCESS INDICATOR\n(Target + Measure)', COL.indicator, undefined, 2),
            hCell('ACTUAL ACCOMPLISHMENTS', COL.accomplishments, undefined, 2),
            hCell('Rating', COL.q + COL.e + COL.t + COL.a, 4),
            hCell('REMARKS', COL.remarks, undefined, 2),
        ],
    })

    const subCell = (text: string, w: number) => new TableCell({
        children: [new Paragraph({
            children: [new TextRun({ text, bold: true, size: PT9, font: 'Times New Roman' })],
            alignment: AlignmentType.CENTER,
        })],
        width: { size: w, type: WidthType.DXA },
        shading: shadeCell(HEADER_FILL),
        borders: CELL_BORDER_SINGLE,
        margins: CELL_MARGIN,
        verticalAlign: 'center',
    })

    const row2 = new TableRow({
        tableHeader: true,
        children: [subCell('Q', COL.q), subCell('E', COL.e), subCell('T', COL.t), subCell('A', COL.a)],
    })

    return [row1, row2]
}

// ── Category header row ──────────────────────────────────────────────────────
function categoryRow(label: string): TableRow {
    return new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: label, bold: true, size: PT9, font: 'Times New Roman' })],
                })],
                columnSpan: 8,
                shading: shadeCell('E8E8E8'),
                borders: CELL_BORDER_SINGLE,
                margins: CELL_MARGIN,
            }),
        ],
    })
}

// ── Output data row ──────────────────────────────────────────────────────────
function outputRow(o: any): TableRow {
    const avg = o.average_rating != null ? Number(o.average_rating).toFixed(2) : ''
    const rCell = (val: number | undefined, width: number) =>
        textCell(val != null ? String(val) : '', width, { alignment: AlignmentType.CENTER })

    return new TableRow({
        height: { value: 700, rule: HeightRule.ATLEAST },
        children: [
            textCell(o.output_title ?? o.mfo ?? '', COL.output, { vAlign: 'top' }),
            textCell(o.success_indicator ?? o.indicators ?? '', COL.indicator, { vAlign: 'top' }),
            textCell(o.actual_accomplishments ?? '', COL.accomplishments),
            rCell(o.rating_q ?? o.q, COL.q),
            rCell(o.rating_e ?? o.e, COL.e),
            rCell(o.rating_t ?? o.t, COL.t),
            textCell(avg, COL.a, { alignment: AlignmentType.CENTER, bold: true }),
            textCell(o.remarks ?? '', COL.remarks),
        ],
    })
}

// ── Signatory footer ─────────────────────────────────────────────────────────
function buildFooterTable(ipcr: IPCRForm): Table {
    const employee = (ipcr as any).employee?.full_name ?? 'EMPLOYEE'
    const supervisor = (ipcr as any).reviewed_by_profile?.full_name ?? 'IMMEDIATE SUPERVISOR'
    const head = (ipcr as any).approved_by_profile?.full_name ?? 'PROVINCIAL ASSESSOR'

    const W = PORTRAIT_CONTENT_WIDTH / 3  // 3600 each

    const hCell = (text: string) => textCell(text, W, { bold: true, alignment: AlignmentType.CENTER })
    const nameCell = (text: string) => new TableCell({
        children: [new Paragraph({
            children: [new TextRun({ text: text.toUpperCase(), bold: true, underline: { type: UnderlineType.SINGLE }, size: PT9, font: 'Times New Roman' })],
            alignment: AlignmentType.CENTER,
        })],
        width: { size: W, type: WidthType.DXA },
        verticalAlign: 'bottom',
        borders: CELL_BORDER_SINGLE,
        margins: CELL_MARGIN,
    })

    return new Table({
        width: { size: PORTRAIT_CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [W, W, W],
        borders: BORDER_SINGLE,
        rows: [
            new TableRow({ children: [hCell('Discussed with:'), hCell('Assessed by:'), hCell('Final Rating by:')] }),
            new TableRow({
                height: { value: 900, rule: HeightRule.ATLEAST },
                children: [emptyCell(W), emptyCell(W), emptyCell(W)],
            }),
            new TableRow({ children: [nameCell(employee), nameCell(supervisor), nameCell(head)] }),
            new TableRow({ children: [textCell('Employee', W, { alignment: AlignmentType.CENTER }), textCell('Immediate Supervisor', W, { alignment: AlignmentType.CENTER }), textCell('Provincial Assessor', W, { alignment: AlignmentType.CENTER })] }),
            new TableRow({ children: [textCell('Date: ___________', W, { alignment: AlignmentType.CENTER }), textCell('Date: ___________', W, { alignment: AlignmentType.CENTER }), textCell('Date: ___________', W, { alignment: AlignmentType.CENTER })] }),
            // legend
            new TableRow({
                children: [new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: 'Legend:    Q – Quality    E – Efficiency    T – Timeliness    A – Average', italics: true, size: PT10, font: 'Times New Roman' })],
                        alignment: AlignmentType.CENTER,
                    })],
                    columnSpan: 3,
                    borders: CELL_BORDER_SINGLE,
                    margins: CELL_MARGIN,
                })],
            }),
        ],
    })
}

// ── Main export function ─────────────────────────────────────────────────────
export async function generateIPCRDocument(ipcr: IPCRForm): Promise<Buffer> {
    const outputs = (ipcr as any).outputs || []
    const strategic = outputs.filter((o: any) => ['strategic', 'strategic_priority'].includes(o.category))
    const core = outputs.filter((o: any) => ['core', 'core_function'].includes(o.category))
    const support = outputs.filter((o: any) => ['support', 'support_function'].includes(o.category))

    const employeeName = (ipcr as any).employee?.full_name ?? 'Employee'
    const divisionName = (ipcr as any).division?.name ?? "Division"
    const periodName = (ipcr as any).rating_period?.name ?? '___________'
    const supervisorName = (ipcr as any).reviewed_by_profile?.full_name ?? '___________________'
    const headName = (ipcr as any).approved_by_profile?.full_name ?? '___________________'

    const finalAvg = ipcr.final_average_rating ?? 0
    const adjectival = ipcr.adjectival_rating ?? adjectivalLabel(finalAvg)

    const mainRows: TableRow[] = [
        ...buildTableHeaders(),
        ...(strategic.length > 0 ? [categoryRow('Strategic Priority No.: (Per IPCR)'), ...strategic.map(outputRow)] : []),
        ...(core.length > 0 ? [categoryRow('Core Function:'), ...core.map(outputRow)] : []),
        ...(support.length > 0 ? [categoryRow('Support Function:'), ...support.map(outputRow)] : []),
        // Final Average Rating row
        new TableRow({
            children: [
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: 'FINAL AVERAGE RATING:', bold: true, size: PT9, font: 'Times New Roman' })],
                        alignment: AlignmentType.RIGHT,
                    })],
                    columnSpan: 3,
                    shading: shadeCell('F1F5F9'),
                    borders: BORDER_SINGLE,
                    margins: CELL_MARGIN,
                }),
                emptyCell(COL.q),
                emptyCell(COL.e),
                emptyCell(COL.t),
                textCell(finalAvg > 0 ? finalAvg.toFixed(2) : '—', COL.a, { alignment: AlignmentType.CENTER, bold: true }),
                textCell(adjectival ?? '—', COL.remarks, { bold: true }),
            ],
        }),
    ]

    const doc = new Document({
        styles: { default: { document: { run: { font: 'Times New Roman', size: PT11 } } } },
        sections: [{
            properties: {
                page: {
                    size: { width: LETTER_WIDTH, height: LETTER_HEIGHT },
                    margin: { top: MARGIN_HALF_INCH, right: MARGIN_HALF_INCH, bottom: MARGIN_HALF_INCH, left: MARGIN_HALF_INCH },
                },
            },
            children: [
                new Paragraph({
                    children: [new TextRun({ text: 'INDIVIDUAL PERFORMANCE COMMITMENT AND REVIEW (IPCR)', bold: true, size: PT13, font: 'Times New Roman' })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 120 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: 'I, ', size: PT11, font: 'Times New Roman' }),
                        underlineRun(employeeName.toUpperCase()),
                        new TextRun({ text: `, of the `, size: PT11, font: 'Times New Roman' }),
                        underlineRun(divisionName),
                        new TextRun({ text: ` Division of the Provincial Assessor's Office, commit to deliver and agree to be rated on the attainment of the following targets in accordance with the indicated measures for the period `, size: PT11, font: 'Times New Roman' }),
                        underlineRun(periodName),
                        new TextRun({ text: '.', size: PT11, font: 'Times New Roman' }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 180 },
                }),
                // Review/Approval row
                new Table({
                    width: { size: PORTRAIT_CONTENT_WIDTH, type: WidthType.DXA },
                    columnWidths: [5400, 5400],
                    borders: BORDER_NONE,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: 'Reviewed by:', size: PT11, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [new TextRun({ text: supervisorName.toUpperCase(), bold: true, underline: { type: UnderlineType.SINGLE }, size: PT11, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [new TextRun({ text: 'Immediate Supervisor', size: PT11, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [new TextRun({ text: 'Date: ___________', size: PT10, font: 'Times New Roman' })] }),
                                    ],
                                    width: { size: 5400, type: WidthType.DXA },
                                    borders: CELL_BORDER_NONE,
                                    margins: CELL_MARGIN,
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: 'Approved by:', size: PT11, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [new TextRun({ text: headName.toUpperCase(), bold: true, underline: { type: UnderlineType.SINGLE }, size: PT11, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [new TextRun({ text: 'Provincial Assessor', size: PT11, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [new TextRun({ text: 'Date: ___________', size: PT10, font: 'Times New Roman' })] }),
                                    ],
                                    width: { size: 5400, type: WidthType.DXA },
                                    borders: CELL_BORDER_NONE,
                                    margins: CELL_MARGIN,
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: employeeName.toUpperCase(), bold: true, underline: { type: UnderlineType.SINGLE }, size: PT11, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [new TextRun({ text: 'Employee / Ratee', size: PT11, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [new TextRun({ text: 'Date: ' + new Date(ipcr.created_at).toLocaleDateString('en-US'), size: PT10, font: 'Times New Roman' })] }),
                                    ],
                                    width: { size: 5400, type: WidthType.DXA },
                                    borders: CELL_BORDER_NONE,
                                    margins: CELL_MARGIN,
                                }),
                                emptyCell(5400, BORDER_NONE),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ children: [] }),
                new Table({
                    width: { size: PORTRAIT_CONTENT_WIDTH, type: WidthType.DXA },
                    columnWidths: [COL.output, COL.indicator, COL.accomplishments, COL.q, COL.e, COL.t, COL.a, COL.remarks],
                    borders: BORDER_SINGLE,
                    rows: mainRows,
                }),
                new Paragraph({ children: [], spacing: { before: 240 } }),
                // Comments box
                new Table({
                    width: { size: PORTRAIT_CONTENT_WIDTH, type: WidthType.DXA },
                    columnWidths: [PORTRAIT_CONTENT_WIDTH],
                    borders: BORDER_SINGLE,
                    rows: [
                        new TableRow({
                            children: [new TableCell({
                                children: [new Paragraph({
                                    children: [new TextRun({ text: 'Comments and Recommendations for Development Purposes:', bold: true, size: PT10, font: 'Times New Roman' })],
                                })],
                                borders: CELL_BORDER_SINGLE,
                                margins: CELL_MARGIN,
                            })],
                        }),
                        new TableRow({
                            height: { value: 1200, rule: HeightRule.ATLEAST },
                            children: [emptyCell(PORTRAIT_CONTENT_WIDTH)],
                        }),
                    ],
                }),
                new Paragraph({ children: [], spacing: { before: 240 } }),
                buildFooterTable(ipcr),
            ],
        }],
    })

    return Buffer.from(await Packer.toBuffer(doc))
}
