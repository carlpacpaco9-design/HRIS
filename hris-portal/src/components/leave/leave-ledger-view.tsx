'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LedgerEntry {
    period: string
    particulars: string
    vl_earned: number | null
    vl_taken: number | null
    vl_balance: number
    sl_earned: number | null
    sl_taken: number | null
    sl_balance: number
}

interface LeaveLedgerViewProps {
    employeeName: string
    entries: LedgerEntry[]
}

/**
 * LeaveLedgerView (CSC Form No. 1 - Leave Card)
 * Renders the official cumulative leave history of an employee.
 */
export function LeaveLedgerView({ employeeName, entries }: LeaveLedgerViewProps) {
    return (
        <Card className="w-full shadow-none border-none print:m-0">
            <CardHeader className="text-center pb-8">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-black uppercase">Leave Card (CSC Form 1)</CardTitle>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Provincial Assessor's Office - Ilocos Sur</p>
                </div>
                <div className="mt-6 border-b-2 border-dashed border-primary/20 pb-4">
                    <h2 className="text-2xl font-black underline decoration-primary/30 uppercase">{employeeName}</h2>
                    <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Name of Employee</p>
                </div>
            </CardHeader>

            <CardContent>
                <div className="overflow-x-auto border-2 border-black/10 rounded-sm">
                    <table className="w-full text-left border-collapse font-serif leading-tight">
                        <thead>
                            <tr className="bg-muted/50 border-b border-black/20">
                                <th rowSpan={2} className="p-2 border-r border-black/20 text-[10px] font-black uppercase text-center w-32">Period</th>
                                <th rowSpan={2} className="p-2 border-r border-black/20 text-[10px] font-black uppercase text-center">Particulars</th>
                                <th colSpan={3} className="p-1 border-b border-r border-black/20 text-[10px] font-black uppercase text-center bg-blue-50/50">Vacation Leave</th>
                                <th colSpan={3} className="p-1 border-b border-r border-black/20 text-[10px] font-black uppercase text-center bg-orange-50/50">Sick Leave</th>
                                <th rowSpan={2} className="p-2 text-[10px] font-black uppercase text-center w-24">Date Actioned</th>
                            </tr>
                            <tr className="bg-muted/30 border-b border-black/20">
                                <th className="p-1 border-r border-black/20 text-[9px] font-bold text-center">Earned</th>
                                <th className="p-1 border-r border-black/20 text-[9px] font-bold text-center">Taken</th>
                                <th className="p-1 border-r border-black/20 text-[9px] font-bold text-center">Balance</th>
                                <th className="p-1 border-r border-black/20 text-[9px] font-bold text-center">Earned</th>
                                <th className="p-1 border-r border-black/20 text-[9px] font-bold text-center">Taken</th>
                                <th className="p-1 border-r border-black/20 text-[9px] font-bold text-center">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 text-[11px]">
                            {entries.map((entry, idx) => (
                                <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                    <td className="p-2 border-r border-black/20 font-bold text-center">{entry.period}</td>
                                    <td className="p-2 border-r border-black/20 italic">{entry.particulars}</td>
                                    <td className="p-2 border-r border-black/20 text-center text-blue-700">{entry.vl_earned?.toFixed(3) || '---'}</td>
                                    <td className="p-2 border-r border-black/20 text-center text-red-600">{entry.vl_taken?.toFixed(3) || '---'}</td>
                                    <td className="p-2 border-r border-black/20 text-center font-black bg-blue-50/20">{entry.vl_balance.toFixed(3)}</td>
                                    <td className="p-2 border-r border-black/20 text-center text-orange-700">{entry.sl_earned?.toFixed(3) || '---'}</td>
                                    <td className="p-2 border-r border-black/20 text-center text-red-600">{entry.sl_taken?.toFixed(3) || '---'}</td>
                                    <td className="p-2 border-r border-black/20 text-center font-black bg-orange-50/20">{entry.sl_balance.toFixed(3)}</td>
                                    <td className="p-2 text-center text-[9px] text-muted-foreground italic">System Log</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* SUMMARY FOOTER */}
                <div className="mt-8 flex justify-end gap-12 print:hidden">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-black text-muted-foreground mr-1 mb-1">Total VL Standing</p>
                        <Badge variant="secondary" className="text-xl px-4 py-1 font-black bg-blue-100 text-blue-800">
                            {entries[entries.length - 1]?.vl_balance.toFixed(3) || '0.000'}
                        </Badge>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-black text-muted-foreground mr-1 mb-1">Total SL Standing</p>
                        <Badge variant="secondary" className="text-xl px-4 py-1 font-black bg-orange-100 text-orange-800">
                            {entries[entries.length - 1]?.sl_balance.toFixed(3) || '0.000'}
                        </Badge>
                    </div>
                </div>

                <div className="mt-12 hidden print:flex justify-between items-end border-t border-black/10 pt-8">
                    <div className="text-center min-w-[200px]">
                        <div className="border-b border-black mb-1"></div>
                        <p className="text-[9px] uppercase font-bold">In-Charge of Personnel</p>
                    </div>
                    <div className="text-center min-w-[200px]">
                        <p className="font-bold text-xs uppercase underline decoration-1">Lourdes L. Alcausin, REA</p>
                        <p className="text-[9px] uppercase">Provincial Assessor</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
