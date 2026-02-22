import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, HeightRule,
    PageOrientation, UnderlineType,
} from 'docx'
import { OPCRForm, OPCROutput } from '@/types/opcr'
import {
    LANDSCAPE_CONTENT_WIDTH, LANDSCAPE_HEIGHT, LANDSCAPE_WIDTH,
    MARGIN_HALF_INCH, BORDER_SINGLE, BORDER_NONE, CELL_BORDER_SINGLE, CELL_BORDER_NONE, CELL_MARGIN,
    PT9, PT10, PT11, PT13, shadeCell, emptyCell, textCell, adjectivalLabel, safeAvg,
} from './docx-helpers'

// ── Column widths (must sum to 14400) ────────────────────────────────────────
const COL = {
    mfo: 2800,
    indicators: 3200,
    budget: 1200,
    accountable: 2000,
    accomplishments: 2400,
    q: 450,
    e: 450,
    t: 450,
    a: 450,
    remarks: 1000,
}
// 2800+3200+1200+2000+2400+450+450+450+450+1000 = 14400 ✓

const HEADER_FILL = 'D9D9D9'
const CATEGORY_FILL = 'E8E8E8'

function formatPeriod(from?: string, to?: string): string {
    if (!from || !to) return '___________'
    const f = new Date(from).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const t = new Date(to).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    return `${f} to ${t}`
}

function underlineRun(text: string, size = PT11): TextRun {
    return new TextRun({ text, underline: { type: UnderlineType.SINGLE }, size, font: 'Times New Roman' })
}

// ── Main header rows ─────────────────────────────────────────────────────────
function buildTableHeaders(): TableRow[] {
    const headerCell = (text: string, width: number, colSpan?: number, rowSpan?: number) =>
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
            headerCell('MFO / PAP', COL.mfo, undefined, 2),
            headerCell('SUCCESS INDICATORS\n(Targets + Measures)', COL.indicators, undefined, 2),
            headerCell('ALLOTTED BUDGET (₱)', COL.budget, undefined, 2),
            headerCell('DIVISION / INDIVIDUALS ACCOUNTABLE', COL.accountable, undefined, 2),
            headerCell('ACTUAL ACCOMPLISHMENTS', COL.accomplishments, undefined, 2),
            headerCell('Rating', COL.q + COL.e + COL.t + COL.a, 4),
            headerCell('REMARKS', COL.remarks, undefined, 2),
        ],
    })

    const subCell = (text: string, width: number) => new TableCell({
        children: [new Paragraph({
            children: [new TextRun({ text, bold: true, size: PT9, font: 'Times New Roman' })],
            alignment: AlignmentType.CENTER,
        })],
        width: { size: width, type: WidthType.DXA },
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

// ── Category section row ─────────────────────────────────────────────────────
function categoryRow(label: string): TableRow {
    return new TableRow({
        height: { value: 400, rule: HeightRule.ATLEAST },
        children: [
            new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: label.toUpperCase(), bold: true, size: PT10, font: 'Times New Roman' })],
                    alignment: AlignmentType.LEFT,
                })],
                columnSpan: 10,
                shading: shadeCell(CATEGORY_FILL),
                borders: BORDER_SINGLE,
                margins: CELL_MARGIN,
            }),
        ],
    })
}

// ── Output data row ──────────────────────────────────────────────────────────
function outputRow(o: OPCROutput): TableRow {
    const ratingCell = (val: number | undefined, width: number) =>
        textCell(val != null ? String(val) : '', width, { alignment: AlignmentType.CENTER })

    const avgVal = o.average_rating != null ? Number(o.average_rating).toFixed(2) : ''

    return new TableRow({
        height: { value: 800, rule: HeightRule.ATLEAST },
        children: [
            textCell(o.output_title, COL.mfo, { vAlign: 'top' }),
            textCell(o.success_indicator, COL.indicators, { vAlign: 'top' }),
            textCell(o.allotted_budget != null ? `₱${Number(o.allotted_budget).toLocaleString()}` : '', COL.budget, { alignment: AlignmentType.CENTER }),
            textCell(o.accountable_division ?? '', COL.accountable),
            textCell(o.actual_accomplishments ?? '', COL.accomplishments),
            ratingCell(o.rating_q, COL.q),
            ratingCell(o.rating_e, COL.e),
            ratingCell(o.rating_t, COL.t),
            textCell(avgVal, COL.a, { alignment: AlignmentType.CENTER, bold: true }),
            textCell(o.remarks ?? '', COL.remarks),
        ],
    })
}

