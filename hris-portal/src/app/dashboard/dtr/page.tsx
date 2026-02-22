import { getEmployeeRoster } from '@/app/actions/dtr'
import { createClient } from '@/utils/supabase/server'
import { isProjectStaff, isDivisionChief, isHRManager, Role } from '@/lib/roles'
import { redirect } from 'next/navigation'
import PageContainer from '@/components/layout/page-container'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'

import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Daily Time Record | PAO HRMS'
}

export default async function DTRPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    const role = profile.role as Role

    if (isProjectStaff(role)) {
        redirect('/dashboard/dtr/me')
    }

    const result = await getEmployeeRoster()
    if (!result.success) {
        if (result.error === 'Forbidden') {
            redirect('/dashboard/dtr/me')
        }
    }

    const rosterGrouped = result.data || {}

    function getInitials(name: string) {
        if (!name) return '?'
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    return (
        <PageContainer title="Daily Time Record" description="Manage employee attendance">
            <div className="space-y-6">
                {/* We can't do interactive search on server component easily without client wrapper, 
            so we'll just display it grouped. 
            For true search, we'd extract it to a client component.
            For now, we'll keep it simple as requested or wrap it. 
            Let's build the layout as specified. */}

                {Object.entries(rosterGrouped).map(([division, employees]: [string, any]) => (
                    <div key={division} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800 uppercase tracking-wider text-sm">
                                {division}
                            </h3>
                            <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                                {employees.length} {employees.length === 1 ? 'employee' : 'employees'}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                            {employees.map((emp: any) => (
                                <div key={emp.id} className="border rounded-lg p-4 flex flex-col justify-between hover:border-[#1E3A5F] transition-colors bg-white">
                                    <div className="flex items-start gap-3 mb-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-[#1E3A5F]/10 text-[#1E3A5F] font-semibold text-xs">
                                                {getInitials(emp.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate" title={emp.full_name}>
                                                {emp.full_name}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate" title={emp.position}>
                                                {emp.position}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t flex justify-end">
                                        <Link
                                            href={`/dashboard/dtr/${emp.id}`}
                                            className="text-sm font-medium text-[#1E3A5F] hover:underline"
                                        >
                                            {isHRManager(role) ? 'View DTR →' : 'View Only →'}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(rosterGrouped).length === 0 && (
                    <EmptyState
                        icon={Search}
                        title="No employees found"
                        description="There are currently no staff registered in the system."
                    />
                )}
            </div>
        </PageContainer>
    )
}
