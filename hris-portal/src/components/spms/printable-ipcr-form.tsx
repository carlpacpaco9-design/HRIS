'use client'

import React from 'react'
import { Printer, Download, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { IpcrTarget, IpcrCategory } from './ipcr-target-form'

interface PrintableIpcrFormProps {
    data: {
        id: string
        status: string
        final_average_rating: number | null
        adjectival_rating: string | null
        profiles: {
            full_name: string
            position: string
            division: string
        }
        ipcr_periods: {
            year: number
            semester: number
        }
        ipcr_targets: IpcrTarget[]
    }
    onBack?: () => void
}

/**
 * PrintableIpcrForm Component
 * Generates the official CSC IPCR document format for printing.
 */
export function PrintableIpcrForm({ data, onBack }: PrintableIpcrFormProps) {
    const { profiles, ipcr_periods, ipcr_targets, final_average_rating, adjectival_rating } = data
    const semesterText = ipcr_periods.semester === 1 ? 'January to June' : 'July to December'

    const categories: IpcrCategory[] = ['Strategic', 'Core', 'Support']

    const renderCategoryRows = (category: IpcrCategory) => {
        const targets = ipcr_targets.filter(t => t.category === category)
        if (targets.length === 0) return null

        return (
            <>
                <tr className="bg-gray-100 font-bold border-t-2 border-black">
                    <td colSpan={7} className="px-4 py-1 text-xs uppercase italic border-black border">
                        {category} Priority / Functions
                    </td>
                </tr>
                {targets.map((target, idx) => {
                    const avg = [target.rating_q, target.rating_e, target.rating_t].filter(v => v > 0)
                    const rowAvg = avg.length > 0 ? (avg.reduce((a, b) => a + b, 0) / avg.length).toFixed(2) : ''

                    return (
                        <tr key={target.id || idx} className="break-inside-avoid border-black border">
                            <td className="p-2 border-black border align-top text-[10px] leading-tight">
                                {target.mfo_pap}
                            </td>
                            <td className="p-2 border-black border align-top text-[10px] leading-tight whitespace-pre-wrap">
                                {target.success_indicator}
                            </td>
                            <td className="p-2 border-black border align-top text-[10px] leading-tight italic">
                                {target.actual_accomplishment}
                            </td>
                            <td className="p-1 border-black border text-center align-middle font-bold text-[11px]">
                                {target.rating_q || ''}
                            </td>
                            <td className="p-1 border-black border text-center align-middle font-bold text-[11px]">
                                {target.rating_e || ''}
                            </td>
                            <td className="p-1 border-black border text-center align-middle font-bold text-[11px]">
                                {target.rating_t || ''}
                            </td>
                            <td className="p-1 border-black border text-center align-middle font-bold text-[11px] bg-gray-50">
                                {rowAvg}
                            </td>
                        </tr>
                    )
                })}
            </>
        )
    }

    return (
        <div className="min-h-screen bg-muted/20 p-4 md:p-8 flex justify-center">
            {/* Print-specific CSS */}
            <style jsx global>{`
        @media print {
          @page {
            size: legal landscape;
            margin: 0.5in;
          }
          body {
            background: white !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

            <div className="w-full max-w-[14in] bg-white shadow-2xl p-[0.75in] border-black/5 rounded-sm relative selection:bg-primary/10">
                {/* ACTION BAR (Hidden on Print) */}
                <div className="no-print absolute top-4 left-4 right-4 flex justify-between gap-4">
                    <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Download PDF
                        </Button>
                        <Button onClick={() => window.print()} className="gap-2 bg-primary">
                            <Printer className="w-4 h-4" />
                            Print IPCR
                        </Button>
                    </div>
                </div>

                {/* DOCUMENT HEADER */}
                <div className="text-center space-y-1 mb-6">
                    <h1 className="text-sm font-black uppercase">Individual Performance Commitment and Review (IPCR)</h1>
                    <p className="text-[11px] mt-4 max-w-4xl mx-auto italic leading-normal">
                        I, <span className="font-bold underline decoration-dotted">{profiles.full_name}</span>,
                        <span className="font-bold underline decoration-dotted ml-1">{profiles.position}</span> of the
                        <span className="font-bold px-1 uppercase">Provincial Assessor's Office</span>, Provincial Government of Ilocos Sur
                        commit to deliver and agree to be rated on the attainment of the following targets in accordance with the indicated
                        measures for the period <span className="font-bold uppercase underline">{semesterText}, {ipcr_periods.year}</span>.
                    </p>
                </div>

                {/* DATA TABLE */}
                <table className="w-full border-collapse border-2 border-black table-fixed">
                    <thead>
                        <tr className="border-black border bg-gray-50">
                            <th rowSpan={2} className="w-[18%] border-black border p-2 text-[10px] uppercase font-black text-center">MFO / PAP</th>
                            <th rowSpan={2} className="w-[25%] border-black border p-2 text-[10px] uppercase font-black text-center">Success Indicators</th>
                            <th rowSpan={2} className="w-[25%] border-black border p-2 text-[10px] uppercase font-black text-center">Actual Accomplishments</th>
                            <th colSpan={4} className="w-[32%] border-black border p-1 text-[10px] uppercase font-black text-center">Rating</th>
                        </tr>
                        <tr className="border-black border bg-gray-50">
                            <th className="w-[7%] border-black border p-1 text-[9px] uppercase font-bold text-center">Q</th>
                            <th className="w-[7%] border-black border p-1 text-[9px] uppercase font-bold text-center">E</th>
                            <th className="w-[7%] border-black border p-1 text-[9px] uppercase font-bold text-center">T</th>
                            <th className="w-[11%] border-black border p-1 text-[9px] uppercase font-bold text-center">Average</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(cat => renderCategoryRows(cat))}

                        {/* TOTALS / ADJECTIVAL RATING */}
                        <tr className="border-t-2 border-black bg-gray-50">
                            <td colSpan={6} className="px-4 py-2 text-right text-[11px] font-black uppercase border-black border">
                                Final Average Rating
                            </td>
                            <td className="p-2 border-black border text-center font-black text-sm bg-primary/5">
                                {final_average_rating?.toFixed(2) || '---'}
                            </td>
                        </tr>
                        <tr className="border-black border bg-gray-100">
                            <td colSpan={6} className="px-4 py-2 text-right text-[11px] font-black uppercase border-black border italic">
                                Adjectival Rating
                            </td>
                            <td className="p-2 border-black border text-center font-black text-sm tracking-widest uppercase underline decoration-2 underline-offset-4">
                                {adjectival_rating || '---'}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* SIGNATORY BLOCK */}
                <div className="mt-12 grid grid-cols-4 gap-4 text-center break-inside-avoid">
                    {/* RATEE */}
                    <div className="space-y-4">
                        <p className="text-[10px] uppercase text-left font-bold">Ratee:</p>
                        <div className="pt-8 px-2">
                            <p className="font-black text-xs uppercase underline decoration-1 underline-offset-2">{profiles.full_name}</p>
                            <p className="text-[9px] text-muted-foreground uppercase mt-1">Employee / Position</p>
                            <p className="text-[9px] mt-4 flex justify-between border-t border-black/20 pt-1">
                                <span>Date:</span>
                                <span className="w-24 border-b border-black"></span>
                            </p>
                        </div>
                    </div>

                    {/* SUPERVISOR */}
                    <div className="space-y-4">
                        <p className="text-[10px] uppercase text-left font-bold">Discussed with:</p>
                        <div className="pt-8 px-2">
                            <div className="min-h-[14px] border-b border-black mb-1"></div>
                            <p className="text-[9px] text-muted-foreground uppercase mt-1">Immediate Supervisor</p>
                            <p className="text-[9px] mt-4 flex justify-between border-t border-black/20 pt-1">
                                <span>Date:</span>
                                <span className="w-24 border-b border-black"></span>
                            </p>
                        </div>
                    </div>

                    {/* ASSESSMENT */}
                    <div className="space-y-4">
                        <p className="text-[10px] uppercase text-left font-bold">Assessed by:</p>
                        <div className="pt-8 px-2 text-center">
                            <p className="font-bold text-[11px] uppercase underline decoration-1 underline-offset-2">Lourdes L. Alcausin, REA</p>
                            <p className="text-[9px] text-muted-foreground uppercase mt-1">Provincial Assessor</p>
                            <p className="text-[9px] mt-4 flex justify-between border-t border-black/20 pt-1">
                                <span>Date:</span>
                                <span className="w-24 border-b border-black"></span>
                            </p>
                        </div>
                    </div>

                    {/* FINAL RATING */}
                    <div className="space-y-4">
                        <p className="text-[10px] uppercase text-left font-bold">Final Rating by:</p>
                        <div className="pt-8 px-2 text-center">
                            <p className="font-bold text-[11px] uppercase underline decoration-1 underline-offset-2">Jeremias C. Singson</p>
                            <p className="text-[9px] text-muted-foreground uppercase mt-1">Governor</p>
                            <p className="text-[9px] mt-4 flex justify-between border-t border-black/20 pt-1">
                                <span>Date:</span>
                                <span className="w-24 border-b border-black"></span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* FOOTER PAGER */}
                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-[9px] text-muted-foreground italic">
                    <p>Generated via HRIS Portal - Provincial Assessor's Office, Ilocos Sur</p>
                    <p>Sheet 1 of 1</p>
                </div>
            </div>
        </div>
    )
}
