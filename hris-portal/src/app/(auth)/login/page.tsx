'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError('Invalid email or password.')
            setLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC]">
            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-md">
                {/* Header Band */}
                <div className="flex flex-col items-center bg-[#1E3A5F] px-8 py-10 text-center text-white">
                    <Shield className="mb-4 text-white" size={32} />
                    <h1 className="mb-1 text-2xl font-bold">PAO HRMS</h1>
                    <p className="text-sm text-slate-300">
                        Provincial Assessor's Office
                    </p>
                </div>

                {/* Login Form */}
                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-slate-900"
                            >
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                disabled={loading}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-900"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    disabled={loading}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    disabled={loading}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none disabled:opacity-50"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center rounded-md bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E3A5F]/90 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {error && (
                        <p className="mt-4 text-center text-sm font-medium text-[#991B1B]">
                            {error}
                        </p>
                    )}
                </div>
            </div>

            <p className="mt-8 text-center text-sm text-slate-400">
                Provincial Assessor's Office · Internal Use Only
            </p>
        </div>
    )
}
