import * as XLSX from 'xlsx'

interface IPCRSummaryData {
    period_name: string
    division_name?: string
    total_employees: number
    submitted: number
    pending: number
    average_rating: number
    individual_ratings: Array<{
        employee: string
        division: string
        rating: number | null
        adjectival: string | null
        status: string
    }>
    division_breakdown: Array<{
        division: string
        code: string
        total: number
        submitted: number
        avg_rating: number
        adjectival: string
    }>
}

function adjectivalColor(adjectival: string | null): string {
    switch (adjectival?.toLowerCase()) {
        case 'outstanding': return '1e7e34'
        case 'very satisfactory': return '856404'
        case 'satisfactory': return '0056b3'
        case 'unsatisfactory': return 'c82333'
        case 'poor': return '721c24'
        default: return '495057'
    }
}

function createCellStyle(opts: {
    bold?: boolean
    fontSize?: number
    bgColor?: string
    fontColor?: string
    alignment?: 'center' | 'left' | 'right'
    border?: boolean
    numFmt?: string
}) {
    return {
        font: { name: 'Calibri', sz: opts.fontSize ?? 11, bold: opts.bold ?? false, color: opts.fontColor ? { rgb: opts.fontColor } : undefined },
        fill: opts.bgColor ? { patternType: 'solid', fgColor: { rgb: opts.bgColor } } : undefined,
        alignment: opts.alignment ? { horizontal: opts.alignment, wrapText: true, vertical: 'center' } : { vertical: 'center', wrapText: true },
        border: opts.border ? {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
        } : undefined,
        numFmt: opts.numFmt,
    }
}

export function generateIPCRSummaryExcel(data: IPCRSummaryData): Buffer {
    const wb = XLSX.utils.book_new()

    // ── Sheet 1: Summary ─────────────────────────────────────────────────────
    const summaryRows: any[][] = [
        [`IPCR SUMMARY REPORT — ${data.period_name}${data.division_name ? ' — ' + data.division_name : ''}`],
        [],
        ['PERIOD:', data.period_name],
        ['TOTAL EMPLOYEES:', data.total_employees],
        ['SUBMITTED IPCRs:', data.submitted],
        ['PENDING / DRAFTS:', data.pending],
        ['AVERAGE RATING:', data.average_rating > 0 ? Number(data.average_rating.toFixed(2)) : 0],
        ['COMPLIANCE RATE (%):', {
            f: `=IF(${data.total_employees}>0,ROUND(${data.submitted}/${data.total_employees}*100,1),0)`,
        }],
        [],
        ['INDIVIDUAL RATINGS'],
        ['No.', 'Employee Name', 'Division', 'Rating', 'Adjectival', 'Status'],
        ...data.individual_ratings.map((r, i) => [
            i + 1,
            r.employee,
            r.division,
            r.rating != null ? Number(r.rating.toFixed(2)) : '—',
            r.adjectival ?? '—',
            r.status.replace(/_/g, ' ').toUpperCase(),
        ]),
    ]

    const ws1 = XLSX.utils.aoa_to_sheet(summaryRows)

    // Column widths
    ws1['!cols'] = [
        { wch: 5 },   // No.
        { wch: 30 },  // Name
        { wch: 20 },  // Division
        { wch: 10 },  // Rating
        { wch: 20 },  // Adjectival
        { wch: 15 },  // Status
    ]

    // Merge title
    ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]

    XLSX.utils.book_append_sheet(wb, ws1, 'Summary')

    // ── Sheet 2: Division Breakdown ──────────────────────────────────────────
    const divRows: any[][] = [
        [`IPCR DIVISION BREAKDOWN — ${data.period_name}`],
        [],
        ['Division', 'Code', 'Total', 'Submitted', 'Pending', 'Avg Rating', 'Rating Category', 'Compliance %'],
        ...data.division_breakdown.map(d => [
            d.division,
            d.code,
            d.total,
            d.submitted,
            d.total - d.submitted,
            d.avg_rating > 0 ? Number(d.avg_rating.toFixed(2)) : 0,
            d.adjectival ?? '—',
            {
                f: d.total > 0
                    ? `=IF(${d.total}>0,ROUND(${d.submitted}/${d.total}*100,1),0)`
                    : '0',
            },
        ]),
        [],
        ['TOTALS', '',
            data.total_employees,
            data.submitted,
            data.total_employees - data.submitted,
            data.average_rating > 0 ? Number(data.average_rating.toFixed(2)) : 0,
            '',
            { f: `=IF(${data.total_employees}>0,ROUND(${data.submitted}/${data.total_employees}*100,1),0)` },
        ],
    ]

    const ws2 = XLSX.utils.aoa_to_sheet(divRows)
    ws2['!cols'] = [
        { wch: 30 }, // Division
        { wch: 10 }, // Code
        { wch: 8 },  // Total
        { wch: 10 }, // Submitted
        { wch: 8 },  // Pending
        { wch: 12 }, // Avg Rating
        { wch: 20 }, // Category
        { wch: 14 }, // Compliance
    ]
    ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]

    XLSX.utils.book_append_sheet(wb, ws2, 'By Division')

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}
