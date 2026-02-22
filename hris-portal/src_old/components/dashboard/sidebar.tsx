'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
    LayoutDashboard,
    User,
    FileText,
    Settings,
    Clock,
    CheckSquare,
    Users,
    ShieldCheck,
    CalendarCheck,
    BarChart4,
    Target
} from 'lucide-react'

interface SidebarProps {
    userProfile: {
        full_name: string | null;
        role: string | null;
        department?: string | null;
    } | null;
    pendingCount: number;
    setIsSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ userProfile, pendingCount, setIsSidebarOpen }: SidebarProps) {
    const pathname = usePathname()

    // Helper to check for active link
    const isActive = (path: string) => pathname === path

    // Helper for link classes
    const getLinkClass = (path: string) => `group flex items-center px-3 py-2 text-[13px] font-medium rounded-lg transition-all ${isActive(path)
        ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`

    const getIconClass = (path: string) => `mr-2.5 h-4 w-4 flex-shrink-0 ${isActive(path) ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-100">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0 border-2 border-slate-100 shadow-sm">
                        <Image
                            src="/images/logo.png"
                            alt="Official Seal"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                    <div className="flex flex-col ml-3">
                        <h1 className="text-slate-900 text-base font-bold leading-tight">
                            Assessors Portal
                        </h1>
                        <p className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                            PROVINCE OF ILOCOS SUR
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
                {/* 1. OVERVIEW */}
                <div>
                    <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Overview</p>
                    <div className="space-y-0.5">
                        <Link
                            href="/dashboard"
                            onClick={() => setIsSidebarOpen(false)}
                            className={getLinkClass('/dashboard')}
                        >
                            <LayoutDashboard className={getIconClass('/dashboard')} />
                            Dashboard
                        </Link>
                        <Link
                            href="/dashboard/profile"
                            onClick={() => setIsSidebarOpen(false)}
                            className={getLinkClass('/dashboard/profile')}
                        >
                            <User className={getIconClass('/dashboard/profile')} />
                            My Profile
                        </Link>
                    </div>
                </div>

                {/* 2. PERFORMANCE */}
                <div>
                    <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Performance</p>
                    <div className="space-y-0.5">
                        <Link
                            href="/dashboard/ipcr"
                            onClick={() => setIsSidebarOpen(false)}
                            className={getLinkClass('/dashboard/ipcr')}
                        >
                            <FileText className={getIconClass('/dashboard/ipcr')} />
                            My IPCR
                        </Link>

                        {(userProfile?.role === 'division_chief' || userProfile?.role === 'head_of_office' || userProfile?.role === 'admin_staff') && (
                            <Link
                                href="/dashboard/team"
                                onClick={() => setIsSidebarOpen(false)}
                                className={getLinkClass('/dashboard/team')}
                            >
                                <Target className={getIconClass('/dashboard/team')} />
                                Team Targets
                            </Link>
                        )}
                    </div>
                </div>

                {/* 3. ATTENDANCE & LEAVE */}
                <div>
                    <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Attendance</p>
                    <div className="space-y-0.5">
                        <Link
                            href="/dashboard/dtr"
                            onClick={() => setIsSidebarOpen(false)}
                            className={getLinkClass('/dashboard/dtr')}
                        >
                            <Clock className={getIconClass('/dashboard/dtr')} />
                            Daily Time Record
                        </Link>
                        <Link
                            href="/dashboard/leaves"
                            onClick={() => setIsSidebarOpen(false)}
                            className={getLinkClass('/dashboard/leaves')}
                        >
                            <CalendarCheck className={getIconClass('/dashboard/leaves')} />
                            Leave Management
                        </Link>
                    </div>
                </div>

                {/* 4. MANAGEMENT (Supervisors Only) */}
                {(userProfile?.role === 'division_chief' || userProfile?.role === 'head_of_office' || userProfile?.role === 'admin_staff') && (
                    <div>
                        <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Management</p>
                        <div className="space-y-0.5">
                            <Link
                                href="/dashboard/approvals"
                                onClick={() => setIsSidebarOpen(false)}
                                className={`group flex items-center justify-between px-3 py-2 text-[13px] font-medium rounded-lg transition-all ${isActive('/dashboard/approvals')
                                    ? 'bg-blue-50 text-blue-600 font-semibold shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <CheckSquare className={getIconClass('/dashboard/approvals')} />
                                    Approvals
                                </div>
                                {pendingCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                                        {pendingCount}
                                    </span>
                                )}
                            </Link>

                            <Link
                                href="/dashboard/reports"
                                onClick={() => setIsSidebarOpen(false)}
                                className={getLinkClass('/dashboard/reports')}
                            >
                                <BarChart4 className={getIconClass('/dashboard/reports')} />
                                Reports
                            </Link>

                            {(userProfile?.role === 'admin_staff' || userProfile?.role === 'head_of_office') && (
                                <Link
                                    href="/dashboard/admin"
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={getLinkClass('/dashboard/admin')}
                                >
                                    <ShieldCheck className={getIconClass('/dashboard/admin')} />
                                    Admin Center
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* 5. SYSTEM */}
                <div className="mt-auto pt-4">
                    <Link
                        href="/dashboard/settings"
                        onClick={() => setIsSidebarOpen(false)}
                        className={getLinkClass('/dashboard/settings')}
                    >
                        <Settings className={getIconClass('/dashboard/settings')} />
                        Settings
                    </Link>
                </div>

            </nav>

            {/* Footer Status */}
            <div className="p-3 border-t border-slate-100">
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <p className="text-[11px] text-slate-500 font-medium">System Status</p>
                    <div className="flex items-center mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 shadow-sm"></div>
                        <p className="text-[11px] font-semibold text-slate-700">Online</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
