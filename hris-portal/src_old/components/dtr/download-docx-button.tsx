'use client'

import React from 'react'
import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    WidthType,
    AlignmentType,
    TextRun,
    BorderStyle,
    VerticalAlign
} from 'docx'
import { saveAs } from 'file-saver'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface DTRRecord {
    day: string | number;
    am_in?: string;
    am_out?: string;
    pm_in?: string;
    pm_out?: string;
    remarks?: string;
    status?: string;
    isWeekend?: boolean;
}

interface DownloadDocxButtonProps {
    staffName: string;
    month: string;
    year: string;
    records: DTRRecord[];
}

export function DownloadDTRButton({ staffName, month, year, records }: DownloadDocxButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const generateDocx = async () => {
        setIsGenerating(true)
        try {
            const tableHeaders = [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: "Day", alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [new Paragraph({ text: "A.M. Arrival", alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [new Paragraph({ text: "A.M. Departure", alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [new Paragraph({ text: "P.M. Arrival", alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [new Paragraph({ text: "P.M. Departure", alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [new Paragraph({ text: "Undertime (Hours)", alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                        new TableCell({ children: [new Paragraph({ text: "Undertime (Minutes)", alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                    ],
                    tableHeader: true,
                }),
            ]

            const dataRows = records.map(record => {
                const isNonWork = record.status && record.status !== "Regular"

                return new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ text: record.day.toString(), alignment: AlignmentType.CENTER })],
                            verticalAlign: VerticalAlign.CENTER
                        }),
                        // If it's a holiday or leave, show that text instead of times
                        new TableCell({
                            children: [new Paragraph({ text: isNonWork ? record.status! : (record.am_in || ""), alignment: AlignmentType.CENTER })],
                            columnSpan: isNonWork ? 4 : 1,
                            verticalAlign: VerticalAlign.CENTER
                        }),
                        ...(isNonWork ? [] : [
                            new TableCell({ children: [new Paragraph({ text: record.am_out || "", alignment: AlignmentType.CENTER })] }),
                            new TableCell({ children: [new Paragraph({ text: record.pm_in || "", alignment: AlignmentType.CENTER })] }),
                            new TableCell({ children: [new Paragraph({ text: record.pm_out || "", alignment: AlignmentType.CENTER })] }),
                        ]),
                        new TableCell({ children: [new Paragraph({ text: "", alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: "", alignment: AlignmentType.CENTER })] }),
                    ],
                })
            })

            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "Civil Service Form No. 48", size: 16 })],
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: "DAILY TIME RECORD", bold: true, size: 28 })],
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 200, after: 100 },
                        }),
                        new Paragraph({
                            text: "-----o0o-----",
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Name: ", bold: true }),
                                new TextRun({ text: staffName.toUpperCase(), underline: {} }),
                            ],
                            spacing: { after: 200 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "For the month of: ", bold: true }),
                                new TextRun({ text: `${month} ${year}`, underline: {} }),
                            ],
                            spacing: { after: 400 },
                        }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [...tableHeaders, ...dataRows],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "I certify on my honor that the above is a true and correct report of the attendance or service of the above-named person, made by himself/herself daily at the time of arrival and departure from office.",
                                    italics: true,
                                    size: 18
                                })
                            ],
                            spacing: { before: 400, after: 600 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "____________________________________", bold: true }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: "Signature of Staff", size: 18 })],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 600 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "VERIFIED as to the prescribed office hours:", size: 18 }),
                            ],
                            spacing: { after: 400 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "ENGR. CARL PACPACO", bold: true, underline: {} }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: "Provincial Assessor / Supervisor", size: 18 })],
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                }],
            })

            const blob = await Packer.toBlob(doc)
            saveAs(blob, `DTR_${staffName.replace(/\s+/g, '_')}_${month}_${year}.docx`)
            setIsGenerating(false)
            setIsGenerating(false)
        } catch (error) {
            console.error("Docx Generation Error:", error)
            setIsGenerating(false)
        }
    }

    return (
        <Button
            onClick={generateDocx}
            disabled={isGenerating}
            variant="outline"
            className="border-slate-200 hover:bg-slate-50 gap-2"
        >
            {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : (
                <FileText className="h-4 w-4 text-blue-600" />
            )}
            Download Word (.docx)
        </Button>
    )
}
