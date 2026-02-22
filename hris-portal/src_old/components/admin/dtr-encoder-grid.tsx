'use client'

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { upsertDTRLog } from "@/app/actions/dtr-admin"
import { format } from "date-fns"
import { Loader2, Save } from "lucide-react"

export function DTREncoderGrid({
    userId,
    initialData,
    month,
    year,
    readOnly
}: {
    userId: string,
    initialData: any[],
    month: number,
    year: number,
    readOnly?: boolean
}) {
    const [data, setData] = useState(initialData)
    const [saving, setSaving] = useState<string | null>(null) // row-field identifier

    const handleBlur = async (date: string, field: string, value: string) => {
        const id = `${date}-${field}`
        setSaving(id)

        const res = await upsertDTRLog(userId, date, field, value)

        setSaving(null)
        if (res.error) {
            toast.error(`Failed to save ${field}: ${res.error}`)
        }
    }

    const handleChange = (index: number, field: string, value: string) => {
        const newData = [...data]
        if (!newData[index].logs) {
            newData[index].logs = {}
        }

        // Map UI field names to DB names for the internal state update
        const dbFieldMap: Record<string, string> = {
            'am_arrival': 'am_in',
            'am_departure': 'am_out',
            'pm_arrival': 'pm_in',
            'pm_departure': 'pm_out',
            'remarks': 'remarks'
        }
        const dbField = dbFieldMap[field] || field

        newData[index].logs[dbField] = value
        setData(newData)
    }

    return (
        <div className="border rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                        <TableHead className="w-16 text-center font-bold">Day</TableHead>
                        <TableHead className="text-center bg-green-50/30 dark:bg-green-900/10">AM In</TableHead>
                        <TableHead className="text-center bg-green-50/30 dark:bg-green-900/10">AM Out</TableHead>
                        <TableHead className="text-center bg-blue-50/30 dark:bg-blue-900/10">PM In</TableHead>
                        <TableHead className="text-center bg-blue-50/30 dark:bg-blue-900/10">PM Out</TableHead>
                        <TableHead>Remarks</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((day, idx) => (
                        <TableRow key={day.date} className="hover:bg-slate-50/50">
                            <TableCell className="text-center font-bold text-slate-500 border-r">
                                {day.day}
                            </TableCell>
                            <TableCell className="p-1">
                                <div className="relative flex justify-center">
                                    {readOnly ? (
                                        <span className="text-sm font-medium text-slate-700 py-1.5 block">{day.logs?.am_in || '-'}</span>
                                    ) : (
                                        <>
                                            <Input
                                                className="border-none focus-visible:ring-1 focus-visible:ring-blue-500 text-center h-9"
                                                value={day.logs?.am_in || ''}
                                                onChange={(e) => handleChange(idx, 'am_arrival', e.target.value)}
                                                onBlur={(e) => handleBlur(day.date, 'am_arrival', e.target.value)}
                                            />
                                            {saving === `${day.date}-am_arrival` && (
                                                <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-blue-500" />
                                            )}
                                        </>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="p-1">
                                <div className="relative flex justify-center">
                                    {readOnly ? (
                                        <span className="text-sm font-medium text-slate-700 py-1.5 block">{day.logs?.am_out || '-'}</span>
                                    ) : (
                                        <>
                                            <Input
                                                className="border-none focus-visible:ring-1 focus-visible:ring-blue-500 text-center h-9"
                                                value={day.logs?.am_out || ''}
                                                onChange={(e) => handleChange(idx, 'am_departure', e.target.value)}
                                                onBlur={(e) => handleBlur(day.date, 'am_departure', e.target.value)}
                                            />
                                            {saving === `${day.date}-am_departure` && (
                                                <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-blue-500" />
                                            )}
                                        </>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="p-1">
                                <div className="relative flex justify-center">
                                    {readOnly ? (
                                        <span className="text-sm font-medium text-slate-700 py-1.5 block">{day.logs?.pm_in || '-'}</span>
                                    ) : (
                                        <>
                                            <Input
                                                className="border-none focus-visible:ring-1 focus-visible:ring-blue-500 text-center h-9"
                                                value={day.logs?.pm_in || ''}
                                                onChange={(e) => handleChange(idx, 'pm_arrival', e.target.value)}
                                                onBlur={(e) => handleBlur(day.date, 'pm_arrival', e.target.value)}
                                            />
                                            {saving === `${day.date}-pm_arrival` && (
                                                <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-blue-500" />
                                            )}
                                        </>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="p-1">
                                <div className="relative flex justify-center">
                                    {readOnly ? (
                                        <span className="text-sm font-medium text-slate-700 py-1.5 block">{day.logs?.pm_out || '-'}</span>
                                    ) : (
                                        <>
                                            <Input
                                                className="border-none focus-visible:ring-1 focus-visible:ring-blue-500 text-center h-9"
                                                value={day.logs?.pm_out || ''}
                                                onChange={(e) => handleChange(idx, 'pm_departure', e.target.value)}
                                                onBlur={(e) => handleBlur(day.date, 'pm_departure', e.target.value)}
                                            />
                                            {saving === `${day.date}-pm_departure` && (
                                                <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-blue-500" />
                                            )}
                                        </>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="p-1">
                                <div className="relative">
                                    {readOnly ? (
                                        <span className="text-xs text-slate-500 px-2 py-1.5 block truncate max-w-[150px]" title={day.logs?.remarks}>{day.logs?.remarks || ''}</span>
                                    ) : (
                                        <>
                                            <Input
                                                className="border-none focus-visible:ring-1 focus-visible:ring-blue-500 h-9 text-xs"
                                                placeholder="..."
                                                value={day.logs?.remarks || ''}
                                                onChange={(e) => handleChange(idx, 'remarks', e.target.value)}
                                                onBlur={(e) => handleBlur(day.date, 'remarks', e.target.value)}
                                            />
                                            {saving === `${day.date}-remarks` && (
                                                <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-blue-500" />
                                            )}
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
