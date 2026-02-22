'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, ShieldCheck, ShieldAlert, QrCode, Trash2 } from "lucide-react"
import { enrollMFA, verifyMFA, disableMFA, getMFAFactors } from "@/app/actions/mfa"
import QRCode from 'qrcode'

export function MfaSection() {
    const [factors, setFactors] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isEnrolling, setIsEnrolling] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [enrollmentData, setEnrollmentData] = useState<any>(null)
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
    const [verificationCode, setVerificationCode] = useState('')

    const fetchFactors = async () => {
        setIsLoading(true)
        const res = await getMFAFactors()
        if (res.factors) setFactors(res.factors)
        setIsLoading(false)
    }

    useEffect(() => {
        fetchFactors()
    }, [])

    const handleEnroll = async () => {
        setIsEnrolling(true)
        const res = await enrollMFA()
        setIsEnrolling(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            setEnrollmentData(res.data)
            // Generate QR Code from the TOTP URI
            if (res.data?.totp?.qr_code) {
                // Supabase returns an SVG string in qr_code sometimes, 
                // but let's use the uri to generate a clean canvas/img with qrcode lib
                const url = await QRCode.toDataURL(res.data.totp.uri)
                setQrCodeUrl(url)
            }
        }
    }

    const handleVerify = async () => {
        if (verificationCode.length !== 6) {
            toast.error("Please enter a 6-digit code")
            return
        }

        setIsVerifying(true)
        const res = await verifyMFA(enrollmentData.id, '', verificationCode)
        setIsVerifying(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("MFA Enabled Successfully")
            setEnrollmentData(null)
            fetchFactors()
        }
    }

    const handleDisable = async (id: string) => {
        if (!confirm("Are you sure you want to disable 2FA? This will reduce your account security.")) return

        const res = await disableMFA(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("MFA Disabled")
            fetchFactors()
        }
    }

    const activeFactor = factors.find(f => f.status === 'verified')

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        )
    }

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Two-Factor Authentication (2FA)</CardTitle>
                        <CardDescription>Add an extra layer of security to your account using TOTP.</CardDescription>
                    </div>
                    {activeFactor ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Enabled
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-slate-500 flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" /> Disabled
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {!activeFactor && !enrollmentData && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800 text-center space-y-4">
                        <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-full shadow-sm flex items-center justify-center mx-auto">
                            <QrCode className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="max-w-xs mx-auto">
                            <h4 className="font-semibold text-slate-900 dark:text-white">Protect your account</h4>
                            <p className="text-sm text-slate-500 mt-1">Use an authenticator app like Google Authenticator or Authy to generate secure codes.</p>
                        </div>
                        <Button onClick={handleEnroll} disabled={isEnrolling} className="bg-blue-600 hover:bg-blue-700">
                            {isEnrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Setup 2FA Now
                        </Button>
                    </div>
                )}

                {enrollmentData && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex flex-col md:flex-row gap-6 items-center bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            {qrCodeUrl && (
                                <div className="bg-white p-2 rounded-lg shadow-md border-2 border-white">
                                    <img src={qrCodeUrl} alt="MFA QR Code" className="w-32 h-32" />
                                </div>
                            )}
                            <div className="flex-1 space-y-2 text-center md:text-left">
                                <h4 className="font-bold text-blue-900 dark:text-blue-100 text-lg">Scan this QR Code</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                    Open your authenticator app and scan the code above. If you can't scan, use the manual setup key.
                                </p>
                                <div className="mt-2 inline-block px-3 py-1 bg-white dark:bg-slate-800 rounded text-[10px] font-mono border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200">
                                    Secret: {enrollmentData.totp.secret}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 max-w-sm mx-auto">
                            <div className="space-y-2">
                                <Label htmlFor="mfa-code">Verification Code</Label>
                                <Input
                                    id="mfa-code"
                                    placeholder="000000"
                                    className="text-center text-2xl tracking-[0.5em] font-bold h-14"
                                    maxLength={6}
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                />
                                <p className="text-xs text-slate-500 text-center">Enter the 6-digit code from your app to verify.</p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setEnrollmentData(null)}>Cancel</Button>
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleVerify} disabled={isVerifying}>
                                    {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Verify & Enable
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {activeFactor && (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/30">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full">
                                <ShieldCheck className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Authenticator App (TOTP)</p>
                                <p className="text-xs text-slate-500">Active since {format(new Date(activeFactor.created_at), "MMM d, yyyy")}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDisable(activeFactor.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Disable
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function format(date: Date, formatStr: string) {
    // Simple mock since we already have date-fns but let's be safe if it's not imported correctly in client
    return date.toLocaleDateString()
}
