'use client'

import Link from 'next/link'
import {
    Menu,
    LogOut,
    ChevronDown,
    User,
    Settings,
} from 'lucide-react'
import { NotificationBell } from '@/components/layout/notification-bell'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/login/actions'
import { ROLE_LABELS, Role } from '@/lib/roles'

interface HeaderProps {
    userProfile: { full_name: string | null, email: string | undefined, role: string | null, avatar_url: string | null } | null
    isSidebarOpen: boolean
    setIsSidebarOpen: (open: boolean) => void
    isMounted: boolean
    pendingCount: number
}

export function Header({
    userProfile,
    isSidebarOpen,
    setIsSidebarOpen,
    isMounted,
    pendingCount
}: HeaderProps) {
    const displayName = userProfile?.full_name || userProfile?.email?.split('@')[0] || 'User'
    const displayEmail = userProfile?.email || 'Loading...'
    const displayInitials = displayName.substring(0, 2).toUpperCase()

    return (
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b bg-white/80 px-6 backdrop-blur-xl transition-all supports-[backdrop-filter]:bg-white/60">
            <div className="flex items-center gap-4">
                <div className="flex items-center md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open Sidebar</span>
                    </Button>
                </div>

                {/* Breadcrumbs or Page Title Area could go here */}
                <div className="hidden md:flex flex-col">
                    {/* Placeholder for future breadcrumbs */}
                </div>
            </div>

            {/* Right Side Header Content */}
            <div className="ml-auto flex items-center gap-4">
                <NotificationBell />

                {isMounted ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 flex items-center gap-3 rounded-full pl-2 pr-4 hover:bg-slate-100 transition-colors">
                                <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-200">
                                    <AvatarImage src={userProfile?.avatar_url || ''} alt="@user" className="object-cover" />
                                    <AvatarFallback className="bg-blue-600 text-white font-medium">{displayInitials}</AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:flex flex-col items-start">
                                    <span className="text-sm font-semibold text-slate-700 truncate max-w-[150px] leading-tight">{displayName}</span>
                                    <span className="text-xs text-slate-500 capitalize">{userProfile?.role ? ROLE_LABELS[userProfile.role as Role] : 'Project Staff'}</span>
                                </div>
                                <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:inline-block" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 mt-2 bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-xl" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal p-3">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none truncate">{displayName}</p>
                                    <p className="text-xs leading-none text-muted-foreground truncate">{displayEmail}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="p-2 cursor-pointer">
                                <Link href="/dashboard/profile">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="p-2 cursor-pointer">
                                <Link href="/dashboard/settings">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="p-2 text-red-600 cursor-pointer focus:text-red-600 active:text-red-700" onSelect={async () => await signOut()}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="flex items-center gap-3 pr-2">
                        <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse"></div>
                        <div className="hidden sm:block h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                )}
            </div>
        </header>
    )
}
