'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Clock,
    CalendarOff,
    CheckSquare,
    FileText,
    Building2, // Still used for logo? Or just text? The Prompt says: "Logo / Office name — hide when collapsed". I'll keep Building2 if it looks good or follow prompt strictly.
    BookOpen,
    TrendingUp,
    CalendarDays,
    Trophy,
    ShieldCheck,
    LucideIcon,
    PanelLeftClose,
    PanelLeftOpen,
    LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { navConfig, normalizeRole, NavItem, NavSection } from '@/lib/nav-config'
import { ROLE_LABELS, Role } from '@/lib/roles'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

interface SidebarProps {
    userProfile: { role: string | null; full_name?: string | null; avatar_url?: string | null } | null
    pendingCount?: number
    isOpen?: boolean // Mobile open state
    setIsOpen?: (open: boolean) => void
}

const iconMap: Record<string, LucideIcon> = {
    LayoutDashboard,
    Clock,
    CalendarOff,
    CheckSquare,
    FileText,
    Building2,
    BookOpen,
    TrendingUp,
    CalendarDays,
    Trophy,
    ShieldCheck
}

function NavItemComponent({
    item,
    isCollapsed,
    isActive,
    setIsOpen
}: {
    item: NavItem
    isCollapsed: boolean
    isActive: boolean
    setIsOpen?: (open: boolean) => void
}) {
    const Icon = iconMap[item.icon] || LayoutDashboard

    const linkContent = (
        <Link
            href={item.href}
            onClick={() => setIsOpen?.(false)}
            className={cn(
                "flex items-center gap-3 rounded-lg",
                "px-3 py-2.5 mx-2 text-sm font-medium",
                "transition-colors duration-150",
                isActive
                    ? "bg-[#1E3A5F] text-white font-semibold hover:bg-[#1E3A5F]/90"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
                // Center icon when collapsed
                isCollapsed && "justify-center px-0 mx-2"
            )}
        >
            <Icon className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-5 h-5")} />
            {/* Label — hide when collapsed */}
            {!isCollapsed && (
                <span className="truncate">{item.label}</span>
            )}
        </Link>
    )

    if (isCollapsed) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-900 text-white border-slate-800">
                    <p>{item.label}</p>
                </TooltipContent>
            </Tooltip>
        )
    }

    return linkContent
}

