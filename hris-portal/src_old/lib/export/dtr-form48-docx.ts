import {
    Document, Packer, Paragraph, TextRun,
    Table, TableRow, TableCell,
    AlignmentType, BorderStyle,
    WidthType, VerticalAlign,
    PageOrientation, ShadingType,
    UnderlineType
} from 'docx'

type DTRLog = {
    log_date: string
    am_arrival?: string | null
    am_departure?: string | null
    pm_arrival?: string | null
    pm_departure?: string | null
    undertime_hours?: number | null
    undertime_minutes?: number | null
}

type Form48Input = {
    staff: {
        full_name: string
        position: string
        division: string
    }
    month: number
    year: number
    logs: DTRLog[]
}

export async function generateForm48DOCX(
    input: Form48Input
): Promise<Buffer> {

    const {
        staff, month, year, logs
    } = input

    const monthName = new Date(year, month - 1)
        .toLocaleString('en-PH', { month: 'long' })

    const daysInMonth =
        new Date(year, month, 0).getDate()

    // Build a lookup map: day → log entry
    const logMap: Record<number, DTRLog> = {}
    logs.forEach(log => {
        const day = new Date(log.log_date).getDate()
        logMap[day] = log
    })

    // Helper: format time or return empty
    const fmt = (t?: string | null): string => {
        if (!t) return ''
        // Format HH:MM from "HH:MM:SS"
        return t.substring(0, 5)
    }

    // ─────────────────────────────────────
    // PAGE SETUP
    // US Letter, Landscape orientation
    // Form 48 is wide due to two-column layout
    // ─────────────────────────────────────
    // Landscape content width:
    // 15840 - 1440 (margins) = 14400 DXA

    // ─────────────────────────────────────
    // BORDER DEFINITION
    // ─────────────────────────────────────
    const thinBorder = {
        style: BorderStyle.SINGLE,
        size: 4,
        color: '000000'
    }
    const cellBorders = {
        top: thinBorder,
        bottom: thinBorder,
        left: thinBorder,
        right: thinBorder
    }
    const noBorder = {
        style: BorderStyle.NONE,
        size: 0,
        color: 'FFFFFF'
    }
    const noBorders = {
        top: noBorder,
        bottom: noBorder,
        left: noBorder,
        right: noBorder
    }

    // ─────────────────────────────────────
    // HELPER: cell builder
    // ─────────────────────────────────────
    const cell = (
        text: string,
        width: number,
        opts?: {
            bold?: boolean
            center?: boolean
            shade?: string
            borders?: object
            vAlign?: any
            fontSize?: number
        }
    ) => new TableCell({
        width: { size: width, type: WidthType.DXA },
        borders: (opts?.borders ?? cellBorders) as any,
        shading: opts?.shade
            ? {
                fill: opts.shade,
                type: ShadingType.CLEAR
            }
            : undefined,
        verticalAlign:
            opts?.vAlign ?? VerticalAlign.CENTER,
        margins: {
            top: 40, bottom: 40,
            left: 60, right: 60
        },
        children: [new Paragraph({
            alignment: opts?.center
                ? AlignmentType.CENTER
                : AlignmentType.LEFT,
            children: [new TextRun({
                text,
                bold: opts?.bold ?? false,
                size: opts?.fontSize ?? 16,
                // 16 half-points = 8pt
                font: 'Arial Narrow'
            })]
        })]
    })

    // ─────────────────────────────────────
    // HELPER: Build one half of the form
    // (days startDay to endDay)
    // Returns array of TableRows
    // ─────────────────────────────────────

    // Column widths for ONE half (7200 DXA total):
    // Day No:          500
    // AM Arrival:     1000
    // AM Departure:   1000
    // PM Arrival:     1000
    // PM Departure:   1000
    // Undertime Hrs:   850
    // Undertime Mins:  850
    // Total:          6200 DXA per half
    // Gap between halves: 2000 DXA
    // Total: 6200 + 2000 + 6200 = 14400 ✓

    const COL = {
        day: 500,
        amArr: 1000,
        amDep: 1000,
        pmArr: 1000,
        pmDep: 1000,
        utHrs: 850,
        utMin: 850,
        gap: 2000
    }

    // ─────────────────────────────────────
    // MAIN TABLE BUILDER
    // One unified table spanning full width
    // Left 6200: days 1-15 (or 1-16)
    // Center 2000: spacer column
    // Right 6200: days 16-31
    // ─────────────────────────────────────

    const tableRows: TableRow[] = []

    // ── ROW 1: Form title header ──
    tableRows.push(new TableRow({
        children: [
            // Left half title
            new TableCell({
                columnSpan: 7,
                width: {
                    size: 6200, type: WidthType.DXA
                },
                borders: noBorders,
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            text: 'Civil Service Form No. 48',
                            bold: true,
                            size: 18,
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            text: 'DAILY TIME RECORD',
                            bold: true,
                            size: 20,
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            text: staff.full_name,
                            bold: true,
                            size: 18,
                            underline: {
                                type: UnderlineType.SINGLE
                            },
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            text: '(Name)',
                            size: 14,
                            font: 'Arial Narrow'
                        })]
                    })
                ]
            }),
            // Gap column
            new TableCell({
                columnSpan: 1,
                width: {
                    size: COL.gap, type: WidthType.DXA
                },
                borders: noBorders,
                children: [new Paragraph({ children: [] })]
            }),
            // Right half title (mirror of left)
            new TableCell({
                columnSpan: 7,
                width: {
                    size: 6200, type: WidthType.DXA
                },
                borders: noBorders,
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            text: 'Civil Service Form No. 48',
                            bold: true,
                            size: 18,
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            text: 'DAILY TIME RECORD',
                            bold: true,
                            size: 20,
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            text: staff.full_name,
                            bold: true,
                            size: 18,
                            underline: {
                                type: UnderlineType.SINGLE
                            },
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            text: '(Name)',
                            size: 14,
                            font: 'Arial Narrow'
                        })]
                    })
                ]
            })
        ]
    }))

    // ── ROW 2: Month/Year + Official Hours ──
    tableRows.push(new TableRow({
        children: [
            new TableCell({
                columnSpan: 7,
                borders: noBorders,
                children: [
                    new Paragraph({
                        children: [new TextRun({
                            text:
                                `For the month of ${monthName
                                }, ${year}`,
                            size: 16,
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({
                        children: [new TextRun({
                            text: 'Official hours of arrival' +
                                ' and departure',
                            size: 14,
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({
                        children: [new TextRun({
                            text: 'Regular Days ________' +
                                '    Saturdays ___________',
                            size: 14,
                            font: 'Arial Narrow'
                        })]
                    })
                ]
            }),
            new TableCell({
                columnSpan: 1,
                borders: noBorders,
                children: [new Paragraph({ children: [] })]
            }),
            new TableCell({
                columnSpan: 7,
                borders: noBorders,
                children: [
                    new Paragraph({
                        children: [new TextRun({
                            text:
                                `For the month of ${monthName
                                }, ${year}`,
                            size: 16,
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({
                        children: [new TextRun({
                            text: 'Official hours of arrival' +
                                ' and departure',
                            size: 14,
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({
                        children: [new TextRun({
                            text: 'Regular Days ________' +
                                '    Saturdays ___________',
                            size: 14,
                            font: 'Arial Narrow'
                        })]
                    })
                ]
            })
        ]
    }))

    // ── ROW 3: Column headers ──
    // ARRIVAL | DEPARTURE | ARRIVAL | DEPARTURE |
    // UNDERTIME
    tableRows.push(new TableRow({
        children: [
            cell('', COL.day, {
                center: true, shade: 'D9D9D9',
                bold: true
            }),
            // Left AM/PM headers (merged pairs)
            new TableCell({
                columnSpan: 2,
                width: { size: 2000, type: WidthType.DXA },
                borders: cellBorders as any,
                shading: {
                    fill: 'D9D9D9', type: ShadingType.CLEAR
                },
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({
                        text: 'A.M.',
                        bold: true, size: 16,
                        font: 'Arial Narrow'
                    })]
                })]
            }),
            new TableCell({
                columnSpan: 2,
                width: { size: 2000, type: WidthType.DXA },
                borders: cellBorders as any,
                shading: {
                    fill: 'D9D9D9', type: ShadingType.CLEAR
                },
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({
                        text: 'P.M.',
                        bold: true, size: 16,
                        font: 'Arial Narrow'
                    })]
                })]
            }),
            new TableCell({
                columnSpan: 2,
                width: {
                    size: COL.utHrs + COL.utMin,
                    type: WidthType.DXA
                },
                borders: cellBorders as any,
                shading: {
                    fill: 'D9D9D9', type: ShadingType.CLEAR
                },
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({
                        text: 'UNDER TIME',
                        bold: true, size: 14,
                        font: 'Arial Narrow'
                    })]
                })]
            }),
            // Gap
            new TableCell({
                width: { size: COL.gap, type: WidthType.DXA },
                borders: noBorders,
                children: [new Paragraph({ children: [] })]
            }),
            // Right side — mirror
            cell('', COL.day, {
                center: true, shade: 'D9D9D9', bold: true
            }),
            new TableCell({
                columnSpan: 2,
                width: { size: 2000, type: WidthType.DXA },
                borders: cellBorders as any,
                shading: {
                    fill: 'D9D9D9', type: ShadingType.CLEAR
                },
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({
                        text: 'A.M.',
                        bold: true, size: 16,
                        font: 'Arial Narrow'
                    })]
                })]
            }),
            new TableCell({
                columnSpan: 2,
                width: { size: 2000, type: WidthType.DXA },
                borders: cellBorders as any,
                shading: {
                    fill: 'D9D9D9', type: ShadingType.CLEAR
                },
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({
                        text: 'P.M.',
                        bold: true, size: 16,
                        font: 'Arial Narrow'
                    })]
                })]
            }),
            new TableCell({
                columnSpan: 2,
                width: {
                    size: COL.utHrs + COL.utMin,
                    type: WidthType.DXA
                },
                borders: cellBorders as any,
                shading: {
                    fill: 'D9D9D9', type: ShadingType.CLEAR
                },
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({
                        text: 'UNDER TIME',
                        bold: true, size: 14,
                        font: 'Arial Narrow'
                    })]
                })]
            })
        ]
    }))

    // ── ROW 4: Sub-headers ──
    // ARRIVAL | DEPARTURE | ARRIVAL | DEPARTURE |
    // Hours | Minutes (both sides)
    tableRows.push(new TableRow({
        children: [
            cell('', COL.day, {
                shade: 'D9D9D9', center: true
            }),
            cell('ARRIVAL', COL.amArr, {
                shade: 'D9D9D9', center: true,
                bold: true, fontSize: 14
            }),
            cell('DEPARTURE', COL.amDep, {
                shade: 'D9D9D9', center: true,
                bold: true, fontSize: 14
            }),
            cell('ARRIVAL', COL.pmArr, {
                shade: 'D9D9D9', center: true,
                bold: true, fontSize: 14
            }),
            cell('DEPARTURE', COL.pmDep, {
                shade: 'D9D9D9', center: true,
                bold: true, fontSize: 14
            }),
            cell('Hours', COL.utHrs, {
                shade: 'D9D9D9', center: true,
                fontSize: 14
            }),
            cell('Minutes', COL.utMin, {
                shade: 'D9D9D9', center: true,
                fontSize: 14
            }),
            // Gap
            new TableCell({
                width: { size: COL.gap, type: WidthType.DXA },
                borders: noBorders,
                children: [new Paragraph({ children: [] })]
            }),
            // Right side mirror
            cell('', COL.day, {
                shade: 'D9D9D9', center: true
            }),
            cell('ARRIVAL', COL.amArr, {
                shade: 'D9D9D9', center: true,
                bold: true, fontSize: 14
            }),
            cell('DEPARTURE', COL.amDep, {
                shade: 'D9D9D9', center: true,
                bold: true, fontSize: 14
            }),
            cell('ARRIVAL', COL.pmArr, {
                shade: 'D9D9D9', center: true,
                bold: true, fontSize: 14
            }),
            cell('DEPARTURE', COL.pmDep, {
                shade: 'D9D9D9', center: true,
                bold: true, fontSize: 14
            }),
            cell('Hours', COL.utHrs, {
                shade: 'D9D9D9', center: true,
                fontSize: 14
            }),
            cell('Minutes', COL.utMin, {
                shade: 'D9D9D9', center: true,
                fontSize: 14
            })
        ]
    }))

    // ── ROWS 5-35: Day data rows ──
    // Days 1-15 on left, 16-31 on right
    // Both sides in the same row
    for (let i = 0; i < 16; i++) {
        const leftDay = i + 1
        // Days 1-16 on left side
        const rightDay = i + 16
        // Days 17-31 on right side

        const leftLog = logMap[leftDay]
        const rightLog = rightDay <= daysInMonth
            ? logMap[rightDay]
            : null

        // Check if day is weekend (no shading,
        // just leave blank)
        const leftDate = leftDay <= daysInMonth
            ? new Date(year, month - 1, leftDay)
            : null
        const rightDate = rightDay <= daysInMonth
            ? new Date(year, month - 1, rightDay)
            : null

        const isWeekend = (d: Date | null) =>
            d ? d.getDay() === 0 || d.getDay() === 6
                : false

        const weekendShade = 'F5F5F5'

        tableRows.push(new TableRow({
            height: { value: 320, rule: 'exact' },
            children: [
                // Left day number
                cell(
                    leftDay <= daysInMonth
                        ? String(leftDay) : '',
                    COL.day,
                    {
                        center: true,
                        shade: isWeekend(leftDate)
                            ? weekendShade : undefined,
                        bold: true, fontSize: 16
                    }
                ),
                // Left AM Arrival
                cell(
                    leftLog ? fmt(leftLog.am_arrival) : '',
                    COL.amArr,
                    {
                        center: true,
                        shade: isWeekend(leftDate)
                            ? weekendShade : undefined
                    }
                ),
                // Left AM Departure
                cell(
                    leftLog ? fmt(leftLog.am_departure) : '',
                    COL.amDep,
                    {
                        center: true,
                        shade: isWeekend(leftDate)
                            ? weekendShade : undefined
                    }
                ),
                // Left PM Arrival
                cell(
                    leftLog ? fmt(leftLog.pm_arrival) : '',
                    COL.pmArr,
                    {
                        center: true,
                        shade: isWeekend(leftDate)
                            ? weekendShade : undefined
                    }
                ),
                // Left PM Departure
                cell(
                    leftLog ? fmt(leftLog.pm_departure) : '',
                    COL.pmDep,
                    {
                        center: true,
                        shade: isWeekend(leftDate)
                            ? weekendShade : undefined
                    }
                ),
                // Left Undertime Hours
                cell(
                    leftLog?.undertime_hours
                        ? String(leftLog.undertime_hours) : '',
                    COL.utHrs,
                    {
                        center: true,
                        shade: isWeekend(leftDate)
                            ? weekendShade : undefined
                    }
                ),
                // Left Undertime Minutes
                cell(
                    leftLog?.undertime_minutes
                        ? String(leftLog.undertime_minutes) : '',
                    COL.utMin,
                    {
                        center: true,
                        shade: isWeekend(leftDate)
                            ? weekendShade : undefined
                    }
                ),
                // Gap column
                new TableCell({
                    width: {
                        size: COL.gap, type: WidthType.DXA
                    },
                    borders: noBorders,
                    children: [
                        new Paragraph({ children: [] })
                    ]
                }),
                // Right day number
                cell(
                    rightDay <= daysInMonth
                        ? String(rightDay) : '',
                    COL.day,
                    {
                        center: true,
                        shade: isWeekend(rightDate)
                            ? weekendShade : undefined,
                        bold: true, fontSize: 16
                    }
                ),
                // Right AM Arrival
                cell(
                    rightLog ? fmt(rightLog.am_arrival) : '',
                    COL.amArr,
                    {
                        center: true,
                        shade: isWeekend(rightDate)
                            ? weekendShade : undefined
                    }
                ),
                // Right AM Departure
                cell(
                    rightLog
                        ? fmt(rightLog.am_departure) : '',
                    COL.amDep,
                    {
                        center: true,
                        shade: isWeekend(rightDate)
                            ? weekendShade : undefined
                    }
                ),
                // Right PM Arrival
                cell(
                    rightLog ? fmt(rightLog.pm_arrival) : '',
                    COL.pmArr,
                    {
                        center: true,
                        shade: isWeekend(rightDate)
                            ? weekendShade : undefined
                    }
                ),
                // Right PM Departure
                cell(
                    rightLog
                        ? fmt(rightLog.pm_departure) : '',
                    COL.pmDep,
                    {
                        center: true,
                        shade: isWeekend(rightDate)
                            ? weekendShade : undefined
                    }
                ),
                // Right Undertime Hours
                cell(
                    rightLog?.undertime_hours
                        ? String(rightLog.undertime_hours)
                        : '',
                    COL.utHrs,
                    {
                        center: true,
                        shade: isWeekend(rightDate)
                            ? weekendShade : undefined
                    }
                ),
                // Right Undertime Minutes
                cell(
                    rightLog?.undertime_minutes
                        ? String(rightLog.undertime_minutes)
                        : '',
                    COL.utMin,
                    {
                        center: true,
                        shade: isWeekend(rightDate)
                            ? weekendShade : undefined
                    }
                )
            ]
        }))
    }

    // ── TOTAL ROW ──
    tableRows.push(new TableRow({
        children: [
            new TableCell({
                columnSpan: 5,
                borders: cellBorders as any,
                children: [new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({
                        text: 'TOTAL',
                        bold: true, size: 16,
                        font: 'Arial Narrow'
                    })]
                })]
            }),
            cell('', COL.utHrs, { center: true }),
            cell('', COL.utMin, { center: true }),
            new TableCell({
                width: { size: COL.gap, type: WidthType.DXA },
                borders: noBorders,
                children: [new Paragraph({ children: [] })]
            }),
            new TableCell({
                columnSpan: 5,
                borders: cellBorders as any,
                children: [new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({
                        text: 'TOTAL',
                        bold: true, size: 16,
                        font: 'Arial Narrow'
                    })]
                })]
            }),
            cell('', COL.utHrs, { center: true }),
            cell('', COL.utMin, { center: true })
        ]
    }))

    // ── IN-CHARGE + DAYS ROW ──
    tableRows.push(new TableRow({
        children: [
            new TableCell({
                columnSpan: 5,
                borders: cellBorders as any,
                children: [new Paragraph({
                    children: [new TextRun({
                        text: 'In-Charge _______________',
                        size: 16, font: 'Arial Narrow'
                    })]
                })]
            }),
            new TableCell({
                columnSpan: 2,
                borders: cellBorders as any,
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({
                        text: 'Days ____',
                        size: 16, font: 'Arial Narrow'
                    })]
                })]
            }),
            new TableCell({
                width: { size: COL.gap, type: WidthType.DXA },
                borders: noBorders,
                children: [new Paragraph({ children: [] })]
            }),
            new TableCell({
                columnSpan: 5,
                borders: cellBorders as any,
                children: [new Paragraph({
                    children: [new TextRun({
                        text: 'In-Charge _______________',
                        size: 16, font: 'Arial Narrow'
                    })]
                })]
            }),
            new TableCell({
                columnSpan: 2,
                borders: cellBorders as any,
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({
                        text: 'Days ____',
                        size: 16, font: 'Arial Narrow'
                    })]
                })]
            })
        ]
    }))

    // ── CERTIFICATION ROW ──
    const certText =
        'I CERTIFY on my honor that the above ' +
        'is a true and correct report of the ' +
        'hours of work performed, record of ' +
        'which was made daily at the time of ' +
        'arrival and departure from office.'

    tableRows.push(new TableRow({
        height: { value: 900, rule: 'atLeast' },
        children: [
            new TableCell({
                columnSpan: 7,
                borders: cellBorders as any,
                children: [
                    new Paragraph({
                        children: [new TextRun({
                            text: certText,
                            size: 14,
                            italics: true,
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({ children: [] }),
                    new Paragraph({ children: [] }),
                    new Paragraph({
                        border: {
                            top: {
                                style: BorderStyle.SINGLE,
                                size: 4, space: 1,
                                color: '000000'
                            }
                        },
                        children: [new TextRun({
                            text: staff.full_name,
                            bold: true, size: 16,
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            text: '(See Instructions on back)',
                            size: 12, italics: true,
                            font: 'Arial Narrow'
                        })]
                    })
                ]
            }),
            // Gap
            new TableCell({
                width: { size: COL.gap, type: WidthType.DXA },
                borders: noBorders,
                children: [new Paragraph({ children: [] })]
            }),
            // Right side certification (mirror)
            new TableCell({
                columnSpan: 7,
                borders: cellBorders as any,
                children: [
                    new Paragraph({
                        children: [new TextRun({
                            text: certText,
                            size: 14,
                            italics: true,
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({ children: [] }),
                    new Paragraph({ children: [] }),
                    new Paragraph({
                        border: {
                            top: {
                                style: BorderStyle.SINGLE,
                                size: 4, space: 1,
                                color: '000000'
                            }
                        },
                        children: [new TextRun({
                            text: staff.full_name,
                            bold: true, size: 16,
                            font: 'Arial Narrow'
                        })]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({
                            text: '(See Instructions on back)',
                            size: 12, italics: true,
                            font: 'Arial Narrow'
                        })]
                    })
                ]
            })
        ]
    }))

    // ─────────────────────────────────────
    // ASSEMBLE DOCUMENT
    // ─────────────────────────────────────
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: {
                        width: 12240,
                        height: 15840,
                        orientation: PageOrientation.LANDSCAPE
                    },
                    margin: {
                        top: 720, right: 720,
                        bottom: 720, left: 720
                    }
                }
            },
            children: [
                new Table({
                    width: {
                        size: 14400, type: WidthType.DXA
                    },
                    columnWidths: [
                        COL.day, COL.amArr, COL.amDep,
                        COL.pmArr, COL.pmDep,
                        COL.utHrs, COL.utMin,
                        COL.gap,
                        COL.day, COL.amArr, COL.amDep,
                        COL.pmArr, COL.pmDep,
                        COL.utHrs, COL.utMin
                    ],
                    rows: tableRows
                })
            ]
        }]
    })

    return Buffer.from(await Packer.toBuffer(doc))
}
