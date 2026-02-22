import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { isHRManager, Role } from '@/lib/roles'
import { Document, Packer, Paragraph, TextRun, AlignmentType, ShadingType, Table, TableRow, TableCell, BorderStyle, WidthType, VerticalAlign, ExternalHyperlink } from 'docx'
import { format } from 'date-fns'
import { LeaveBalance } from '@/app/actions/leaves'

function createCheck(checked: boolean) {
    return checked ? "[\u2713]" : "[  ]"
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const leaveId = searchParams.get('leaveId')

        if (!leaveId) {
            return new NextResponse('Missing leaveId parameter', { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = currentUserProfile?.role as Role

        // Get Leave Data
        const { data: leave, error: leaveErr } = await supabase
            .from('leave_requests')
            .select('*, profiles(full_name, position, employee_number)')
            .eq('id', leaveId)
            .single()

        if (leaveErr || !leave) {
            return new NextResponse('Leave request not found', { status: 404 })
        }

        // Security check
        if (user.id !== leave.employee_id && !isHRManager(role)) {
            return new NextResponse('Forbidden', { status: 403 })
        }

        const year = new Date(leave.created_at).getFullYear()

        let vlTotal = 0
        let slTotal = 0

        // Let's get balance to fill 7A
        const { data: balanceData } = await supabase
            .from('leave_balances')
            .select('*')
            .eq('employee_id', leave.employee_id)
            .eq('year', year)
            .single()

        if (balanceData) {
            const b = balanceData as any
            vlTotal = b.vacation_leave_total - b.vacation_leave_used
            slTotal = b.sick_leave_total - b.sick_leave_used
        }

        const lType = leave.leave_type || ''
        const reason = leave.reason || ''
        const workingDays = leave.working_days || 0
        const isApproved = leave.status === 'approved'
        const isRejected = leave.status === 'rejected'
        const isVL = lType === 'Vacation Leave'
        const isSL = lType === 'Sick Leave'

        const vlLess = isVL ? workingDays : 0
        const vlBal = vlTotal - vlLess

        const slLess = isSL ? workingDays : 0
        const slBal = slTotal - slLess

        const lastName = leave.profiles?.full_name?.split(',')[0]?.trim() || 'Unknown'
        const leaveAbbrev = lType.split(' ').map((w: string) => w[0]).join('')
        const dateStr = format(new Date(leave.created_at), 'yyyyMMdd')
        const filename = `LeaveApp_${lastName}_${leaveAbbrev}_${dateStr}.docx`

        // Checkbox logic
        const cb = (t: string) => lType === t ? "[\u2713]" : "[   ]"

        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: {
                            font: "Arial",
                            size: 16 // 8pt
                        }
                    }
                }
            },
            sections: [{
                properties: {
                    page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } }
                },
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Civil Service Form No. 6\nRevised 2020", size: 16, italics: true })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 100 },
                        children: [
                            new TextRun({ text: "Republic of the Philippines", size: 20 })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: "PROVINCE OF ILOCOS SUR", size: 20, bold: true })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: "Vigan City", size: 20 })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 200 },
                        children: [
                            new TextRun({ text: "APPLICATION FOR LEAVE", size: 28, bold: true })
                        ]
                    }),

                    // Helper for bordered cells
                    ...(function createFields() {
                        const cell = (content: string | (Paragraph | Table)[], shading?: string, colSpan = 1, borders = undefined) => {
                            let children: (Paragraph | Table)[] = []
                            if (Array.isArray(content)) {
                                children = content
                            } else {
                                children = [new Paragraph({ children: [new TextRun({ text: content })] })]
                            }
                            return new TableCell({
                                columnSpan: colSpan,
                                shading: shading ? { fill: shading } : undefined,
                                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                                borders,
                                children
                            })
                        }

                        const noBorder = { style: BorderStyle.NONE, size: 0, color: "auto" }

                        return [
                            new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                columnWidths: [3500, 3500, 3000],
                                borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
                                rows: [
                                    new TableRow({
                                        children: [
                                            cell([new Paragraph({ children: [new TextRun({ text: "1. OFFICE/DEPARTMENT:", bold: true })] }), new Paragraph({ children: [new TextRun({ text: "PROVINCIAL ASSESSOR'S OFFICE" })] })], undefined, 1),
                                            cell([new Paragraph({ children: [new TextRun({ text: "2. NAME: (Last)                      (First)                        (Middle)", bold: true })] }), new Paragraph({ children: [new TextRun({ text: leave.profiles?.full_name || 'N/A' })] })], undefined, 2),
                                        ]
                                    }),
                                    new TableRow({
                                        children: [
                                            cell([new Paragraph({ children: [new TextRun({ text: "3. DATE OF FILING: ", bold: true }), new TextRun({ text: format(new Date(leave.created_at), 'MM/dd/yyyy') })] })], undefined, 1),
                                            cell([new Paragraph({ children: [new TextRun({ text: "4. POSITION: ", bold: true }), new TextRun({ text: leave.profiles?.position || 'N/A' })] })], undefined, 1),
                                            cell([new Paragraph({ children: [new TextRun({ text: "5. SALARY: ", bold: true }), new TextRun({ text: "" })] })], undefined, 1),
                                        ]
                                    })
                                ]
                            }),

                            new Paragraph({ spacing: { before: 100, after: 50 }, children: [] }),

                            new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                columnWidths: [5000, 5000],
                                rows: [
                                    new TableRow({
                                        children: [
                                            cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "6. DETAILS OF APPLICATION", bold: true, size: 20 })] })], "E0E0E0", 2)
                                        ]
                                    }),
                                    new TableRow({
                                        children: [
                                            cell([
                                                new Paragraph({ children: [new TextRun({ text: "6.A TYPE OF LEAVE TO BE AVAILED OF", bold: true })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('Vacation Leave')} Vacation Leave` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('Mandatory/Forced Leave')} Mandatory/Forced Leave` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('Sick Leave')} Sick Leave` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('Maternity Leave')} Maternity Leave` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('Paternity Leave')} Paternity Leave` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('Special Privilege Leave')} Special Privilege Leave` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('Solo Parent Leave')} Solo Parent Leave` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('Study Leave')} Study Leave` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('10-Day VAWC Leave')} 10-Day VAWC Leave` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('Rehabilitation Privilege')} Rehabilitation Privilege` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('Special Leave Benefits for Women')} Special Leave Benefits for Women` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('Special Emergency (Calamity) Leave')} Special Emergency (Calamity) Leave` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${cb('Adoption Leave')} Adoption Leave` })] }),
                                            ]),
                                            cell([
                                                new Paragraph({ children: [new TextRun({ text: "6.B DETAILS OF LEAVE", bold: true })] }),
                                                new Paragraph({ children: [new TextRun({ text: "In case of Vacation/Special Privilege Leave:", italics: true })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${(isVL || lType === 'Special Privilege Leave') ? "[\u2713]" : "[   ]"} Within the Philippines: ` + ((isVL || lType === 'Special Privilege Leave') ? reason : "") })] }),
                                                new Paragraph({ children: [new TextRun({ text: "[   ] Abroad (Specify): _____________________" })] }),
                                                new Paragraph({ children: [new TextRun({ text: "" })] }),
                                                new Paragraph({ children: [new TextRun({ text: "In case of Sick Leave:", italics: true })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${isSL ? "[\u2713]" : "[   ]"} Out Patient (Specify Illness): ` + (isSL ? reason : "") })] }),
                                                new Paragraph({ children: [new TextRun({ text: "[   ] In Hospital (Specify Illness): ______________" })] }),
                                                new Paragraph({ children: [new TextRun({ text: "" })] }),
                                                new Paragraph({ children: [new TextRun({ text: "In case of Special Leave Benefits for Women:", italics: true })] }),
                                                new Paragraph({ children: [new TextRun({ text: `(Specify Illness): ` + (lType === 'Special Leave Benefits for Women' ? reason : "___________________") })] }),
                                            ])
                                        ]
                                    }),
                                    new TableRow({
                                        children: [
                                            cell([
                                                new Paragraph({ children: [new TextRun({ text: "6.C NUMBER OF WORKING DAYS APPLIED FOR", bold: true })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${workingDays} Days`, underline: {} })] }),
                                                new Paragraph({ children: [new TextRun({ text: "INCLUSIVE DATES", bold: true })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${format(new Date(leave.date_from), 'MM/dd/yyyy')} to ${format(new Date(leave.date_to), 'MM/dd/yyyy')}`, underline: {} })] }),
                                            ]),
                                            cell([
                                                new Paragraph({ children: [new TextRun({ text: "6.D COMMUTATION", bold: true })] }),
                                                new Paragraph({ children: [new TextRun({ text: "[   ] Requested" })] }),
                                                new Paragraph({ children: [new TextRun({ text: "[\u2713] Not Requested" })] }),
                                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "____________________________________" })] }),
                                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Signature of Applicant" })] }),
                                            ])
                                        ]
                                    }),
                                    new TableRow({
                                        children: [
                                            cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "7. DETAILS OF ACTION ON APPLICATION", bold: true, size: 20 })] })], "E0E0E0", 2)
                                        ]
                                    }),
                                    new TableRow({
                                        children: [
                                            cell([
                                                new Paragraph({ children: [new TextRun({ text: "7.A CERTIFICATION OF LEAVE CREDITS", bold: true })] }),
                                                new Paragraph({ children: [new TextRun({ text: `As of ${format(new Date(leave.created_at), 'MM/dd/yyyy')}` })] }),
                                                new Table({
                                                    width: { size: 100, type: WidthType.PERCENTAGE },
                                                    columnWidths: [4000, 3000, 3000],
                                                    rows: [
                                                        new TableRow({ children: [cell(""), cell("Vacation Leave"), cell("Sick Leave")] }),
                                                        new TableRow({ children: [cell("Total Earned"), cell(vlTotal.toString()), cell(slTotal.toString())] }),
                                                        new TableRow({ children: [cell("Less this application"), cell(vlLess.toString()), cell(slLess.toString())] }),
                                                        new TableRow({ children: [cell("Balance"), cell(vlBal.toString()), cell(slBal.toString())] }),
                                                    ]
                                                }),
                                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "CORA ELENA D. PINEDA, DPA", bold: true })] }),
                                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PHRM Officer" })] }),
                                            ]),
                                            cell([
                                                new Paragraph({ children: [new TextRun({ text: "7.B RECOMMENDATION", bold: true })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${isApproved ? "[\u2713]" : "[   ]"} For approval` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${isRejected ? "[\u2713]" : "[   ]"} For disapproval due to: ${isRejected ? (leave.approval_remarks || "") : "_______________________"}` })] }),
                                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: "ATTY. MHELYGENE D. TESORO-RAMOS, REA", bold: true })] }),
                                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Provincial Assessor" })] }),
                                            ])
                                        ]
                                    }),
                                    new TableRow({
                                        children: [
                                            cell([
                                                new Paragraph({ children: [new TextRun({ text: "7.C APPROVED FOR:", bold: true })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${isApproved && lType !== 'Leave Without Pay' ? workingDays : "_____"} days with pay` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `${isApproved && lType === 'Leave Without Pay' ? workingDays : "_____"} days without pay` })] }),
                                                new Paragraph({ children: [new TextRun({ text: `_____ others (Specify)` })] }),
                                            ]),
                                            cell([
                                                new Paragraph({ children: [new TextRun({ text: "7.D DISAPPROVED DUE TO:", bold: true })] }),
                                                new Paragraph({ children: [new TextRun({ text: isRejected ? (leave.approval_remarks || '________________________') : '________________________' })] }),
                                            ])
                                        ]
                                    }),
                                    new TableRow({
                                        children: [
                                            cell([
                                                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "JEREMIAS \"JERRY\" C. SINGSON", bold: true })] }),
                                                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Governor" })] }),
                                            ], undefined, 2)
                                        ]
                                    })
                                ]
                            })
                        ]
                    })()
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
