'use client'

import { Card } from "@/components/ui/card"
import { LeaveBalance } from "@/types/dashboard"
import { Briefcase } from "lucide-react"
import Link from 'next/link'

export function LeaveBalanceWidget({ balance }: { balance: LeaveBalance | null }) {
    if (!balance) return null

    const leaves = [
        { label: "Vacation", value: balance.vacation_leave, total: 15, color: "bg-blue-500" },
        { label: "Sick", value: balance.sick_leave, total: 15, color: "bg-rose-500" },
        { label: "SPL", value: balance.special_privilege_leave || 3, total: 3, color: "bg-amber-500" },
    ]

    return (
        <Card className="shadow-none border-none bg-transparent mt-2">
            <Link href="/dashboard/leaves">
                <div className="flex items-center gap-2 mb-3 cursor-pointer hover:bg-slate-50 p-1 -ml-1 rounded transition-colors group">
                    <div className="p-1.5 bg-slate-100 rounded-md group-hover:bg-white group-hover:shadow-sm transition-all">
                        <Briefcase className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-700">Leave Credits</h3>
                </div>
            </Link>

            <div className="grid gap-2.5">
                {leaves.map((leave) => (
                    <div key={leave.label} className="group relative overflow-hidden bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                        <div className="flex justify-between items-center relative z-10">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{leave.label}</span>
                            <span className="text-sm font-black text-slate-800">{leave.value} <span className="text-slate-300 text-[10px] font-normal">/ {leave.total}</span></span>
                        </div>

                        {/* Progress Bar Background */}
                        <div className="absolute bottom-0 left-0 h-0.5 bg-slate-100 w-full">
                            <div
                                className={`h-full ${leave.color} opacity-80`}
                                style={{ width: `${(leave.value / leave.total) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
