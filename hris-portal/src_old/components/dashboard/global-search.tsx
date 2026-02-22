'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { searchStaff } from "@/app/actions/dtr"
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function GlobalSearch() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([])
            setIsOpen(false)
            return
        }

        const timer = setTimeout(async () => {
            setIsLoading(true)
            setIsOpen(true)
            try {
                const data = await searchStaff(query)
                setResults(data)
            } catch (error) {
                console.error("Search failed", error)
                setResults([])
            } finally {
                setIsLoading(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = (id: string) => {
        setIsOpen(false)
        setQuery("")
        // Navigate to profile or detail page
        // For now, let's just toast or log, because we don't have a dedicated employee view yet
        // Ideally: router.push(`/dashboard/team/${id}`)
        console.log("Selected user:", id)
    }

    return (
        <div className="relative flex-1 md:w-64" ref={wrapperRef}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
                placeholder="Search staff..."
                className="pl-9 bg-white border-slate-200 focus-visible:ring-blue-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
            />

            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white rounded-md border border-slate-200 shadow-lg z-50 overflow-hidden text-sm">
                    {isLoading ? (
                        <div className="p-4 flex items-center justify-center text-slate-500 gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-1">
                            {results.map((user) => (
                                <div
                                    key={user.id}
                                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex flex-col"
                                    onClick={() => handleSelect(user.id)}
                                >
                                    <span className="font-medium text-slate-900">{user.full_name || 'Unknown User'}</span>
                                    <span className="text-xs text-slate-500">{user.role || 'Staff'} • {user.email}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-slate-500 text-xs">
                            No results found.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
