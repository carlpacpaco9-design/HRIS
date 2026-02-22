'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [userProfile, setUserProfile] = useState<{ full_name: string | null, email: string | undefined, role: string | null, avatar_url: string | null } | null>(null)
    const [pendingCount, setPendingCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        setIsMounted(true)

        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Fetch full profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role, avatar_url')
                    .eq('id', user.id)
                    .single()

                setUserProfile({
                    full_name: profile?.full_name || null,
                    email: user.email,
                    role: profile?.role || 'project_staff',
                    avatar_url: profile?.avatar_url || null
                })

                // If supervisor, fetch pending count
                if (profile?.role === 'division_chief' || profile?.role === 'head_of_office' || profile?.role === 'admin_staff') {
                    const { count, error } = await supabase
                        .from('spms_commitments')
                        .select('*', { count: 'exact', head: true })
                        .eq('supervisor_id', user.id)
                        .eq('status', 'pending_approval')

                    if (!error && count) setPendingCount(count)
                }
            }
        }
        fetchUser()
    }, [])

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Sidebar — fixed width, never flex-1 */}
            <Sidebar
                userProfile={userProfile}
                pendingCount={pendingCount}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            {/* Main area — MUST be flex-1 */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Header
                    userProfile={userProfile}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    isMounted={isMounted}
                    pendingCount={pendingCount}
                />

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
                    {children}
                </main>
            </div>
        </div>
    )
}