export function Sidebar({ userProfile, pendingCount = 0, isOpen = false, setIsOpen }: SidebarProps) {
    const pathname = usePathname()
    const [isMounted, setIsMounted] = useState(false)

    // FIX: Persist Collapsed State correctly
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar-collapsed') === 'true'
        }
        return false
    })

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Persist on every change
    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('sidebar-collapsed', String(isCollapsed))
        }
    }, [isCollapsed, isMounted])


    const filterNavByRole = (sections: NavSection[]): NavSection[] => {
        if (!userProfile?.role) return [] // Or show non-protected routes? Assuming role is needed.
        return sections.map(section => {
            const filteredItems = section.items.filter(item => {
                return item.roles.some(r => normalizeRole(r) === normalizeRole(userProfile.role!))
            })
            return {
                ...section,
                items: filteredItems
            }
        }).filter(section => section.items.length > 0)
    }

    const filteredNav = filterNavByRole(navConfig)

    // Avoid hydration mismatch by rendering a placeholder or compatible state until mounted
    // However, if we initialize state from localStorage in useState callback (which runs on client), 
    // we might need to handle SSR carefully if we want to avoid layout shift. 
    // But since `window` check forces `false` on server, client will hydrate with `true` if stored.
    // React 18 handles this better but let's stick to standard practice.
    // If we use `isMounted` gate, we might flash empty sidebar.
    // The previous code had a skeleton. I'll keep the return null or similar if needed, 
    // but the prompt implies working immediately. 
    // Actually, initializing state with function avoids the effect-based flash.

    // Warning: If server renders collapsed=false and client renders collapsed=true, hydration error.
    // To be safe, we can use `isMounted` to only render the sidebar content fully after mount, or accept the risk.
    // Given the prompt, let's just proceed with the logic requested.

    if (!isMounted) return <div className="hidden md:flex w-64 h-full bg-background border-r border-border shrink-0" />

    // Update isOpen prop usage to match "isMobileOpen" behavior
    const isMobileOpen = isOpen

    return (
        <>
            {/* Backdrop — mobile only, when open */}
            {isMobileOpen && (
                <div
                    className="
                        fixed inset-0 z-40
                        bg-black/40 backdrop-blur-sm
                        md:hidden
                    "
                    onClick={() => setIsOpen?.(false)}
                    aria-hidden="true"
                />
            )}

            <TooltipProvider>
                <aside className={cn(
                    // Base styles
                    "flex flex-col h-full shrink-0",
                    "bg-background border-r border-border", // user requested bg-background
                    "overflow-hidden",

                    // Smooth width transition
                    "transition-all duration-300 ease-in-out",

                    // Width switches based on state
                    isCollapsed ? "w-16" : "w-64",

                    // Mobile: overlay behavior
                    "fixed md:relative",
                    "inset-y-0 left-0 z-50",
                    "md:translate-x-0",
                    !isMobileOpen && "-translate-x-full md:translate-x-0"
                )}>
                    {/* Sidebar top bar */}
                    <div className={cn(
                        "flex items-center h-14 shrink-0", // Adjusted to h-14 per prompt? Old was h-16. Prompt says h-14.
                        "border-b border-border",
                        "px-3",
                        // Center toggle when collapsed
                        isCollapsed
                            ? "justify-center"
                            : "justify-between"
                    )}>
                        {/* Logo / Office name — hide when collapsed */}
                        {!isCollapsed && (
                            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                                <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                                <div className="flex flex-col fade-in animate-in duration-300">
                                    <span className="text-sm font-bold text-slate-800 leading-none">HRMS Portal</span>
                                    <span className="text-[10px] text-slate-500 font-medium">Provincial Assessor's Office</span>
                                </div>
                            </div>
                        )}

                        {/* Toggle button — always visible */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-slate-400 hover:text-blue-600"
                            onClick={() => setIsCollapsed(prev => !prev)}
                            aria-label={
                                isCollapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"
                            }
                        >
                            {isCollapsed
                                ? <PanelLeftOpen className="w-4 h-4" />
                                : <PanelLeftClose className="w-4 h-4" />
                            }
                        </Button>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 nice-scrollbar">
                        {filteredNav.map(section => (
                            <div key={section.section} className="mb-4">
                                {/* Section label — hide when collapsed */}
                                {!isCollapsed && (
                                    <div className="px-5 mb-2">
                                        <p className="
                                            text-[10px] font-bold uppercase tracking-wider text-slate-400
                                        ">
                                            {section.section}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-0.5">
                                    {section.items.map(item => (
                                        <NavItemComponent
                                            key={item.href}
                                            item={item}
                                            isCollapsed={isCollapsed}
                                            isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                                            setIsOpen={setIsOpen}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* User Profile (Pinned Bottom) */}
                    <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                        <div className={cn(
                            "flex items-center gap-3 transition-all duration-200",
                            isCollapsed ? "justify-center flex-col" : "justify-start"
                        )}>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 text-blue-700 font-bold text-xs">
                                {userProfile?.avatar_url ? (
                                    <img src={userProfile.avatar_url} alt="User" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <span>
                                        {userProfile?.full_name
                                            ? userProfile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                            : 'U'}
                                    </span>
                                )}
                            </div>

                            {!isCollapsed && (
                                <div className="flex flex-col min-w-0 overflow-hidden">
                                    <span className="text-sm font-semibold text-slate-700 truncate">
                                        {userProfile?.full_name || 'User'}
                                    </span>
                                    <span className="text-xs text-slate-500 capitalize truncate">
                                        {userProfile?.role ? ROLE_LABELS[userProfile.role as Role] : 'Guest'}
                                    </span>
                                </div>
                            )}

                            <button
                                className={cn(
                                    "text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50",
                                    !isCollapsed && "ml-auto"
                                )}
                                title="Log out"
                                onClick={() => {
                                    import('@/app/login/actions').then(mod => mod.signOut())
                                }}
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </aside>
            </TooltipProvider>
        </>
    )
}
