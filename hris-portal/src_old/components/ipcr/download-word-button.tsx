'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { getIPCRReportData } from '@/app/actions/report'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign, HeightRule, PageOrientation } from 'docx'
import { saveAs } from 'file-saver'

export function DownloadWordButton({ commitmentId }: { commitmentId: string }) {
    const [loading, setLoading] = useState(false)

    async function handleDownload() {
        setLoading(true)
        try {
            const reportData = await getIPCRReportData(commitmentId)

            if (!reportData) {
                alert("No data found for this IPCR.")
                setLoading(false)
                return
            }

            const { employee, supervisor, head, period, targets, final_rating, adjectival_rating, commitment } = reportData

            const approvedDate = (commitment.status === 'approved' && commitment.updated_at)
                ? new Date(commitment.updated_at).toLocaleDateString()
                : ""

            // Define borders for better control
            const noBorders = {
                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            }

            const thinBorder = {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            }

            // --- HEADER ---
            // Republic of the Philippines ...
            const headerParagraphs = [
                new Paragraph({
                    children: [new TextRun({ text: "Republic of the Philippines", size: 20 })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 0 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: "PROVINCIAL ASSESSOR'S OFFICE", bold: true, size: 22 })], // Adapted
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: "INDIVIDUAL PERFORMANCE COMMITMENT AND REVIEW (IPCR)", bold: true, color: "FF0000", size: 24 })], // Red Title
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "I, " }),
                        new TextRun({ text: employee.name.toUpperCase(), bold: true, underline: { type: "single", color: "000000" } }),
                        new TextRun({ text: `, ${employee.position} of the ` }),
                        new TextRun({ text: employee.department || "Provincial Assessor's Office", underline: { type: "single", color: "000000" } }),
                        new TextRun({ text: " Division, commit to deliver and agree to be rated on the attainment of the following targets in accordance with the indicated measures for the period " }),
                        new TextRun({ text: period, bold: true }),
                        new TextRun({ text: "." }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 300 }
                }),
            ]

            // --- RATEE SIGNATURE (Floating Right) ---
            const rateeSignatureTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: noBorders,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [], width: { size: 60, type: WidthType.PERCENTAGE } }), // Spacer
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        children: [new TextRun({ text: employee.name.toUpperCase(), bold: true, underline: { type: "single", color: "000000" } })],
                                        alignment: AlignmentType.CENTER
                                    }),
                                    new Paragraph({
                                        children: [new TextRun({ text: "Ratee", bold: true })],
                                        alignment: AlignmentType.CENTER
                                    }),
                                    new Paragraph({
                                        children: [new TextRun({ text: "Date: " + new Date().toLocaleDateString(), size: 20 })],
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 100 }
                                    }),
                                ],
                                width: { size: 40, type: WidthType.PERCENTAGE }
                            }),
                        ]
                    })
                ]
            })

            // --- REVIEW / APPROVAL BOX ---
            const reviewBoxTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    // Header Row
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ text: "Reviewed by:", alignment: AlignmentType.CENTER })],
                                width: { size: 45, type: WidthType.PERCENTAGE },
                                shading: { fill: "FFE699" } // Light Orange
                            }),
                            new TableCell({
                                children: [new Paragraph({ text: "Date", alignment: AlignmentType.CENTER })],
                                width: { size: 10, type: WidthType.PERCENTAGE },
                                shading: { fill: "FFE699" }
                            }),
                            new TableCell({
                                children: [new Paragraph({ text: "Approved by:", alignment: AlignmentType.CENTER })],
                                width: { size: 45, type: WidthType.PERCENTAGE },
                                shading: { fill: "FFE699" }
                            }),
                            new TableCell({
                                children: [new Paragraph({ text: "Date", alignment: AlignmentType.CENTER })],
                                width: { size: 10, type: WidthType.PERCENTAGE },
                                shading: { fill: "FFE699" }
                            }),
                        ]
                    }),
                    // Signatures Row
                    new TableRow({
                        height: { value: 600, rule: HeightRule.ATLEAST },
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({ text: "" }), // Space
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: supervisor.name.toUpperCase(), bold: true })
                                        ],
                                        alignment: AlignmentType.CENTER
                                    }),
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: "Immediate Supervisor", size: 20 })
                                        ],
                                        alignment: AlignmentType.CENTER
                                    }),
                                ],
                                verticalAlign: VerticalAlign.BOTTOM
                            }),
                            new TableCell({ children: [] }),
                            new TableCell({
                                children: [
                                    new Paragraph({ text: "" }), // Space
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: head.name.toUpperCase(), bold: true })
                                        ],
                                        alignment: AlignmentType.CENTER
                                    }),
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: "Provincial Assessor", size: 20 })
                                        ],
                                        alignment: AlignmentType.CENTER
                                    }),
                                ],
                                verticalAlign: VerticalAlign.BOTTOM
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({ text: "" }),
                                    new Paragraph({
                                        children: [
                                            new TextRun({ text: approvedDate, size: 20 })
                                        ],
                                        alignment: AlignmentType.CENTER
                                    })
                                ],
                                verticalAlign: VerticalAlign.BOTTOM
                            }),
                        ]
                    })
                ]
            })

            // --- MAIN TABLE HEADER ---
            // Columns: MFO, Success Indicators, Accomp, Q, E, T, A, Remarks
            // Widths: 20%, 30%, 30%, 4%, 4%, 4%, 4%, 4% (Approx)

            const tableHeaderRows = [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "MFO / PAP", bold: true })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, rowSpan: 2, shading: { fill: "B4C6E7" } }), // Blue
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "SUCCESS INDICATORS\n(Targets + Measures)", bold: true })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, rowSpan: 2, shading: { fill: "B4C6E7" } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Actual Accomplishments", bold: true })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, rowSpan: 2, shading: { fill: "B4C6E7" } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rating", bold: true })], alignment: AlignmentType.CENTER })], columnSpan: 4, shading: { fill: "B4C6E7" } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Remarks", bold: true })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER, rowSpan: 2, shading: { fill: "B4C6E7" } }),
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Q", size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: "B4C6E7" } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "E", size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: "B4C6E7" } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "T", size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: "B4C6E7" } }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "A", size: 18 })], alignment: AlignmentType.CENTER })], shading: { fill: "B4C6E7" } }),
                    ]
                })
            ]

            const dataRows: TableRow[] = []

            // Helper to add categories
            const addCategory = (title: string, key: string) => {
                const categoryTargets = targets.filter((t: any) => t.category === key)
                if (categoryTargets.length === 0) return

                // Category Header
                dataRows.push(new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, italics: true })] })], columnSpan: 8, shading: { fill: "E2EFDA" } }) // Light Green
                    ]
                }))

                // Targets
                categoryTargets.forEach((t: any) => {
                    dataRows.push(new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph(t.mfo)] }),
                            new TableCell({ children: [new Paragraph(t.indicators)] }),
                            new TableCell({ children: [new Paragraph(t.actual_accomplishment || '')] }),
                            new TableCell({ children: [new Paragraph({ text: t.q ? String(t.q) : '', alignment: AlignmentType.CENTER })] }),
                            new TableCell({ children: [new Paragraph({ text: t.e ? String(t.e) : '', alignment: AlignmentType.CENTER })] }),
                            new TableCell({ children: [new Paragraph({ text: t.t ? String(t.t) : '', alignment: AlignmentType.CENTER })] }),
                            new TableCell({ children: [new Paragraph({ text: t.a ? Number(t.a).toFixed(2) : '', alignment: AlignmentType.CENTER })] }),
                            new TableCell({ children: [new Paragraph(t.remarks || '')] }),
                        ]
                    }))
                })
            }

            addCategory("Strategic Priorities", "strategic")
            addCategory("Core Functions", "core")
            addCategory("Support Functions", "support")

            // Space row inside table? No, better as empty row
            dataRows.push(new TableRow({
                children: [
                    new TableCell({ children: [], columnSpan: 8 })
                ]
            }))

            // Final Rating Row
            dataRows.push(new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Final Average Rating", bold: true })], alignment: AlignmentType.RIGHT })], columnSpan: 6, shading: { fill: "EFEFEF" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: final_rating ? Number(final_rating).toFixed(2) : '', bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: "EFEFEF" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: adjectival_rating || '', bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: "EFEFEF" } }),
                ]
            }))

            const mainTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [...tableHeaderRows, ...dataRows]
            })

            // --- COMMENTS BOX ---
            const commentsTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: "Comments and Recommendations for Development Purposes:", bold: true })] })],
                                shading: { fill: "E2EFDA" }
                            })
                        ]
                    }),
                    new TableRow({
                        height: { value: 1440, rule: HeightRule.ATLEAST }, // 1 inch
                        children: [new TableCell({ children: [] })]
                    })
                ]
            })

            // --- FOOTER SIGNATURES ---
            const footerTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Discussed with:", bold: true })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Assessed by:", bold: true })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Final Rating by:", bold: true })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                        ]
                    }),
                    new TableRow({
                        height: { value: 720, rule: HeightRule.ATLEAST }, // 0.5 inch space
                        children: [
                            new TableCell({
                                children: [
                                    new Paragraph({ text: "", spacing: { after: 300 } }),
                                    new Paragraph({ children: [new TextRun({ text: employee.name.toUpperCase(), bold: true })], alignment: AlignmentType.CENTER }),
                                    new Paragraph({ children: [new TextRun({ text: "Ratee", size: 20 })], alignment: AlignmentType.CENTER })
                                ], verticalAlign: VerticalAlign.BOTTOM
                            }),
                            new TableCell({ children: [], verticalAlign: VerticalAlign.BOTTOM }),
                            new TableCell({
                                children: [
                                    new Paragraph({ text: "", spacing: { after: 300 } }),
                                    new Paragraph({ children: [new TextRun({ text: supervisor.name.toUpperCase(), bold: true })], alignment: AlignmentType.CENTER }),
                                    new Paragraph({ children: [new TextRun({ text: "Immediate Supervisor", size: 20 })], alignment: AlignmentType.CENTER })
                                ], verticalAlign: VerticalAlign.BOTTOM
                            }),
                            new TableCell({ children: [], verticalAlign: VerticalAlign.BOTTOM }),
                            new TableCell({
                                children: [
                                    new Paragraph({ text: "", spacing: { after: 300 } }),
                                    new Paragraph({ children: [new TextRun({ text: head.name.toUpperCase(), bold: true })], alignment: AlignmentType.CENTER }),
                                    new Paragraph({ children: [new TextRun({ text: "Provincial Assessor", size: 20 })], alignment: AlignmentType.CENTER })
                                ], verticalAlign: VerticalAlign.BOTTOM
                            }),
                            new TableCell({
                                children: [
                                    new Paragraph({ text: "", spacing: { after: 300 } }),
                                    new Paragraph({ children: [new TextRun({ text: approvedDate, size: 20 })], alignment: AlignmentType.CENTER })
                                ],
                                verticalAlign: VerticalAlign.BOTTOM
                            }),
                        ]
                    })
                ]
            })


            // --- CREATE DOCUMENT ---
            const doc = new Document({
                sections: [{
                    properties: {
                        page: {
                            margin: {
                                top: 720, // 0.5 inch
                                right: 720,
                                bottom: 720,
                                left: 720,
                            },
                            size: {
                                orientation: PageOrientation.LANDSCAPE,
                            },
                        },
                    },
                    children: [
                        ...headerParagraphs,
                        new Paragraph({ children: [] }),
                        rateeSignatureTable,
                        new Paragraph({ children: [] }), // spacing
                        reviewBoxTable,
                        new Paragraph({ children: [] }), // spacing
                        mainTable,
                        new Paragraph({ children: [] }),
                        commentsTable,
                        new Paragraph({ children: [] }),
                        footerTable
                    ],
                }],
            })

            const blob = await Packer.toBlob(doc)
            saveAs(blob, `IPCR_${employee.name.replace(/\s+/g, '_')}_${period}.docx`)

        } catch (err) {
            console.error("Word download failed", err)
            // alert("Failed to generate Word document.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:text-blue-800 hover:bg-blue-100 border-blue-200"
        >
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating Word...</span>
                </>
            ) : (
                <>
                    <FileText className="h-4 w-4" />
                    <span>Download Word</span>
                </>
            )}
        </Button>
    )
}
