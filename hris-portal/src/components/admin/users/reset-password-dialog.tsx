'use client'

import { useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import { resetUserPassword } from '@/app/actions/users'
import { Loader2 } from 'lucide-react'

export function ResetPasswordDialog({
    user,
    isOpen,
    onOpenChange
}: {
    user: any
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [resetForm, setResetForm] = useState({ new: '', confirm: '' })

    const handleResetPassword = async () => {
        if (!user) return
        if (resetForm.new !== resetForm.confirm) {
            toast.error("Passwords do not match")
            return
        }
        if (resetForm.new.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)
        const res = await resetUserPassword(user.id, resetForm.new)
        setIsLoading(false)

        if (res.success) {
            toast.success("Password reset successfully")
            onOpenChange(false)
            setResetForm({ new: '', confirm: '' })
        } else {
            toast.error(res.error)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>Set a new password for {user?.full_name}.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>New Password</Label>
                        <Input type="password" value={resetForm.new} onChange={e => setResetForm({ ...resetForm, new: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Confirm Password</Label>
                        <Input type="password" value={resetForm.confirm} onChange={e => setResetForm({ ...resetForm, confirm: e.target.value })} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleResetPassword} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
