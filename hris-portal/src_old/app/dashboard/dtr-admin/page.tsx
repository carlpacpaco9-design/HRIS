import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Users, Search, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function DTRAdminMasterList() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Verify Admin Role or Administrative Department
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, department')
        .eq('id', user.id)
        .single()

    if (profile?.department !== 'Administrative' && profile?.role !== 'admin_staff' && profile?.role !== 'head_of_office') {
        redirect('/dashboard')
    }

    // Fetch all employees
    const { data: employees, error } = await supabase
        .from('profiles')
        .select('id, full_name, department')
        .order('full_name', { ascending: true })

    return (
        <div className="p-6 pb-24 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">DTR Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Admin encoder for physical Daily Time Records and CSC Form 48 generation.</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">{employees?.length || 0} Total Employees</span>
                </div>
            </header>

            <Card className="border-none shadow-xl bg-white dark:bg-slate-900">
                <CardHeader className="pb-0">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search employee name or ID..." className="pl-10 h-10" />
                        </div>
                        <CardDescription>Click on an employee to manage their historical DTR logs.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="border rounded-xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                <TableRow>
                                    <TableHead className="w-[120px]">Employee ID</TableHead>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees?.map((emp) => (
                                    <TableRow key={emp.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                        <TableCell className="font-mono text-xs text-slate-500">{emp.id.split('-')[0].toUpperCase()}</TableCell>
                                        <TableCell className="font-semibold text-slate-900 dark:text-white">{emp.full_name}</TableCell>
                                        <TableCell className="text-slate-500">{emp.department}</TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                <Link href={`/dashboard/dtr-admin/${emp.id}`} className="flex items-center gap-2">
                                                    Manage Logs <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!employees || employees.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-slate-400 italic">
                                            No employees found in the directory.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <h4 className="font-bold text-sm">Batch Processing</h4>
                    </div>
                    <p className="text-xs text-slate-500">Upcoming: Upload CSV files from biometric scanners to auto-fill logs.</p>
                </div>
            </div>
        </div>
    )
}
