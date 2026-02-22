'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateProfile } from "@/app/actions/profile"
import { Loader2, Save, Mail, Briefcase, Building2, UserCircle, ShieldCheck } from "lucide-react"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DIVISIONS, POSITIONS_BY_DIVISION, Division } from "@/lib/office-structure"

type ProfileData = {
    id: string
    email: string
    full_name: string | null
    role: string | null
    department: string | null
    position_title: string | null
    supervisor_id: string | null
    avatar_url: string | null
}

type SupervisorData = {
    id: string
    full_name: string | null
    role: string | null
    position_title: string | null
}

export default function ProfileForm({
    initialData,
    supervisors
}: {
    initialData: any,
    supervisors: SupervisorData[]
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData.avatar_url)
    const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>(initialData.supervisor_id || 'none')
    const [selectedDivision, setSelectedDivision] = useState<string>(initialData.department || '')
    const [selectedPosition, setSelectedPosition] = useState<string>(initialData.position_title || '')

    const selectedSupervisor = supervisors.find(s => s.id === selectedSupervisorId)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await updateProfile(formData)

        if (result?.error) {
            toast.error(result.error)
        } else if (result?.success) {
            toast.success("Profile updated successfully")
        }
        setIsLoading(false)
    }

    return (
        <form action={handleSubmit} className="grid gap-6 md:grid-cols-12 max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">

            {/* Left Column: Identity Card */}
            <div className="md:col-span-4 space-y-6">
                <Card className="overflow-hidden border-white/40 shadow-xl bg-white/80 backdrop-blur-xl ring-1 ring-white/50">
                    <div className="h-32 relative overflow-hidden group">
                        {/* Animated Gradient Cover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 opacity-90 group-hover:scale-105 transition-transform duration-700"></div>
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20"></div>
                        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/30 to-transparent"></div>
                    </div>

                    <div className="px-6 relative">
                        <div className="-mt-16 mb-5 flex justify-center">
                            <AvatarUpload
                                userId={initialData.id}
                                currentUrl={avatarUrl}
                                userName={initialData.full_name || 'User'}
                                onUploadComplete={(url) => setAvatarUrl(url)}
                            />
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{initialData.full_name || 'Your Name'}</h2>
                            <p className="text-sm text-slate-500 font-medium mb-4">{initialData.position_title || 'No Position Title'}</p>

                            <div className="flex flex-wrap justify-center gap-2">
                                <Badge variant="secondary" className="bg-slate-100/80 backdrop-blur-sm text-slate-600 border-slate-200">
                                    {initialData.department || 'No Department'}
                                </Badge>
                                {(initialData.role === 'admin_staff' || initialData.role === 'division_chief' || initialData.role === 'head_of_office') && (
                                    <Badge className="bg-blue-600/90 hover:bg-blue-700 shadow-sm backdrop-blur-sm">
                                        <ShieldCheck className="w-3 h-3 mr-1" />
                                        {initialData.role === 'admin_staff' ? 'Administrative Staff' : initialData.role === 'head_of_office' ? 'Provincial Assessor' : 'Division Chief'}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Separator className="my-6 bg-slate-200/60" />

                        <div className="space-y-5 mb-8">
                            <div className="flex items-center text-sm group">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3 group-hover:bg-blue-100 transition-colors">
                                    <Mail className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="truncate text-slate-600 font-medium">{initialData.email}</span>
                            </div>
                            <div className="flex items-center text-sm group">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mr-3 group-hover:bg-purple-100 transition-colors">
                                    <Building2 className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="text-slate-600 font-medium">{initialData.department || 'Unassigned'}</span>
                            </div>
                            <div className="flex items-center text-sm group">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mr-3 group-hover:bg-indigo-100 transition-colors">
                                    <Briefcase className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="text-slate-600 font-medium">{initialData.role?.replace('_', ' ').toUpperCase() || 'PROJECT STAFF'}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Right Column: Edit Details */}
            <div className="md:col-span-8 space-y-6">

                {/* Personal Information */}
                <Card className="border-white/40 shadow-lg bg-white/60 backdrop-blur-xl ring-1 ring-white/50">
                    <CardHeader className="pb-4 border-b border-slate-100/50">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-blue-100/50 rounded-lg">
                                <UserCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-800">Personal Information</CardTitle>
                                <CardDescription>Update your basic profile details.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="full_name" className="text-slate-700 font-medium">Full Name</Label>
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    defaultValue={initialData.full_name || ''}
                                    placeholder="First Last"
                                    required
                                    className="bg-white/50 border-slate-200/80 focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                                <Input
                                    id="email"
                                    value={initialData.email}
                                    disabled
                                    className="bg-slate-100/50 text-slate-500 border-transparent cursor-not-allowed font-medium"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Employment Details */}
                <Card className="border-white/40 shadow-lg bg-white/60 backdrop-blur-xl ring-1 ring-white/50">
                    <CardHeader className="pb-4 border-b border-slate-100/50">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-indigo-100/50 rounded-lg">
                                <Briefcase className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-800">Employment Details</CardTitle>
                                <CardDescription>Manage your position and reporting lines.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <fieldset disabled={isLoading} className="space-y-6 group-disabled:opacity-80">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="position_title" className="text-slate-700 font-medium">Position Title</Label>
                                    <Select
                                        name="position_title"
                                        value={selectedPosition}
                                        onValueChange={setSelectedPosition}
                                        disabled={!selectedDivision}
                                    >
                                        <SelectTrigger className="bg-white/50 border-slate-200/80 focus:bg-white transition-all h-10 w-full">
                                            <SelectValue placeholder={selectedDivision ? "Select position" : "Select division first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedDivision && POSITIONS_BY_DIVISION[selectedDivision as Division]?.map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-slate-700 font-medium">System Role / Designation</Label>
                                    <Select
                                        name="role"
                                        defaultValue={initialData.role || 'project_staff'}
                                        disabled={
                                            // Lock if user has a special role AND is not Admin Staff
                                            (initialData.role === 'division_chief' || initialData.role === 'head_of_office') &&
                                            initialData.role !== 'admin_staff' &&
                                            initialData.department !== 'Administrative'
                                        }
                                    >
                                        <SelectTrigger className="bg-white/50 border-slate-200/80 focus:bg-white transition-all h-10 w-full">
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="project_staff">Project Staff</SelectItem>
                                            <SelectItem value="division_chief">Division Chief</SelectItem>
                                            <SelectItem value="head_of_office">Provincial Assessor</SelectItem>
                                            <SelectItem value="admin_staff">Administrative Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-amber-600 font-medium">
                                        {(initialData.role === 'division_chief' || initialData.role === 'head_of_office') && initialData.department !== 'Administrative' && initialData.role !== 'admin_staff'
                                            ? "* Role locked. Contact HR/Admin to change."
                                            : "* Changing this affects your access level."
                                        }
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="department" className="text-slate-700 font-medium">Department / Division</Label>
                                    <Select
                                        name="department"
                                        value={selectedDivision}
                                        onValueChange={(v) => {
                                            setSelectedDivision(v)
                                            setSelectedPosition('')
                                        }}
                                    >
                                        <SelectTrigger className="bg-white/50 border-slate-200/80 focus:bg-white transition-all h-10 w-full">
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DIVISIONS.map(d => (
                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="supervisor_id" className="text-slate-700 font-medium">Immediate Supervisor</Label>
                                    <Select
                                        name="supervisor_id"
                                        defaultValue={selectedSupervisorId || 'none'}
                                        onValueChange={setSelectedSupervisorId}
                                    >
                                        <SelectTrigger className="bg-white/50 border-slate-200/80 focus:bg-white transition-all h-10 w-full">
                                            <SelectValue placeholder="Select Supervisor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- No Supervisor Assigned --</SelectItem>
                                            {supervisors.map((sup) => (
                                                <SelectItem key={sup.id} value={sup.id}>
                                                    {sup.full_name || 'Unnamed Official'} ({sup.position_title || sup.role})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {selectedSupervisor && (
                                        <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50/50 border border-blue-100 rounded-lg">
                                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px] border border-white shadow-sm">
                                                {selectedSupervisor.full_name?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-semibold text-slate-800 truncate">{selectedSupervisor.full_name}</p>
                                                <p className="text-[10px] text-blue-600 truncate">{selectedSupervisor.position_title || selectedSupervisor.role}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </fieldset>
                    </CardContent>
                </Card>

                {/* Action Bar */}
                <div className="flex justify-end pt-4">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 px-8" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>

            </div>
        </form>
    )
}
