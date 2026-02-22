'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { getIPCRReportData } from '@/app/actions/report'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export function DownloadExcelButton({ commitmentId }: { commitmentId: string }) {
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

            const { employee, supervisor, head, period, targets, final_rating, adjectival_rating } = reportData

            const wb = XLSX.utils.book_new()
            const wsData: any[][] = []

            // --- HEADER SECTION ---
            wsData.push(["Republic of the Philippines"])
            wsData.push(["PROVINCIAL ASSESSOR'S OFFICE"]) // Adapted for project
            wsData.push(["Provincial Government of [Province]"]) // Placeholder or fetch if available
            wsData.push([])
            wsData.push(["INDIVIDUAL PERFORMANCE COMMITMENT AND REVIEW (IPCR)"])
            wsData.push([])

            // Commitment Paragraph
            wsData.push([`I, ${employee.name.toUpperCase()}, ${employee.position} of the ${employee.department} Division, commit to deliver and agree to be rated on the attainment of the following targets in accordance with the indicated measures for the period ${period}.`])
            wsData.push([])

            // Ratee Signature Line (Right Aligned in template)
            wsData.push(["", "", "", "", "", "", "", `Ratee: ${employee.name.toUpperCase()}`])
            wsData.push(["", "", "", "", "", "", "", `Date: ${new Date().toLocaleDateString()}`])
            wsData.push([])

            // Review / Approval Box (Top of Table)
            // Row 10
            wsData.push(["Reviewed by:", "", "", "Date", "Approved by:", "", "", "Date"])
            // Row 11 (Signatories)
            wsData.push([
                supervisor.name.toUpperCase(), "", "", "",
                head.name.toUpperCase(), "", "", ""
            ])
            // Row 12 (Positions)
            wsData.push(["Immediate Supervisor", "", "", "", "Provincial Assessor", "", "", ""])
            wsData.push([])

            // --- MAIN TABLE HEADER ---
            // Row 14
            wsData.push([
                "MFO / PAP",
                "SUCCESS INDICATORS\n(Targets + Measures)",
                "Actual Accomplishments",
                "Rating", "", "", "", // Merged Rating Header
                "Remarks"
            ])
            // Row 15 (Sub-headers for Rating)
            wsData.push([
                "", "", "", "Q", "E", "T", "A", ""
            ])

            // Helper for Rows
            const addCategoryRows = (categoryDisplay: string, categoryKey: string) => {
                const categoryTargets = targets.filter((t: any) => t.category === categoryKey)
                if (categoryTargets.length > 0) {
                    // Category Header
                    wsData.push([categoryDisplay, "", "", "", "", "", "", ""])

                    // Targets
                    categoryTargets.forEach((t: any) => {
                        wsData.push([
                            t.mfo,
                            t.indicators,
                            t.actual_accomplishment || '',
                            t.q || '',
                            t.e || '',
                            t.t || '',
                            t.a ? Number(t.a).toFixed(2) : '',
                            t.remarks || ''
                        ])
                    })
                }
            }

            addCategoryRows("Strategic Priorities", "strategic")
            addCategoryRows("Core Functions", "core")
            addCategoryRows("Support Functions", "support")

            // Empty Rows for spacing
            wsData.push(["", "", "", "", "", "", "", ""])

            // Final Average
            wsData.push(["Final Average Rating", "", "", "", "", "", final_rating ? Number(final_rating).toFixed(2) : '', adjectival_rating || ''])

            // Comments Box
            wsData.push([])
            wsData.push(["Comments and Recommendations for Development Purposes:"])
            wsData.push(["", "", "", "", "", "", "", ""]) // Empty space for comments
            wsData.push(["", "", "", "", "", "", "", ""])

            // --- SIGNATURES FOOTER ---
            wsData.push([])
            wsData.push(["Discussed with:", "Date", "Assessed by:", "Date", "Final Rating by:", "Date"])
            wsData.push([
                employee.name.toUpperCase(), "",
                supervisor.name.toUpperCase(), "",
                head.name.toUpperCase(), ""
            ])
            wsData.push(["Ratee", "", "Immediate Supervisor", "", "Provincial Assessor", ""])


            // --- CREATE SHEET ---
            const ws = XLSX.utils.aoa_to_sheet(wsData)

            // --- MERGES ---
            // Note: Indexes are 0-based.
            ws['!merges'] = [
                // Header Titles
                { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Republic...
                { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Office...
                { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }, // LGU...
                { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } }, // IPCR Title
                { s: { r: 6, c: 0 }, e: { r: 6, c: 7 } }, // Paragraph

                // Review Box (Top)
                { s: { r: 10, c: 0 }, e: { r: 10, c: 2 } }, // Reviewed by label merge
                { s: { r: 10, c: 4 }, e: { r: 10, c: 6 } }, // Approved by label merge
                { s: { r: 11, c: 0 }, e: { r: 11, c: 2 } }, // Supervisor Name
                { s: { r: 11, c: 4 }, e: { r: 11, c: 6 } }, // Head Name
                { s: { r: 12, c: 0 }, e: { r: 12, c: 2 } }, // Supervisor Title
                { s: { r: 12, c: 4 }, e: { r: 12, c: 6 } }, // Head Title

                // Table Headers
                { s: { r: 14, c: 0 }, e: { r: 15, c: 0 } }, // MFO (Vertical Merge)
                { s: { r: 14, c: 1 }, e: { r: 15, c: 1 } }, // Indicators
                { s: { r: 14, c: 2 }, e: { r: 15, c: 2 } }, // Accomplishments
                { s: { r: 14, c: 3 }, e: { r: 14, c: 6 } }, // Rating (Horizontal Merge Q-A)
                { s: { r: 14, c: 7 }, e: { r: 15, c: 7 } }, // Remarks

                // Comments Box
                { s: { r: wsData.length - 8, c: 0 }, e: { r: wsData.length - 8, c: 7 } }, // Title
                { s: { r: wsData.length - 7, c: 0 }, e: { r: wsData.length - 6, c: 7 } }, // Box content
            ]

            // Column Widths
            ws['!cols'] = [
                { wch: 30 }, // MFO
                { wch: 40 }, // Indicators
                { wch: 40 }, // Accomp
                { wch: 5 },  // Q
                { wch: 5 },  // E
                { wch: 5 },  // T
                { wch: 8 },  // A
                { wch: 20 }, // Remarks
                { wch: 10 }, // Date col
            ]

            XLSX.utils.book_append_sheet(wb, ws, "IPCR")
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' })
            saveAs(blob, `IPCR_${employee.name.replace(/\s+/g, '_')}_${period}_Template.xlsx`)

        } catch (err) {
            console.error("Excel download failed", err)
            alert("Failed to generate Excel file.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 bg-green-50 text-green-700 hover:text-green-800 hover:bg-green-100 border-green-200"
        >
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating Excel...</span>
                </>
            ) : (
                <>
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Download Excel</span>
                </>
            )}
        </Button>
    )
}
