import {
    BorderStyle,
    ShadingType,
    ITableBordersOptions,
    ITableCellBorders,
    TableCell,
    Paragraph,
    TextRun,
    WidthType,
    AlignmentType,
    TableVerticalAlign,
} from 'docx'

// ── Page dimensions (DXA = 1/20 pt, 1440 DXA = 1 inch) ─────────────────────
export const LETTER_WIDTH = 12240  // 8.5 inches
export const LETTER_HEIGHT = 15840 // 11 inches
export const LANDSCAPE_WIDTH = 15840
export const LANDSCAPE_HEIGHT = 12240

export const MARGIN_HALF_INCH = 720
export const LANDSCAPE_CONTENT_WIDTH = LANDSCAPE_WIDTH - MARGIN_HALF_INCH * 2  // 14400
export const PORTRAIT_CONTENT_WIDTH = LETTER_WIDTH - MARGIN_HALF_INCH * 2      // 10800

// ── Standard table-level borders ────────────────────────────────────────────
export const BORDER_SINGLE: ITableBordersOptions = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
}

export const BORDER_NONE: ITableBordersOptions = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

// ── Standard cell-level borders ─────────────────────────────────────────────
export const CELL_BORDER_SINGLE: ITableCellBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
}

export const CELL_BORDER_NONE: ITableCellBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

// ── Standard cell margin (ITableCellMarginOptions not publicly exported, so cast as any) ──
export const CELL_MARGIN = {
    top: 60,
    bottom: 60,
    left: 80,
    right: 80,
} as any

// ── Shading helpers ─────────────────────────────────────────────────────────
export function shadeCell(fill: string) {
    return { type: ShadingType.CLEAR, color: 'auto', fill }
}

// ── Font sizes (half-points) ─────────────────────────────────────────────────
export const PT9 = 18   // 9pt
export const PT10 = 20  // 10pt
export const PT11 = 22  // 11pt
export const PT12 = 24  // 12pt
export const PT13 = 26  // 13pt

// ── Adjectival rating helper ─────────────────────────────────────────────────
export function adjectivalLabel(rating: number): string {
    if (rating >= 4.5) return 'Outstanding'
    if (rating >= 3.5) return 'Very Satisfactory'
    if (rating >= 2.5) return 'Satisfactory'
    if (rating >= 1.5) return 'Unsatisfactory'
    return 'Poor'
}

// ── Safe average from array of nullable numbers ──────────────────────────────
export function safeAvg(values: (number | undefined | null)[]): number {
    const valid = values.filter((v): v is number => v != null && !isNaN(v))
    if (valid.length === 0) return 0
    return valid.reduce((a, b) => a + b, 0) / valid.length
}

// ── Helper: empty cell ────────────────────────────────────────────────────────
export function emptyCell(width: number, borders: ITableCellBorders = CELL_BORDER_SINGLE): TableCell {
    return new TableCell({
        children: [new Paragraph({ children: [] })],
        width: { size: width, type: WidthType.DXA },
        borders,
        margins: CELL_MARGIN,
    })
}

// ── Helper: simple text cell ──────────────────────────────────────────────────
export function textCell(
    text: string,
    width: number,
    opts: {
        bold?: boolean
        size?: number
        alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]
        vAlign?: TableVerticalAlign
        shading?: string
        borders?: ITableCellBorders
        italic?: boolean
        colSpan?: number
    } = {}
): TableCell {
    const {
        bold = false,
        size = PT9,
        alignment = AlignmentType.LEFT,
        vAlign = 'top' as TableVerticalAlign,
        shading,
        borders = CELL_BORDER_SINGLE,
        italic = false,
        colSpan,
    } = opts
    return new TableCell({
        children: [new Paragraph({
            children: [new TextRun({ text, bold, size, font: 'Times New Roman', italics: italic })],
            alignment,
        })],
        width: { size: width, type: WidthType.DXA },
        verticalAlign: vAlign,
        shading: shading ? shadeCell(shading) : undefined,
        borders,
        margins: CELL_MARGIN,
        columnSpan: colSpan,
    })
}