// ── Average rating summary table ─────────────────────────────────────────────
function buildSummaryTable(opcr: OPCRForm): Table {
    const outputs = opcr.outputs || []
    const strategic = outputs.filter(o => o.category === 'strategic_priority')
    const core = outputs.filter(o => o.category === 'core_function')
    const support = outputs.filter(o => o.category === 'support_function')

    const avgOf = (items: OPCROutput[]) =>
        safeAvg(items.map(o => o.average_rating ?? null))

    const stratAvg = avgOf(strategic)
    const coreAvg = avgOf(core)
    const supportAvg = avgOf(support)

    const allRated = [...strategic, ...core, ...support].filter(o => o.average_rating != null)
    const finalAvg = allRated.length > 0
        ? safeAvg(allRated.map(o => o.average_rating ?? null))
        : (opcr.office_final_rating ?? 0)
    const adjectival = opcr.adjectival_rating ?? adjectivalLabel(finalAvg)

    const W = { cat: 4000, mfo: 5500, rating: 4900 }

    const hCell = (text: string, width: number) => textCell(text, width, {
        bold: true, alignment: AlignmentType.CENTER, shading: HEADER_FILL,
    })

    const row = (category: string, mfoText: string, ratingText: string) => new TableRow({
        children: [
            textCell(category, W.cat, { bold: true }),
            textCell(mfoText, W.mfo, { alignment: AlignmentType.CENTER }),
            textCell(ratingText, W.rating, { alignment: AlignmentType.CENTER, bold: true }),
        ],
    })

    return new Table({
        width: { size: LANDSCAPE_CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [W.cat, W.mfo, W.rating],
        borders: BORDER_SINGLE,
        rows: [
            new TableRow({
                children: [hCell('CATEGORY', W.cat), hCell('MFO', W.mfo), hCell('RATING', W.rating)],
            }),
            row('Strategic Priority', 'Targets achievement', stratAvg > 0 ? stratAvg.toFixed(2) : '—'),
            row('Core Functions', 'Targets achievement', coreAvg > 0 ? coreAvg.toFixed(2) : '—'),
            row('Support Functions', 'Targets achievement', supportAvg > 0 ? supportAvg.toFixed(2) : '—'),
            row('FINAL AVERAGE RATING', '', finalAvg > 0 ? finalAvg.toFixed(2) : '—'),
            row('ADJECTIVAL RATING', '', adjectival ?? '—'),
        ],
    })
}

// ── Signatory footer table ────────────────────────────────────────────────────
function buildFooterTable(opcr: OPCRForm): Table {
    const employee = opcr.prepared_by_profile?.full_name ?? 'STAFF'
    const supervisor = opcr.reviewed_by_profile?.full_name ?? '___________________'
    const head = opcr.prepared_by_profile?.full_name ?? 'Provincial Assessor'

    const W = 14400 / 3  // 4800 each

    const hCell = (text: string) => textCell(text, W, { bold: true, alignment: AlignmentType.CENTER })
    const nameCell = (text: string) => new TableCell({
        children: [new Paragraph({
            children: [new TextRun({ text: text.toUpperCase(), bold: true, underline: { type: UnderlineType.SINGLE }, size: PT9, font: 'Times New Roman' })],
            alignment: AlignmentType.CENTER,
        })],
        width: { size: W, type: WidthType.DXA },
        verticalAlign: 'bottom',
        borders: BORDER_SINGLE,
        margins: CELL_MARGIN,
    })
    const lblCell = (text: string) => textCell(text, W, { alignment: AlignmentType.CENTER })
    const dateCell = () => textCell('Date: ___________', W, { alignment: AlignmentType.CENTER, size: PT9 })

    return new Table({
        width: { size: LANDSCAPE_CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [W, W, W],
        borders: BORDER_SINGLE,
        rows: [
            new TableRow({ children: [hCell('Discussed with:'), hCell('Assessed by:'), hCell('Final Rating by:')] }),
            new TableRow({
                height: { value: 1200, rule: HeightRule.ATLEAST },
                children: [
                    emptyCell(W),
                    new TableCell({
                        children: [new Paragraph({
                            children: [new TextRun({ text: 'I certify that I discussed my assessment of the performance with the employee.', italics: true, size: PT10, font: 'Times New Roman' })],
                            alignment: AlignmentType.CENTER,
                        })],
                        width: { size: W, type: WidthType.DXA },
                        verticalAlign: 'center',
                        borders: BORDER_SINGLE,
                        margins: CELL_MARGIN,
                    }),
                    emptyCell(W),
                ],
            }),
            new TableRow({ children: [nameCell(employee), nameCell(supervisor), nameCell(head)] }),
            new TableRow({ children: [lblCell('Staff'), lblCell('Immediate Supervisor'), lblCell('Provincial Assessor')] }),
            new TableRow({ children: [dateCell(), dateCell(), dateCell()] }),
            new TableRow({
                children: [new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({
                            text: 'Legend:    Q – Quality    E – Efficiency    T – Timeliness    A – Average',
                            italics: true, size: PT10, font: 'Times New Roman',
                        })],
                        alignment: AlignmentType.CENTER,
                    })],
                    columnSpan: 3,
                    borders: CELL_BORDER_NONE,
                    margins: CELL_MARGIN,
                })],
            }),
        ],
    })
}

