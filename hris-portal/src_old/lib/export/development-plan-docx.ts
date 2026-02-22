import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, HeightRule,
    UnderlineType,
} from 'docx'
import { DevelopmentPlan } from '@/types/development-plan'
import {
    PORTRAIT_CONTENT_WIDTH, LETTER_WIDTH, LETTER_HEIGHT,
    MARGIN_HALF_INCH, BORDER_SINGLE, BORDER_NONE, CELL_BORDER_SINGLE, CELL_BORDER_NONE, CELL_MARGIN,
    PT9, PT10, PT11, PT12, PT13, shadeCell, emptyCell, textCell,
} from './docx-helpers'

function underlineRun(text: string, size = PT11): TextRun {
    return new TextRun({ text, underline: { type: UnderlineType.SINGLE }, size, font: 'Times New Roman' })
}

function formatDate(d?: string) {
    if (!d) return '___________'
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export async function generateDevelopmentPlanDocument(plan: DevelopmentPlan): Promise<Buffer> {
    const employeeName = plan.employee?.full_name ?? 'Employee'
    const divisionName = plan.division?.name ?? 'Division'
    const creatorName = plan.created_by_profile?.full_name ?? 'Supervisor'
    const creatorRole = plan.created_by_profile?.role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'Supervisor'
    const periodName = plan.rating_period?.name ?? '___________'
    const tasks = plan.tasks ?? []

    // ── 1. Title ─────────────────────────────────────────────────────────────
    const title = new Paragraph({
        children: [new TextRun({ text: 'PROFESSIONAL DEVELOPMENT PLAN', bold: true, size: PT13, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
    })
    const annex = new Paragraph({
        children: [new TextRun({ text: '(Annex K — CSC SPMS Guidelines)', italics: true, size: PT10, font: 'Times New Roman' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
    })

    // ── 2. Header info table ─────────────────────────────────────────────────
    const infoTable = new Table({
        width: { size: PORTRAIT_CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [5400, 5400],
        borders: BORDER_NONE,
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: `Date: ${formatDate(plan.plan_date)}`, size: PT11, font: 'Times New Roman' })] })],
                        width: { size: 5400, type: WidthType.DXA },
                        borders: BORDER_NONE,
                        margins: CELL_MARGIN,
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({ children: [new TextRun({ text: `Employee: ${employeeName}`, size: PT11, font: 'Times New Roman' })] }),
                            new Paragraph({ children: [new TextRun({ text: `Division: ${divisionName}`, size: PT11, font: 'Times New Roman' })] }),
                            new Paragraph({ children: [new TextRun({ text: `Prepared by: ${creatorName}`, size: PT11, font: 'Times New Roman' })] }),
                        ],
                        width: { size: 5400, type: WidthType.DXA },
                        borders: CELL_BORDER_NONE,
                        margins: CELL_MARGIN,
                    }),
                ],
            }),
        ],
    })

    // ── 3. IPCR link info ────────────────────────────────────────────────────
    const ipcrRating = plan.ipcr_form?.final_average_rating
    const ipcrAdjectival = plan.ipcr_form?.adjectival_rating
    const ipcrTable = new Table({
        width: { size: PORTRAIT_CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [3600, 7200],
        borders: BORDER_SINGLE,
        rows: [
            new TableRow({
                children: [
                    textCell('Rating Period:', 3600, { bold: true, shading: 'F1F5F9' }),
                    textCell(periodName, 7200),
                ],
            }),
            new TableRow({
                children: [
                    textCell('IPCR Rating:', 3600, { bold: true, shading: 'F1F5F9' }),
                    textCell(ipcrRating != null ? `${ipcrRating} — ${ipcrAdjectival ?? ''}` : 'Not yet rated', 7200),
                ],
            }),
            new TableRow({
                children: [
                    textCell('IPCR Status:', 3600, { bold: true, shading: 'F1F5F9' }),
                    textCell(plan.ipcr_form?.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? '—', 7200),
                ],
            }),
        ],
    })

    // ── 4. Goals table ───────────────────────────────────────────────────────
    const goalsTable = new Table({
        width: { size: PORTRAIT_CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [1800, 9000],
        borders: BORDER_SINGLE,
        rows: [
            new TableRow({
                height: { value: 600, rule: HeightRule.ATLEAST },
                children: [
                    textCell('Aim', 1800, { bold: true, shading: 'F1F5F9', vAlign: 'center' }),
                    textCell(plan.aim ?? '', 9000),
                ],
            }),
            new TableRow({
                height: { value: 600, rule: HeightRule.ATLEAST },
                children: [
                    textCell('Objective', 1800, { bold: true, shading: 'F1F5F9', vAlign: 'center' }),
                    textCell(plan.objective ?? '', 9000),
                ],
            }),
        ],
    })

    // ── 5. Dates table ───────────────────────────────────────────────────────
    const datesTable = new Table({
        width: { size: PORTRAIT_CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [3600, 3600, 3600],
        borders: BORDER_SINGLE,
        rows: [
            new TableRow({
                children: [
                    textCell('Target Date', 3600, { bold: true, shading: 'D9D9D9', alignment: AlignmentType.CENTER }),
                    textCell('Review Date', 3600, { bold: true, shading: 'D9D9D9', alignment: AlignmentType.CENTER }),
                    textCell('Achieved Date', 3600, { bold: true, shading: 'D9D9D9', alignment: AlignmentType.CENTER }),
                ],
            }),
            new TableRow({
                children: [
                    textCell(formatDate(plan.target_date), 3600, { alignment: AlignmentType.CENTER }),
                    textCell(formatDate(plan.review_date), 3600, { alignment: AlignmentType.CENTER }),
                    textCell(formatDate(plan.achieved_date), 3600, { alignment: AlignmentType.CENTER }),
                ],
            }),
        ],
    })

    // ── 6. Tasks table ───────────────────────────────────────────────────────
    const taskRows: TableRow[] = [
        new TableRow({
            tableHeader: true,
            children: [
                textCell('Task', 5400, { bold: true, shading: 'D9D9D9', alignment: AlignmentType.CENTER }),
                textCell('Next Step', 2700, { bold: true, shading: 'D9D9D9', alignment: AlignmentType.CENTER }),
                textCell('Outcome', 2700, { bold: true, shading: 'D9D9D9', alignment: AlignmentType.CENTER }),
            ],
        }),
        ...tasks.map((task, idx) => new TableRow({
            height: { value: 800, rule: HeightRule.ATLEAST },
            children: [
                textCell(`${idx + 1}. ${task.task_description}`, 5400),
                textCell(task.next_step ?? '', 2700),
                textCell(task.outcome ?? '', 2700),
            ],
        })),
        ...(tasks.length === 0 ? [
            new TableRow({
                height: { value: 800, rule: HeightRule.ATLEAST },
                children: [emptyCell(5400), emptyCell(2700), emptyCell(2700)],
            }),
        ] : []),
    ]
    const tasksTable = new Table({
        width: { size: PORTRAIT_CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [5400, 2700, 2700],
        borders: BORDER_SINGLE,
        rows: taskRows,
    })

    // ── 7. Comments ──────────────────────────────────────────────────────────
    const commentsSection = plan.comments ? [
        new Paragraph({ children: [new TextRun({ text: 'Comments:', bold: true, size: PT11, font: 'Times New Roman' })], spacing: { before: 200 } }),
        new Table({
            width: { size: PORTRAIT_CONTENT_WIDTH, type: WidthType.DXA },
            columnWidths: [PORTRAIT_CONTENT_WIDTH],
            borders: BORDER_SINGLE,
            rows: [
                new TableRow({
                    height: { value: 600, rule: HeightRule.ATLEAST },
                    children: [textCell(plan.comments, PORTRAIT_CONTENT_WIDTH)],
                }),
            ],
        }),
    ] : []

    // ── 8. Signatory ─────────────────────────────────────────────────────────
    const sigTable = new Table({
        width: { size: PORTRAIT_CONTENT_WIDTH, type: WidthType.DXA },
        columnWidths: [5400, 5400],
        borders: BORDER_NONE,
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        children: [
                            new Paragraph({ children: [new TextRun({ text: 'Prepared by:', size: PT11, font: 'Times New Roman' })] }),
                            new Paragraph({ children: [underlineRun(creatorName.toUpperCase())] }),
                            new Paragraph({ children: [new TextRun({ text: creatorRole, size: PT11, font: 'Times New Roman' })] }),
                            new Paragraph({ children: [new TextRun({ text: `Date: ${formatDate(plan.plan_date)}`, size: PT10, font: 'Times New Roman' })] }),
                        ],
                        width: { size: 5400, type: WidthType.DXA },
                        borders: CELL_BORDER_NONE,
                        margins: CELL_MARGIN,
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({ children: [new TextRun({ text: 'Noted by:', size: PT11, font: 'Times New Roman' })] }),
                            new Paragraph({ children: [underlineRun(('PROVINCIAL ASSESSOR'))] }),
                            new Paragraph({ children: [new TextRun({ text: 'Provincial Assessor', size: PT11, font: 'Times New Roman' })] }),
                            new Paragraph({ children: [new TextRun({ text: 'Date: ___________', size: PT10, font: 'Times New Roman' })] }),
                        ],
                        width: { size: 5400, type: WidthType.DXA },
                        borders: CELL_BORDER_NONE,
                        margins: CELL_MARGIN,
                    }),
                ],
            }),
        ],
    })

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
                title, annex,
                infoTable,
                new Paragraph({ children: [], spacing: { before: 180 } }),
                ipcrTable,
                new Paragraph({ children: [], spacing: { before: 180 } }),
                goalsTable,
                new Paragraph({ children: [], spacing: { before: 180 } }),
                datesTable,
                new Paragraph({ children: [], spacing: { before: 180 } }),
                tasksTable,
                ...commentsSection,
                new Paragraph({ children: [], spacing: { before: 360 } }),
                sigTable,
            ],
        }],
    })

    return Buffer.from(await Packer.toBuffer(doc))
}
