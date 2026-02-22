'use client'

import { Bell, Menu, User, LogOut } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ROLE_LABELS, Role } from '@/lib/roles'

export default function Header({
    profile,
    title,
}: {
    profile: any
    title?: string
}) {
    const router = useRouter()
    const supabase = createClient()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const userInitials = profile.full_name
        .split(' ')
        .filter((n: string) => n.trim().length > 0)
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const toggleSidebar = () => {
        window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))
    }

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
            <div className="flex items-center gap-4">
                <button
                    className="md:hidden text-slate-500 hover:text-slate-700"
                    onClick={toggleSidebar}
                >
                    <Menu size={24} />
                </button>
                {title && (
                    <h1 className="text-xl font-semibold text-slate-900 truncate">
                        {title}
                    </h1>
                )}
            </div>

            <div className="flex items-center gap-4">
                {/* Bell Icon */}
                <button className="relative p-2 text-slate-400 hover:text-slate-600 focus:outline-none">
                    <Bell size={20} />
                    {/* Example notification dot (optional) */}
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                </button>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A5F] text-xs font-medium text-white focus:outline-none ring-2 ring-white shadow-sm"
                    >
                        {userInitials}
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="px-4 py-3 border-b border-slate-100">
                                <p className="text-sm text-slate-900 truncate font-medium">
                                    {profile.full_name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {ROLE_LABELS[profile.role as Role]}
                                </p>
                            </div>
                            <Link
                                href="/dashboard/profile"
                                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                onClick={() => setDropdownOpen(false)}
                            >
                                <User className="mr-2 h-4 w-4" />
                                My Profile
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
