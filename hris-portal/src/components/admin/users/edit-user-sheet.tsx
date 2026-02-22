'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Sheet, SheetContent, SheetDescription, SheetHeader,
    SheetTitle, SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { toast } from 'sonner'
import { DIVISIONS, POSITIONS_BY_DIVISION, Division, determineRole } from '@/lib/office-structure'
import { updateUser } from '@/app/actions/users'
import { Loader2 } from 'lucide-react'

export function EditUserSheet({
    user,
    isOpen,
    onOpenChange
}: {
    user: any
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [editForm, setEditForm] = useState({ role: '', division: '', position: '' })

    useEffect(() => {
        if (user) {
            setEditForm({
                role: user.role,
                division: user.division || '',
                position: user.position || ''
            })
        }
    }, [user])

    const handleEditUser = async () => {
        if (!user) return
        setIsLoading(true)

        const res = await updateUser(user.id, editForm)

        setIsLoading(false)

        if (res.success) {
            toast.success("User updated successfully")
            onOpenChange(false)
            router.refresh()
        } else {
            toast.error(res.error || "Failed to update user")
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit User Profile</SheetTitle>
                    <SheetDescription>Update role and assignment details for {user?.full_name}.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-6 py-6">
                    <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input value={user?.full_name || ''} disabled className="bg-slate-50" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Division</Label>
                        <Select value={editForm.division} onValueChange={val => setEditForm({ ...editForm, division: val as Division, position: '' })}>
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
                            value={editForm.position}
                            onValueChange={val => {
                                const suggestedRole = determineRole(val, editForm.division as Division)
                                setEditForm({ ...editForm, position: val, role: suggestedRole })
                            }}
                            disabled={!editForm.division}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={editForm.division ? "Select position" : "Select division first"} />
                            </SelectTrigger>
                            <SelectContent>
                                {editForm.division && POSITIONS_BY_DIVISION[editForm.division as Division]?.map(p => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Role</Label>
                        <Select value={editForm.role} onValueChange={v => setEditForm({ ...editForm, role: v })}>
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
                </div>
                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleEditUser} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
