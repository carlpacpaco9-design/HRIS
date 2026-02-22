import { getStaffDTR, getStaffProfile } from "@/app/actions/dtr-admin"
import { DTREncoderGrid } from "@/components/admin/dtr-encoder-grid"
import { Button } from "@/components/ui/button"
import { ChevronLeft, FileDown, Printer, Calendar as CalendarIcon } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DTRDownloadButton } from "@/components/pdf/dtr-download-button"
import { DownloadDTRButton } from "@/components/dtr/download-docx-button"

export const dynamic = 'force-dynamic'

export default async function DTREncoderPage(props: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ month?: string, year?: string }>
}) {
    const params = await props.params
    const searchParams = await props.searchParams

    const userId = params.id
    const currentMonth = searchParams.month ? parseInt(searchParams.month) : new Date().getMonth() + 1
    const currentYear = searchParams.year ? parseInt(searchParams.year) : new Date().getFullYear()

    const profile = await getStaffProfile(userId)
    const dtrData = await getStaffDTR(userId, currentMonth, currentYear)

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    return (
        <div className="p-6 pb-24 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/dtr-admin" className="flex items-center gap-2">
                        <ChevronLeft className="h-4 w-4" /> Back to List
                    </Link>
                </Button>
            </div>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xl">
                            {profile?.full_name?.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile?.full_name}</h1>
                            <p className="text-sm text-slate-500">{profile?.department} | ID: {profile?.employee_id || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex gap-2">
                        <Select defaultValue={currentMonth.toString()}>
                            <SelectTrigger className="w-[140px]">
                                <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((m, i) => (
                                    <SelectItem key={m} value={(i + 1).toString()}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select defaultValue={currentYear.toString()}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {[2024, 2025, 2026].map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        <FileDown className="h-4 w-4" /> Export CSV
                    </Button>
                    <DTRDownloadButton
                        profile={profile}
                        month={currentMonth.toString()}
                        year={currentYear.toString()}
                        logs={dtrData}
                        monthName={months[currentMonth - 1]}
                    />
                </div>
            </header>

            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        Currently encoding for <span className="font-bold">{months[currentMonth - 1]} {currentYear}</span>.
                    </p>
                </div>
                <div className="flex justify-end gap-2">
                    <DownloadDTRButton
                        staffName={profile?.full_name || ""}
                        month={months[currentMonth - 1]}
                        year={currentYear.toString()}
                        records={dtrData}
                    />
                </div>
            </div>

            <DTREncoderGrid
                userId={userId}
                initialData={dtrData}
                month={currentMonth}
                year={currentYear}
            />

            <footer className="mt-10 pt-10 border-t flex justify-end gap-10 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Auto-save active
                </div>
                <div>Form 48 Rev. 2024 Compliant</div>
            </footer>
        </div>
    )
}
