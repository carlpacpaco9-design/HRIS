'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Shield, Signature, Monitor, Loader2, Upload } from "lucide-react"
import { updatePassword, uploadSignature } from "@/app/actions/settings"
import { useTheme } from "next-themes"
import { MfaSection } from "./mfa-section"

export function SettingsContent({ user, profile }: { user: any, profile: any }) {
    const { theme, setTheme } = useTheme()
    const [isPasswordLoading, setIsPasswordLoading] = useState(false)
    const [isUploadLoading, setIsUploadLoading] = useState(false)
    const [passwordData, setPasswordData] = useState({ password: '', confirm: '' })
    const [signaturePreview, setSignaturePreview] = useState(profile?.signature_url || null)

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordData.password !== passwordData.confirm) {
            toast.error("Passwords do not match")
            return
        }
        if (passwordData.password.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        setIsPasswordLoading(true)
        const res = await updatePassword(passwordData.password)
        setIsPasswordLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Password Updated Successfully")
            setPasswordData({ password: '', confirm: '' })
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type !== 'image/png') {
            toast.error("Please upload a PNG file with transparent background")
            return
        }

        const formData = new FormData()
        formData.append('file', file)

        setIsUploadLoading(true)
        const res = await uploadSignature(formData)
        setIsUploadLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Signature Uploaded Successfully")
            setSignaturePreview(res.url)
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your security, signature, and preferences.</p>
            </div>

            <Tabs defaultValue="security" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-12 bg-slate-100 dark:bg-slate-800 p-1">
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4" /> Security
                    </TabsTrigger>
                    <TabsTrigger value="signature" className="gap-2">
                        <Signature className="h-4 w-4" /> Signature
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="gap-2">
                        <Monitor className="h-4 w-4" /> Appearance
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: SECURITY */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Password Management</CardTitle>
                            <CardDescription>Secure your account by updating your password regularly.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handlePasswordUpdate}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={passwordData.password}
                                        onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={passwordData.confirm}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4">
                                <Button type="submit" disabled={isPasswordLoading}>
                                    {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    <div className="mt-8">
                        <MfaSection />
                    </div>
                </TabsContent>

                {/* TAB 2: DIGITAL SIGNATURE */}
                <TabsContent value="signature">
                    <Card>
                        <CardHeader>
                            <CardTitle>Digital Signature</CardTitle>
                            <CardDescription>Upload a transparent PNG of your signature to be used on official IPCR forms.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                {signaturePreview ? (
                                    <div className="relative group">
                                        <img
                                            src={signaturePreview}
                                            alt="E-Signature"
                                            className="max-h-32 object-contain filter dark:invert"
                                        />
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                            <p className="text-[10px] text-slate-500 font-medium">Current Signature</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-2">
                                        <Signature className="h-12 w-12 text-slate-300 mx-auto" />
                                        <p className="text-sm text-slate-500">No signature uploaded yet</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid w-full max-w-sm items-center gap-1.5 mx-auto">
                                <Label htmlFor="signature-upload" className="flex items-center gap-2 cursor-pointer bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-md transition-colors justify-center">
                                    {isUploadLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4" />
                                    )}
                                    {isUploadLoading ? "Uploading..." : "Click to Upload PNG"}
                                </Label>
                                <Input
                                    id="signature-upload"
                                    type="file"
                                    accept=".png"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploadLoading}
                                />
                                <p className="text-[11px] text-center text-slate-400 mt-2 italic">
                                    Note: Background must be transparent for best results on PDF forms.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: APPEARANCE */}
                <TabsContent value="appearance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Interface Appearance</CardTitle>
                            <CardDescription>Customize how the HRIS Portal looks on your device.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => setTheme("light")}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                                <div className="h-12 w-full bg-white border border-slate-200 rounded shadow-sm" />
                                <span className="text-sm font-medium">Light</span>
                            </button>
                            <button
                                onClick={() => setTheme("dark")}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-blue-600 bg-blue-900/20' : 'border-slate-100 hover:border-slate-200 dark:border-slate-800'}`}
                            >
                                <div className="h-12 w-full bg-slate-900 border border-slate-800 rounded shadow-sm" />
                                <span className="text-sm font-medium">Dark</span>
                            </button>
                            <button
                                onClick={() => setTheme("system")}
                                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-blue-600 bg-slate-100' : 'border-slate-100 hover:border-slate-200 dark:border-slate-800'}`}
                            >
                                <div className="h-12 w-full bg-gradient-to-r from-white to-slate-900 border border-slate-200 rounded shadow-sm" />
                                <span className="text-sm font-medium">System</span>
                            </button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
