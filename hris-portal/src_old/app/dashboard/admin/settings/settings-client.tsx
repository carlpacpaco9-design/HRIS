'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { Building2, Save, Users } from 'lucide-react'
import { toast } from 'sonner'
import { initializeLeaveBalances } from '@/app/actions/settings'

export default function SettingsClient({ activeCycle, allCycles }: { activeCycle: any, allCycles: any[] }) {
    const [isInitializing, setIsInitializing] = useState(false)

    const handleInitializeLeaves = async () => {
        setIsInitializing(true)
        const res = await initializeLeaveBalances()
        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success('Leave balances initialized for all active employees!')
        }
        setIsInitializing(false)
    }

    return (
        <div className="p-6 pb-24 max-w-7xl mx-auto space-y-6">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
                <p className="text-slate-500">Configure office-wide parameters and system behavior.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Office Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            Office Information
                        </CardTitle>
                        <CardDescription>Read-only display of office identity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>Office Name</Label>
                            <Input readOnly value="Provincial Assessor's Office" className="bg-slate-50" />
                        </div>
                        <div className="space-y-1">
                            <Label>Address</Label>
                            <Input placeholder="Provincial Capitol, Philippines" />
                        </div>
                        <div className="space-y-1">
                            <Label>Contact number</Label>
                            <Input placeholder="(02) XXX-XXXX" />
                        </div>
                        <Button className="w-full">
                            <Save className="w-4 h-4 mr-2" /> Save Office Info
                        </Button>
                    </CardContent>
                </Card>

                {/* 2. SPMS Cycle Management */}
                <Card>
                    <CardHeader>
                        <CardTitle>SPMS Cycle Management</CardTitle>
                        <CardDescription>Manage active rating period.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>Current Active Cycle</Label>
                            <Input readOnly value={activeCycle?.name || 'No active cycle'} className="bg-blue-50 border-blue-200" />
                        </div>

                        <div className="space-y-1">
                            <Label>Set Active Cycle</Label>
                            <Select defaultValue={activeCycle?.id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a cycle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allCycles.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" className="w-full text-blue-600 bg-blue-50/50 hover:bg-blue-50 border-blue-200">
                            + Create New Cycle
                        </Button>
                    </CardContent>
                </Card>

                {/* 3. Leave Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-600" />
                            Leave Settings
                        </CardTitle>
                        <CardDescription>Manage default employee leave allocation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Default VL / Year</Label>
                                <Input type="number" defaultValue={15} />
                            </div>
                            <div className="space-y-1">
                                <Label>Default SL / Year</Label>
                                <Input type="number" defaultValue={15} />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-sm font-medium mb-2 text-slate-700">Annual Initialization</p>
                            <p className="text-xs text-slate-500 mb-4">
                                This will generate zeroed leave records for the current year ({new Date().getFullYear()})
                                for all active employees who do not currently have them.
                            </p>
                            <Button
                                className="w-full"
                                variant="destructive"
                                onClick={handleInitializeLeaves}
                                disabled={isInitializing}
                            >
                                {isInitializing ? 'Initializing...' : `Initialize ${new Date().getFullYear()} Balances`}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Working Days & Notification settings */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Working Hours Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label>Regular Work Days</Label>
                                <Input readOnly value="Monday - Friday" className="bg-slate-50" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label>AM Session</Label>
                                    <Input readOnly value="08:00 - 12:00" className="bg-slate-50" />
                                </div>
                                <div className="space-y-1">
                                    <Label>PM Session</Label>
                                    <Input readOnly value="13:00 - 17:00" className="bg-slate-50" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Email Notifications</Label>
                                <Input type="checkbox" className="w-4 h-4" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>In-app Notifications</Label>
                                <Input type="checkbox" className="w-4 h-4" defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
