'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { login, verifyMfaLogin } from './actions'
import { useFormStatus } from 'react-dom'
import { useState } from 'react'
import { Loader2, ShieldCheck, ArrowLeft, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

function SubmitButton({ label = 'Log In' }: { label?: string }) {
    const { pending } = useFormStatus()
    return (
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md hover:shadow-lg" type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : label}
        </Button>
    )
}

export default function LoginPage() {
    const router = useRouter()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [mfaData, setMfaData] = useState<{ required: boolean, factorId: string }>({
        required: false,
        factorId: ''
    })
    const [isVerifying, setIsVerifying] = useState(false)

    async function clientAction(formData: FormData) {
        setErrorMessage(null)
        const result = await login(formData)

        if (result?.error) {
            setErrorMessage(result.error)
        } else if (result?.mfaRequired) {
            setMfaData({ required: true, factorId: result.factorId })
        }
    }

    async function handleMfaVerify(formData: FormData) {
        setErrorMessage(null)
        setIsVerifying(true)
        const code = formData.get('code') as string
        const result = await verifyMfaLogin(mfaData.factorId, code)
        setIsVerifying(false)

        if (result?.error) {
            setErrorMessage(result.error)
        } else {
            router.push('/dashboard')
        }
    }

    if (mfaData.required) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 px-4">
                <Card className="w-full max-w-sm border-slate-200 shadow-xl overflow-hidden">
                    <div className="h-2 bg-blue-600 w-full" />
                    <CardHeader className="text-center pt-8">
                        <div className="mx-auto bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Two-Factor Auth</CardTitle>
                        <CardDescription>
                            Enter the 6-digit code from your authenticator app to continue.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        <form action={handleMfaVerify} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-center block text-slate-500 text-xs uppercase tracking-wider font-semibold">Verification Code</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    type="text"
                                    placeholder="000 000"
                                    className="text-center text-3xl font-bold h-16 tracking-[0.3em]"
                                    maxLength={6}
                                    required
                                    autoFocus
                                />
                            </div>
                            {errorMessage && (
                                <p className="text-sm text-red-500 font-medium text-center">{errorMessage}</p>
                            )}
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                                type="submit"
                                disabled={isVerifying}
                            >
                                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Continue'}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setMfaData({ required: false, factorId: '' })}
                                className="w-full text-slate-400 hover:text-slate-600 text-xs flex items-center justify-center gap-2 pt-2"
                            >
                                <ArrowLeft className="h-3 w-3" /> Back to Login
                            </button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Left panel (desktop) */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#1E3A5F] text-white p-12 flex-col justify-between relative overflow-hidden">
                {/* Decorative background overlay */}
                <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>

                {/* header */}
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg">
                        <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-blue-200 font-semibold tracking-widest uppercase mb-0.5">
                            Republic of the Philippines
                        </p>
                        <p className="text-sm font-bold text-white tracking-wide">
                            Provincial Assessor's Office
                        </p>
                    </div>
                </div>

                {/* center text */}
                <div className="relative z-10">
                    <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-[1.15] text-white">
                        Human Resource<br />Management System
                    </h1>
                    <p className="text-xl text-blue-100/90 font-medium max-w-md leading-relaxed">
                        Secure Strategic Performance Management System Portal for PAO Employees
                    </p>
                </div>

                {/* footer */}
                <div className="relative z-10">
                    <p className="text-white/40 text-xs font-medium">
                        © {new Date().getFullYear()} Provincial Assessor's Office. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right panel (login form) */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
                <div className="w-full max-w-[420px] space-y-8 relative z-10">
                    <div className="text-center md:text-left space-y-2">
                        <div className="lg:hidden flex items-center justify-center md:justify-start gap-3 mb-8">
                            <div className="w-12 h-12 rounded-full bg-[#1E3A5F] flex items-center justify-center shadow-md">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">
                                    Republic of the Philippines
                                </p>
                                <p className="text-sm font-bold text-[#1E3A5F] tracking-wide">
                                    Provincial Assessor's Office
                                </p>
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            Welcome back
                        </h2>
                        <p className="text-sm text-slate-500">
                            Sign in to your PAO HRMS account to proceed
                        </p>
                    </div>

                    <form action={clientAction}>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Official Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@company.gov.ph"
                                    required
                                    className="h-11 bg-white border-slate-200 focus:border-blue-600 focus:ring-blue-600/20 px-4 transition-all shadow-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="h-11 bg-white border-slate-200 focus:border-blue-600 focus:ring-blue-600/20 px-4 transition-all shadow-sm"
                                />
                            </div>

                            {errorMessage && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                    <p className="text-sm text-red-600 font-medium text-center">{errorMessage}</p>
                                </div>
                            )}

                            <div className="pt-2">
                                <SubmitButton />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
