'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Users,
    Search,
    Save,
    Zap,
    ChevronRight,
    Loader2,
    Info
} from "lucide-react"
import { getStaffMonthRecords, saveBatchDTR } from "@/app/actions/dtr-encoding"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { DownloadDTRButton } from "@/components/dtr/download-docx-button"
import { LEAVE_TYPES_CONFIG, LeaveTypeKey } from "@/lib/leave-types"

interface SmartEncoderProps {
    staff: any[];
}

export function SmartEncoder({ staff }: SmartEncoderProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedStaff, setSelectedStaff] = useState<any>(null)
    const [records, setRecords] = useState<any[]>([])
    const [balances, setBalances] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())

    const fetchRecords = async (staffId: string) => {
        setIsLoading(true)
        try {
            const data = await getStaffMonthRecords(staffId, month, year)
            // data now returns { records, balances }
            const enriched = data.records.map((r: any) => ({
                ...r,
                dayName: format(parseISO(r.date), 'EEE')
            }))
            setRecords(enriched)
            setBalances(data.balances)
        } catch (e) {
            toast.error("Failed to load records")
        } finally {
            setIsLoading(false)
        }
    }

    const handleStaffSelect = (s: any) => {
        setSelectedStaff(s)
        fetchRecords(s.id)
    }

    const handleInputChange = (idx: number, field: string, value: string) => {
        const newRecords = [...records]
        newRecords[idx][field] = value
        setRecords(newRecords)
    }

    const handleStatusChange = (idx: number, value: string) => {
        const config = LEAVE_TYPES_CONFIG[value as LeaveTypeKey]

        // Validation for Credits
        if (config?.deducts && balances) {
            const currentBalance = balances[config.deducts] || 0
            if (currentBalance <= 0) {
                toast.warning(`Warning: Staff member has 0 ${config.label} credits left.`, {
                    description: "You can still save, but please verify credits later.",
                    duration: 5000
                })
            }
        }

        const newRecords = [...records]
        newRecords[idx].status = value

        // If not Regular, clear inputs
        if (value !== "Regular") {
            newRecords[idx].am_in = ""
            newRecords[idx].am_out = ""
            newRecords[idx].pm_in = ""
            newRecords[idx].pm_out = ""
        }

        setRecords(newRecords)
    }

    const handleFillStandard = () => {
        if (!records.length) return
        const newRecords = records.map(r => {
            if (r.isWeekend || r.status !== "Regular") return r
            return {
                ...r,
                am_in: r.am_in || "8:00",
                am_out: r.am_out || "12:00",
                pm_in: r.pm_in || "12:30",
                pm_out: r.pm_out || "5:00"
            }
        })
        setRecords(newRecords)
        toast.info("Standard shifts filled.")
    }

    const handleSave = async () => {
        if (!selectedStaff) return
        setIsSaving(true)
        const res = await saveBatchDTR(selectedStaff.id, records)
        setIsSaving(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("All records saved successfully")
        }
    }

    const filteredStaff = staff.filter(s =>
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id?.includes(searchQuery)
    )

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-160px)] gap-6">
            {/* LEFT: DIRECTORY */}
            <aside className="w-full lg:w-80 flex flex-col bg-white dark:bg-slate-900 border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="font-bold flex items-center gap-2 mb-4">
                        <Users className="h-4 w-4 text-blue-500" />
                        Staff Directory
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search name..."
                            className="pl-9 bg-slate-50 dark:bg-slate-800 border-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredStaff.map(s => (
                        <button
                            key={s.id}
                            onClick={() => handleStaffSelect(s)}
                            className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${selectedStaff?.id === s.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                                }`}
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold truncate max-w-[180px]">{s.full_name}</span>
                                <span className={`text-[10px] ${selectedStaff?.id === s.id ? 'text-blue-100' : 'text-slate-500'}`}>
                                    {s.department}
                                </span>
                            </div>
                            <ChevronRight className={`h-4 w-4 transition-transform ${selectedStaff?.id === s.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                        </button>
                    ))}
                </div>
            </aside>

            {/* MAIN AREA */}
            <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 border rounded-2xl shadow-sm overflow-hidden">
                {!selectedStaff ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8">
                        <Users className="h-16 w-16 opacity-10 mb-4" />
                        <p className="font-medium">Selection Required</p>
                        <p className="text-sm opacity-60">Select a staff member from the left to start encoding their Daily Time Record.</p>
                    </div>
                ) : (
                    <>
                        <header className="p-4 md:p-6 border-b flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-lg">
                                        {selectedStaff.full_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{selectedStaff.full_name}</h1>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">ID: {selectedStaff.id.split('-')[0].toUpperCase()}</p>
                                            <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-blue-500">{selectedStaff.department}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button onClick={handleFillStandard} variant="outline" size="sm" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                                        <Zap className="h-4 w-4" /> Fill Standard
                                    </Button>
                                    <DownloadDTRButton
                                        staffName={selectedStaff.full_name}
                                        month={format(new Date(year, month - 1, 1), 'MMMM')}
                                        year={year.toString()}
                                        records={records}
                                    />
                                    <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
                                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                        Save Records
                                    </Button>
                                </div>
                            </div>

                            {/* BALANCE STRIP */}
                            {balances && (
                                <div className="flex flex-wrap items-center gap-4 p-3 bg-white dark:bg-slate-900 border rounded-xl shadow-sm">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">
                                        <Info className="h-3 w-3 text-blue-500" />
                                        Leave Credits:
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300">
                                        <span className="text-[9px] font-bold opacity-70 uppercase">VL</span>
                                        <span className="font-bold text-xs">{balances.vacation_leave}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300">
                                        <span className="text-[9px] font-bold opacity-70 uppercase">SL</span>
                                        <span className="font-bold text-xs">{balances.sick_leave}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300">
                                        <span className="text-[9px] font-bold opacity-70 uppercase">Wellness</span>
                                        <span className="font-bold text-xs">{balances.wellness_leave}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-700 dark:text-purple-300">
                                        <span className="text-[9px] font-bold opacity-70 uppercase">SPL</span>
                                        <span className="font-bold text-xs">{balances.special_privilege_leave}</span>
                                    </div>
                                </div>
                            )}
                        </header>

                        <div className="flex-1 overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
                                    <TableRow className="bg-slate-100 dark:bg-slate-800 border-none">
                                        <TableHead className="w-24 font-bold text-slate-900 dark:text-white px-4">Date</TableHead>
                                        <TableHead className="text-center font-bold text-slate-900 dark:text-white">AM Arrival</TableHead>
                                        <TableHead className="text-center font-bold text-slate-900 dark:text-white">AM Departure</TableHead>
                                        <TableHead className="text-center font-bold text-slate-900 dark:text-white">PM Arrival</TableHead>
                                        <TableHead className="text-center font-bold text-slate-900 dark:text-white">PM Departure</TableHead>
                                        <TableHead className="min-w-[200px] font-bold text-slate-900 dark:text-white">Status / Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-20">
                                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        records.map((row, idx) => {
                                            const config = LEAVE_TYPES_CONFIG[row.status as LeaveTypeKey]
                                            const isNonRegular = row.status !== "Regular"
                                            const rowBgColor = config?.color || (row.isWeekend ? 'bg-slate-50 dark:bg-slate-900/40' : '')

                                            return (
                                                <TableRow key={row.date} className={`transition-colors h-12 ${rowBgColor} border-slate-100 dark:border-slate-800`}>
                                                    <TableCell className={`px-4 border-r ${row.isWeekend ? 'text-red-500 bg-red-50/20' : 'text-slate-600 font-medium'}`}>
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold uppercase">{row.dayName}</span>
                                                            <span className="text-sm">{format(parseISO(row.date), 'MMM dd')}</span>
                                                        </div>
                                                    </TableCell>

                                                    {isNonRegular ? (
                                                        <TableCell colSpan={4} className="text-center p-0 border-r">
                                                            <div className="flex items-center justify-center gap-2 font-bold tracking-tight uppercase text-[10px] h-12">
                                                                <span className="px-3 py-1 bg-white/60 dark:bg-slate-800/60 rounded-full border border-black/5 shadow-sm">
                                                                    {row.status}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                    ) : (
                                                        <>
                                                            <TableCell className="p-0 border-r">
                                                                <Input
                                                                    value={row.am_in}
                                                                    disabled={row.isWeekend}
                                                                    onChange={(e) => handleInputChange(idx, 'am_in', e.target.value)}
                                                                    className="border-none focus-visible:ring-0 text-center h-12 font-mono text-sm transition-all focus:bg-white/50 px-0"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="p-0 border-r">
                                                                <Input
                                                                    value={row.am_out}
                                                                    disabled={row.isWeekend}
                                                                    onChange={(e) => handleInputChange(idx, 'am_out', e.target.value)}
                                                                    className="border-none focus-visible:ring-0 text-center h-12 font-mono text-sm transition-all focus:bg-white/50 px-0"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="p-0 border-r">
                                                                <Input
                                                                    value={row.pm_in}
                                                                    disabled={row.isWeekend}
                                                                    onChange={(e) => handleInputChange(idx, 'pm_in', e.target.value)}
                                                                    className="border-none focus-visible:ring-0 text-center h-12 font-mono text-sm transition-all focus:bg-white/50 px-0"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="p-0 border-r">
                                                                <Input
                                                                    value={row.pm_out}
                                                                    disabled={row.isWeekend}
                                                                    onChange={(e) => handleInputChange(idx, 'pm_out', e.target.value)}
                                                                    className="border-none focus-visible:ring-0 text-center h-12 font-mono text-sm transition-all focus:bg-white/50 px-0"
                                                                />
                                                            </TableCell>
                                                        </>
                                                    )}

                                                    <TableCell className="p-2 flex gap-2">
                                                        <Select value={row.status} onValueChange={(val) => handleStatusChange(idx, val)}>
                                                            <SelectTrigger className="h-8 w-36 text-[10px] font-bold uppercase truncate">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectGroup>
                                                                    <SelectLabel className="text-[9px] uppercase tracking-wider opacity-50">Work Status</SelectLabel>
                                                                    <SelectItem value="Regular" className="text-xs font-bold">Regular Work</SelectItem>
                                                                    <SelectItem value="Official Business / TO" className="text-xs font-bold">Official Business / TO</SelectItem>
                                                                </SelectGroup>
                                                                <SelectGroup>
                                                                    <SelectLabel className="text-[9px] uppercase tracking-wider opacity-50">Standard Leaves</SelectLabel>
                                                                    <SelectItem value="Vacation Leave (VL)" className="text-xs font-bold">Vacation Leave (VL)</SelectItem>
                                                                    <SelectItem value="Sick Leave (SL)" className="text-xs font-bold">Sick Leave (SL)</SelectItem>
                                                                    <SelectItem value="Wellness Leave" className="text-xs font-bold">Wellness Leave</SelectItem>
                                                                    <SelectItem value="Special Privilege Leave (SPL)" className="text-xs font-bold">SPL</SelectItem>
                                                                </SelectGroup>
                                                                <SelectGroup>
                                                                    <SelectLabel className="text-[9px] uppercase tracking-wider opacity-50">Special Leaves</SelectLabel>
                                                                    <SelectItem value="Maternity Leave" className="text-xs font-bold">Maternity</SelectItem>
                                                                    <SelectItem value="Paternity Leave" className="text-xs font-bold">Paternity</SelectItem>
                                                                    <SelectItem value="Solo Parent Leave" className="text-xs font-bold">Solo Parent</SelectItem>
                                                                    <SelectItem value="VAWC Leave" className="text-xs font-bold text-red-500">VAWC</SelectItem>
                                                                    <SelectItem value="Study Leave" className="text-xs font-bold">Study Leave</SelectItem>
                                                                    <SelectItem value="Rehabilitation Leave" className="text-xs font-bold">Rehabilitation</SelectItem>
                                                                </SelectGroup>
                                                                <SelectGroup>
                                                                    <SelectLabel className="text-[9px] uppercase tracking-wider opacity-50">Others</SelectLabel>
                                                                    <SelectItem value="Holiday" className="text-xs font-bold text-amber-600">Holiday</SelectItem>
                                                                    <SelectItem value="Suspension" className="text-xs font-bold">Suspension</SelectItem>
                                                                    <SelectItem value="Absent" className="text-xs font-bold text-red-600 underline">Absent</SelectItem>
                                                                </SelectGroup>
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            value={row.remarks}
                                                            onChange={(e) => handleInputChange(idx, 'remarks', e.target.value)}
                                                            className="h-8 text-[10px] bg-slate-50 dark:bg-slate-800"
                                                            placeholder="Remarks..."
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}