// ── Main export function ─────────────────────────────────────────────────────
export async function generateOPCRDocument(opcr: OPCRForm): Promise<Buffer> {
    const outputs = opcr.outputs || []
    const strategic = outputs.filter(o => o.category === 'strategic_priority')
    const core = outputs.filter(o => o.category === 'core_function')
    const support = outputs.filter(o => o.category === 'support_function')

    const headName = opcr.prepared_by_profile?.full_name ?? 'Provincial Assessor'
    const periodFrom = opcr.rating_period?.period_from
    const periodTo = opcr.rating_period?.period_to
    const year = periodTo ? new Date(periodTo).getFullYear() : new Date().getFullYear()

    // ── Document build ────────────────────────────────────────────────────────
    const mainTableRows: TableRow[] = [
        ...buildTableHeaders(),
        ...(strategic.length > 0 ? [categoryRow('Strategic Priority'), ...strategic.map(outputRow)] : []),
        ...(core.length > 0 ? [categoryRow('Core Functions'), ...core.map(outputRow)] : []),
        ...(support.length > 0 ? [categoryRow('Support Functions'), ...support.map(outputRow)] : []),
    ]

    const mainTable = new Table({
        width: { size: LANDSCAPE_CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [COL.mfo, COL.indicators, COL.budget, COL.accountable, COL.accomplishments, COL.q, COL.e, COL.t, COL.a, COL.remarks],
        borders: BORDER_SINGLE,
        rows: mainTableRows,
    })

    const doc = new Document({
        styles: {
            default: {
                document: { run: { font: 'Times New Roman', size: PT11 } },
            },
        },
        sections: [{
            properties: {
                page: {
                    size: { width: LANDSCAPE_WIDTH, height: LANDSCAPE_HEIGHT, orientation: PageOrientation.LANDSCAPE },
                    margin: { top: MARGIN_HALF_INCH, right: MARGIN_HALF_INCH, bottom: MARGIN_HALF_INCH, left: MARGIN_HALF_INCH },
                },
            },
            children: [
                // Title
                new Paragraph({
                    children: [new TextRun({ text: 'OFFICE PERFORMANCE COMMITMENT AND REVIEW (OPCR)', bold: true, size: PT13, font: 'Times New Roman' })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 120 },
                }),
                // Commitment paragraph
                new Paragraph({
                    children: [
                        new TextRun({ text: 'I, ', size: PT11, font: 'Times New Roman' }),
                        underlineRun(headName.toUpperCase()),
                        new TextRun({ text: ', Provincial Assessor of the ', size: PT11, font: 'Times New Roman' }),
                        underlineRun("Provincial Assessor's Office"),
                        new TextRun({ text: ', commit to deliver and agree to be rated on the attainment of the following targets in accordance with the indicated measures for the period ', size: PT11, font: 'Times New Roman' }),
                        underlineRun(periodFrom ? new Date(periodFrom).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '___________'),
                        new TextRun({ text: ' to ', size: PT11, font: 'Times New Roman' }),
                        underlineRun(periodTo ? new Date(periodTo).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '___________'),
                        new TextRun({ text: `, ${year}.`, size: PT11, font: 'Times New Roman' }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 180 },
                }),
                // Signatory header (2-col no-border table)
                new Table({
                    width: { size: LANDSCAPE_CONTENT_WIDTH, type: WidthType.DXA },
                    columnWidths: [5000, 9400],
                    borders: BORDER_NONE,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: 'Approved by:', size: PT11, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [] }),
                                        new Paragraph({ children: [new TextRun({ text: headName.toUpperCase(), bold: true, size: PT11, underline: { type: UnderlineType.SINGLE }, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [new TextRun({ text: 'Provincial Assessor', size: PT11, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [] }),
                                        new Paragraph({ children: [new TextRun({ text: 'Date: ___________', size: PT10, font: 'Times New Roman' })] }),
                                    ],
                                    width: { size: 5000, type: WidthType.DXA },
                                    borders: CELL_BORDER_NONE,
                                    margins: CELL_MARGIN,
                                }),
                                new TableCell({
                                    children: [
                                        new Paragraph({ children: [new TextRun({ text: headName.toUpperCase(), bold: true, size: PT11, underline: { type: UnderlineType.SINGLE }, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [new TextRun({ text: 'Provincial Assessor / Staff', size: PT11, font: 'Times New Roman' })] }),
                                        new Paragraph({ children: [new TextRun({ text: 'Date: ' + new Date().toLocaleDateString('en-US'), size: PT10, font: 'Times New Roman' })] }),
                                    ],
                                    width: { size: 9400, type: WidthType.DXA },
                                    borders: CELL_BORDER_NONE,
                                    margins: CELL_MARGIN,
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ children: [] }),
                mainTable,
                new Paragraph({ children: [], spacing: { before: 240 } }),
                buildSummaryTable(opcr),
                new Paragraph({ children: [], spacing: { before: 240 } }),
                buildFooterTable(opcr),
            ],
        }],
    })

    return Buffer.from(await Packer.toBuffer(doc))
}
