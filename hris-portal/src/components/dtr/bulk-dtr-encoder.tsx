'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Save, Clock, Trash2, Calendar, ClipboardCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

/**
 * TECHNICAL CONSTRAINTS: 
 * - Language: TypeScript (Strict mode)
 * - State Management: Local React state for grid data
 * - Performance: useCallback for input handlers
 * - UX: Keyboard-only navigation via native input elements
 */

interface Employee {
    id: string
    full_name: string
    employee_number: string | null
}

interface DtrRecord {
    employee_id: string
    full_name: string // Stored for display convenience in state
    am_in: string
    am_out: string
    pm_in: string
    pm_out: string
    remarks: string
}

interface BulkDtrEncoderProps {
    employees: Employee[]
}

const STANDARD_AM_IN = "08:00"
const STANDARD_AM_OUT = "12:00"
const STANDARD_PM_IN = "13:00"
const STANDARD_PM_OUT = "17:00"

export function BulkDtrEncoder({ employees }: BulkDtrEncoderProps) {
    // 1. STATE MANAGEMENT
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0] || ''
    )
    const [isSaving, setIsSaving] = useState(false)

    // Initialize grid data from employees list
    const [gridData, setGridData] = useState<DtrRecord[]>(() =>
        employees.map(emp => ({
            employee_id: emp.id,
            full_name: emp.full_name,
            am_in: '',
            am_out: '',
            pm_in: '',
            pm_out: '',
            remarks: ''
        }))
    )

    // 2. INPUT HANDLERS (Optimized with useCallback)
    const handleCellChange = useCallback((
        index: number,
        field: keyof DtrRecord,
        value: string
    ) => {
        setGridData(prev => {
            const next = [...prev]
            const row = next[index]
            if (row) {
                next[index] = { ...row, [field]: value }
            }
            return next
        })
    }, [])

    // 3. BULK ACTIONS
    const applyStandardHours = useCallback(() => {
        setGridData(prev => prev.map(row => ({
            ...row,
            am_in: STANDARD_AM_IN,
            am_out: STANDARD_AM_OUT,
            pm_in: STANDARD_PM_IN,
            pm_out: STANDARD_PM_OUT
        })))
        toast.success("Standard 8-5 hours applied to all rows")
    }, [])

    const clearGrid = useCallback(() => {
        setGridData(prev => prev.map(row => ({
            ...row,
            am_in: '',
            am_out: '',
            pm_in: '',
            pm_out: '',
            remarks: ''
        })))
    }, [])

    // 4. SUBMIT ACTION (Simulated Database Commit)
    const handleCommit = async () => {
        setIsSaving(true)
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500))

            const payload = {
                date: selectedDate,
                records: gridData,
                timestamp: new Date().toISOString()
            }

            console.log("Committing Payload to Supabase:", payload)
            toast.success(`Successfully encoded ${gridData.length} records for ${selectedDate}`)
        } catch (error) {
            toast.error("Failed to commit records to database")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Card className="w-full shadow-xl border-t-4 border-t-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardCheck className="w-6 h-6 text-primary" />
                        Bulk DTR Encoder
                    </CardTitle>
                    <CardDescription>
                        High-speed daily transcription for paper logbooks
                    </CardDescription>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="log-date" className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                            Logbook Date
                        </label>
                        <Input
                            id="log-date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-44 font-medium"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={applyStandardHours}
                        className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                        <Clock className="w-4 h-4" />
                        Apply Standard (8-5)
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={clearGrid}
                        className="text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {/* SPREADSHEET INTERFACE */}
                <div className="relative overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                            <tr>
                                <th className="px-4 py-3 border-b border-r w-64">Employee Name</th>
                                <th className="px-4 py-3 border-b border-r text-center">AM IN</th>
                                <th className="px-4 py-3 border-b border-r text-center">AM OUT</th>
                                <th className="px-4 py-3 border-b border-r text-center">PM IN</th>
                                <th className="px-4 py-3 border-b border-r text-center">PM OUT</th>
                                <th className="px-4 py-3 border-b">Remarks / Leave</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {gridData.map((row, idx) => (
                                <tr key={row.employee_id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-4 py-2 border-r font-medium text-gray-700 truncate">
                                        {row.full_name}
                                    </td>

                                    {/* AM IN */}
                                    <td className="p-0 border-r">
                                        <input
                                            type="time"
                                            value={row.am_in}
                                            onChange={(e) => handleCellChange(idx, 'am_in', e.target.value)}
                                            aria-label={`AM In for ${row.full_name}`}
                                            className="w-full p-2.5 bg-transparent focus:ring-2 focus:ring-primary focus:outline-none transition-all text-center"
                                        />
                                    </td>

                                    {/* AM OUT */}
                                    <td className="p-0 border-r">
                                        <input
                                            type="time"
                                            value={row.am_out}
                                            onChange={(e) => handleCellChange(idx, 'am_out', e.target.value)}
                                            aria-label={`AM Out for ${row.full_name}`}
                                            className="w-full p-2.5 bg-transparent focus:ring-2 focus:ring-primary focus:outline-none transition-all text-center"
                                        />
                                    </td>

                                    {/* PM IN */}
                                    <td className="p-0 border-r">
                                        <input
                                            type="time"
                                            value={row.pm_in}
                                            onChange={(e) => handleCellChange(idx, 'pm_in', e.target.value)}
                                            aria-label={`PM In for ${row.full_name}`}
                                            className="w-full p-2.5 bg-transparent focus:ring-2 focus:ring-primary focus:outline-none transition-all text-center"
                                        />
                                    </td>

                                    {/* PM OUT */}
                                    <td className="p-0 border-r">
                                        <input
                                            type="time"
                                            value={row.pm_out}
                                            onChange={(e) => handleCellChange(idx, 'pm_out', e.target.value)}
                                            aria-label={`PM Out for ${row.full_name}`}
                                            className="w-full p-2.5 bg-transparent focus:ring-2 focus:ring-primary focus:outline-none transition-all text-center"
                                        />
                                    </td>

                                    {/* REMARKS */}
                                    <td className="p-0">
                                        <input
                                            type="text"
                                            placeholder="e.g. On Leave, Field Work"
                                            value={row.remarks}
                                            onChange={(e) => handleCellChange(idx, 'remarks', e.target.value)}
                                            aria-label={`Remarks for ${row.full_name}`}
                                            className="w-full p-2.5 bg-transparent focus:ring-2 focus:ring-primary focus:outline-none transition-all outline-none"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 flex justify-end items-center gap-4">
                    <p className="text-xs text-muted-foreground italic font-medium">
                        Pro Tip: Use <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px] font-sans">Tab</kbd> to fly through cells
                    </p>
                    <Button
                        size="lg"
                        onClick={handleCommit}
                        disabled={isSaving}
                        className="min-w-[200px] shadow-lg hover:shadow-primary/25 transition-all"
                    >
                        {isSaving ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Encrypting & Committing...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Commit to Database
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
