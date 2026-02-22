'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MonthlyForm48View } from '@/components/dtr/monthly-form48-view'
import { Card, CardContent } from '@/components/ui/card'
import { Users, FileText, Search } from 'lucide-react'

interface StaffMember {
    id: string
    full_name: string
    employee_number: string | null
}

/**
 * AdminAttendanceDashboard
 * Central control for reviewing and printing staff Form 48s.
 */
export function AdminAttendanceDashboard() {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [selectedStaffId, setSelectedStaffId] = useState<string>('')
    const [selectedMonth, setSelectedMonth] = useState<string>(
        new Date().toISOString().substring(0, 7) // Default to current YYYY-MM
    )
    const [isLoadingRoster, setIsLoadingRoster] = useState(true)

    // 1. Fetch Roster once on mount
    useEffect(() => {
        async function loadRoster() {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('profiles') // Using profiles as it is the primary auth-linked staff table
                .select('id, full_name, employee_number')
                .order('full_name')

            if (!error && data) {
                setStaff(data as StaffMember[])
            }
            setIsLoadingRoster(false)
        }
        loadRoster()
    }, [])

    const selectedStaffName = useMemo(() => {
        return staff.find(s => s.id === selectedStaffId)?.full_name || 'Select Staff'
    }, [staff, selectedStaffId])

    return (
        <div className="space-y-8 pb-20">
            {/* SELECTION CONTROLS (Hidden when printing) */}
            <Card className="print:hidden shadow-sm border-dashed bg-muted/30">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <Users className="w-3 h-3" />
                                Select Individual Staff
                            </Label>
                            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Search for staff member..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {staff.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.full_name} {member.employee_number ? `(${member.employee_number})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                                <FileText className="w-3 h-3" />
                                Select Reporting Period
                            </Label>
                            <Input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* FORM 48 VIEW */}
            {selectedStaffId ? (
                <MonthlyForm48View
                    employeeId={selectedStaffId}
                    employeeName={selectedStaffName}
                    yearMonth={selectedMonth}
                />
            ) : (
                <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-3xl opacity-40">
                    <Search className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-bold">Waiting for Selection</h3>
                    <p className="max-w-xs text-center text-sm">
                        Select a staff member and month above to generate the official Form 48 for review.
                    </p>
                </div>
            )}
        </div>
    )
}
