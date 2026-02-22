'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronRight, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface StaffMember {
    id: string
    full_name: string
    position: string | null
    division: string | null
    employee_number: string | null
    is_active: boolean
}

interface AdminDTRViewProps {
    staff: StaffMember[]
    currentUser: { id: string, full_name: string, role?: string }
}

export function AdminDTRView({
    staff, currentUser
}: AdminDTRViewProps) {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [divisionFilter, setDivisionFilter] = useState('all')

    // Get unique divisions
    const divisions = useMemo(() => {
        const d = [...new Set(
            staff.map(e => e.division)
                .filter(Boolean)
        )].sort()
        return d as string[]
    }, [staff])

    // Filter staff
    const filtered = useMemo(() => {
        return staff.filter(e => {
            const matchSearch =
                e.full_name.toLowerCase().includes(search.toLowerCase()) ||
                e.position?.toLowerCase().includes(search.toLowerCase()) ||
                e.employee_number?.toLowerCase().includes(search.toLowerCase())
            const matchDiv =
                divisionFilter === 'all' ||
                e.division === divisionFilter
            return matchSearch && matchDiv
        })
    }, [staff, search, divisionFilter])

    // Group by division
    const grouped = useMemo(() => {
        return filtered.reduce((acc, s) => {
            const div = s.division ?? 'No Division Assigned'
            if (!acc[div]) acc[div] = []
            acc[div].push(s)
            return acc
        }, {} as Record<string, typeof staff>)
    }, [filtered])

    return (
        <div className="space-y-6">

            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Daily Time Records
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Select a staff member to manage their attendance records
                    </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                    Administrative View
                </Badge>
            </div>

            {/* Search + filter bar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search staff member..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={divisionFilter}
                    onValueChange={setDivisionFilter}
                >
                    <SelectTrigger className="w-56">
                        <SelectValue placeholder="All Divisions" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            All Divisions
                        </SelectItem>
                        {divisions.map(d => (
                            <SelectItem key={d} value={d}>
                                {d}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                    {filtered.length} staff members
                </p>
            </div>

            {/* Employee list grouped by division */}
            <div className="space-y-8">
                {Object.entries(grouped).map(([division, emps]) => (
                    <div key={division}>
                        {/* Division header */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                {division}
                            </span>
                            <div className="h-px flex-1 bg-border" />
                        </div>

                        {/* Staff cards grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {emps.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => router.push(`/dashboard/dtr/${s.id}`)}
                                    className="
                    flex items-center gap-3
                    p-4 rounded-lg border
                    border-border bg-card
                    hover:border-primary/40
                    hover:bg-muted/30
                    hover:shadow-sm
                    transition-all duration-150
                    text-left w-full group
                  "
                                >
                                    {/* Avatar */}
                                    <div className="
                    w-10 h-10 rounded-full
                    bg-primary/10
                    flex items-center
                    justify-center shrink-0
                  ">
                                        <span className="text-sm font-semibold text-primary">
                                            {s.full_name
                                                .split(' ')
                                                .map((n: string) => n[0])
                                                .slice(0, 2)
                                                .join('')
                                            }
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                            {s.full_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {s.position ?? 'No position set'}
                                        </p>
                                        {s.employee_number && (
                                            <p className="text-xs text-muted-foreground/70">
                                                #{s.employee_number}
                                            </p>
                                        )}
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight className="
                    w-4 h-4 shrink-0
                    text-muted-foreground/40
                    group-hover:text-primary
                    transition-colors
                  " />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                        No staff members found
                    </p>
                </div>
            )}
        </div>
    )
}
