'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
    Shield,
    LayoutDashboard,
    Clock,
    CalendarOff,
    CheckSquare,
    ClipboardList,
    Building2,
    Activity,
    TrendingUp,
    Calendar,
    Award,
    Users,
    Settings,
    LogOut,
    LucideIcon,
    Menu,
} from 'lucide-react'
import {
    ALL_ROLES,
    HR_MANAGERS,
    REVIEWERS,
    ROLE_LABELS,
    Role,
} from '@/lib/roles'

type NavItem = {
    href: string
    label: string
    icon: LucideIcon
    allowedRoles: Role[]
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
    {
        label: 'MAIN',
        items: [
            {
                href: '/dashboard',
                label: 'Dashboard',
                icon: LayoutDashboard,
                allowedRoles: ALL_ROLES as unknown as Role[], // casting to avoid strict readonly issues
            },
        ],
    },
    {
        label: 'HR MODULES',
        items: [
            {
                href: '/dashboard/dtr',
                label: 'Daily Time Record',
                icon: Clock,
                allowedRoles: ALL_ROLES as unknown as Role[],
            },
            {
                href: '/dashboard/leaves',
                label: 'Leave Management',
                icon: CalendarOff,
                allowedRoles: ALL_ROLES as unknown as Role[],
            },
            {
                href: '/dashboard/approvals',
                label: 'Approvals',
                icon: CheckSquare,
                allowedRoles: REVIEWERS as unknown as Role[],
            },
        ],
    },
    {
        label: 'SPMS',
        items: [
            {
                href: '/dashboard/ipcr',
                label: 'IPCR',
                icon: ClipboardList,
                allowedRoles: ALL_ROLES as unknown as Role[],
            },
            {
                href: '/dashboard/dpcr',
                label: 'DPCR',
                icon: Building2,
                allowedRoles: HR_MANAGERS as unknown as Role[],
            },
            {
                href: '/dashboard/monitoring',
                label: 'Monitoring & Coaching',
                icon: Activity,
                allowedRoles: REVIEWERS as unknown as Role[],
            },
            {
                href: '/dashboard/development-plan',
                label: 'Development Plan',
                icon: TrendingUp,
                allowedRoles: ALL_ROLES as unknown as Role[],
            },
            {
                href: '/dashboard/spms-calendar',
                label: 'SPMS Calendar',
                icon: Calendar,
                allowedRoles: ALL_ROLES as unknown as Role[],
            },
            {
                href: '/dashboard/rewards',
                label: 'Rewards & Incentives',
                icon: Award,
                allowedRoles: ALL_ROLES as unknown as Role[],
            },
        ],
    },
    {
        label: 'ADMINISTRATION',
        items: [
            {
                href: '/dashboard/admin/users',
                label: 'User Management',
                icon: Users,
                allowedRoles: ['admin_staff'],
            },
            {
                href: '/dashboard/admin/settings',
                label: 'Admin Panel',
                icon: Settings,
                allowedRoles: HR_MANAGERS as unknown as Role[],
            },
        ],
    },
]

type Profile = {
    id: string
    full_name: string
    role: string
    division: string
}

export default function Sidebar({ profile, counts }: { profile: Profile, counts?: { pendingApprovals: number, ipcrsAwaitingAction: number } }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    // For mobile drawer
    const [isOpen, setIsOpen] = useState(false)

    // Listen for custom event to toggle sidebar
    useEffect(() => {
        const handleToggle = () => setIsOpen((prev) => !prev)
        window.addEventListener('toggle-mobile-sidebar', handleToggle)
        return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle)
    }, [])

    // Close sidebar on path change
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const userRole = profile.role as Role
    const userInitials = profile.full_name
        .split(' ')
        .filter((n) => n.trim().length > 0)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()

    const sidebarContent = (
        <div className="flex h-full w-64 flex-col bg-white border-r shadow-sm border-slate-200">
            {/* Sidebar Header */}
            <div className="flex items-center gap-3 bg-[#1E3A5F] p-4 text-white">
                <Shield size={32} />
                <div className="flex flex-col">
                    <span className="font-bold leading-tight">PAO HRMS</span>
                    <span className="text-xs text-slate-300 leading-tight">
                        Provincial Assessor's<br />Office
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4">
                {NAV_SECTIONS.map((section, idx) => {
                    // Filter out items not allowed for this role
                    const allowedItems = section.items.filter((item) =>
                        item.allowedRoles.includes(userRole)
                    )

                    if (allowedItems.length === 0) return null

                    return (
                        <div key={idx} className="mb-6 px-4">
                            <h3 className="mb-2 px-2 text-xs font-semibold tracking-wider text-slate-500">
                                {section.label}
                            </h3>
                            <ul className="space-y-1">
                                {allowedItems.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                                                    ? 'bg-[#1E3A5F] text-white'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon
                                                        size={20}
                                                        className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}
                                                    />
                                                    {item.label}
                                                </div>
                                                {counts && item.label === 'Approvals' && counts.pendingApprovals > 0 && (
                                                    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-white text-[#1E3A5F]' : 'bg-rose-100 text-rose-600'}`}>
                                                        {counts.pendingApprovals}
                                                    </span>
                                                )}
                                                {counts && item.label === 'IPCR' && counts.ipcrsAwaitingAction > 0 && ['head_of_office', 'admin_staff', 'division_chief'].includes(userRole) && (
                                                    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-white text-[#1E3A5F]' : 'bg-rose-100 text-rose-600'}`}>
                                                        {counts.ipcrsAwaitingAction}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )
                })}
            </div>

            <div className="border-t border-slate-200 p-4 bg-slate-50">
                <Link href="/dashboard/profile" className="flex items-center gap-3 hover:bg-slate-100 p-2 -mx-2 rounded-md transition-colors cursor-pointer">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E3A5F] text-sm font-medium text-white shadow-sm">
                        {userInitials}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-slate-900">
                            {profile.full_name}
                        </span>
                        <span className="truncate text-xs text-slate-500">
                            {ROLE_LABELS[userRole]} · {profile.division}
                        </span>
                    </div>
                </Link>
                <button
                    onClick={handleSignOut}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar (Fixed) */}
            <aside className="hidden h-screen md:block sticky top-0 shrink-0">
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar (Slide-in drawer) */}
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                    {/* Sidebar drawer */}
                    <div className="fixed inset-y-0 left-0 w-64 shadow-xl transform transition-transform duration-300 ease-in-out">
                        {sidebarContent}
                    </div>
                </div>
            )}
        </>
    )
}
