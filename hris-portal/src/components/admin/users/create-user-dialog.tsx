'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { toast } from 'sonner'
import { DIVISIONS, POSITIONS_BY_DIVISION, Division, determineRole } from '@/lib/office-structure'
import { createUser } from '@/app/actions/users'
import { Loader2 } from 'lucide-react'

export function CreateUserDialog({
    isOpen,
    onOpenChange
}: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [newUser, setNewUser] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'project_staff',
        division: '',
        position: '',
        id_number: ''
    })

    const handleAddUser = async () => {
        if (!newUser.full_name || !newUser.email || !newUser.password || !newUser.division || !newUser.position || !newUser.id_number) {
            toast.error("Please fill in all required fields")
            return
        }
        if (newUser.password.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)
        const res = await createUser(newUser)
        setIsLoading(false)

        if (res.success) {
            toast.success("User created successfully")
            onOpenChange(false)
            setNewUser({ full_name: '', email: '', password: '', role: 'project_staff', division: '', position: '', id_number: '' })
            router.refresh()
        } else {
            toast.error(res.error || "Failed to create user")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Add New Staff</DialogTitle>
                    <DialogDescription>Create a new account for a staff member. They can use the password you set to log in initially.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="fullname">Full Name</Label>
                        <Input id="fullname" value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} placeholder="e.g., Juan Dela Cruz" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="juan@example.com" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Temporary Password</Label>
                        <Input id="password" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="At least 8 characters" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Division</Label>
                        <Select value={newUser.division} onValueChange={v => setNewUser({ ...newUser, division: v as Division, position: '' })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select division" />
                            </SelectTrigger>
                            <SelectContent>
                                {DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Position Title</Label>
                        <Select
                            value={newUser.position}
                            onValueChange={v => {
                                const suggestedRole = determineRole(v, newUser.division as Division)
                                setNewUser({ ...newUser, position: v, role: suggestedRole })
                            }}
                            disabled={!newUser.division}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={newUser.division ? "Select position" : "Select division first"} />
                            </SelectTrigger>
                            <SelectContent>
                                {newUser.division && POSITIONS_BY_DIVISION[newUser.division as Division]?.map(p => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Role</Label>
                            <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="head_of_office">Office Head</SelectItem>
                                    <SelectItem value="admin_staff">Administrative Staff</SelectItem>
                                    <SelectItem value="division_chief">Division Chief</SelectItem>
                                    <SelectItem value="project_staff">Project Staff</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">
                                Role is auto-suggested based on position and division. You may override if needed.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label>Employee ID Number</Label>
                            <Input value={newUser.id_number} onChange={e => setNewUser({ ...newUser, id_number: e.target.value })} placeholder="e.g., 2026-0001" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleAddUser} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Creating...' : 'Create Account'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
