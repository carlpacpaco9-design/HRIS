'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {
    Sheet, SheetContent, SheetDescription, SheetHeader,
    SheetTitle, SheetFooter
} from "@/components/ui/sheet"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    MoreHorizontal, UserPlus, Search, ShieldCheck,
    Briefcase, AlertCircle, RefreshCw, Power, PowerOff, Edit
} from "lucide-react"
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
// Import actions
import {
    createStaff, updateUserRole, updateUserDivision, updateUserPosition,
    toggleUserActive, resetUserPassword
} from '@/app/actions/admin-users'
import { DIVISIONS, POSITIONS_BY_DIVISION, Division, determineRole } from '@/lib/office-structure'

type User = {
    id: string
    full_name: string
    email: string
    role: string
    division: string
    position_title: string
    employee_number: string
    is_active: boolean
    created_at: string
}

const ROLES = [
    { value: 'project_staff', label: 'Project Staff', color: 'bg-slate-100 text-slate-700' },
    { value: 'division_chief', label: 'Division Chief', color: 'bg-blue-100 text-blue-700' },
    { value: 'head_of_office', label: 'Provincial Assessor', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'admin_staff', label: 'Administrative Staff', color: 'bg-rose-100 text-rose-700' }
]

// Divisions are now imported from office-structure.ts

export function UserManagementClient({ initialUsers }: { initialUsers: User[] }) {
    const router = useRouter()
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [isLoading, setIsLoading] = useState(false)

    // Dialog States
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
    const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)

    // Form States
    const [newUser, setNewUser] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'project_staff',
        division: '',
        position: '',
        id_number: ''
    })
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editForm, setEditForm] = useState({ role: '', division: '', position: '' })
    const [resetPassword, setResetPassword] = useState({ new: '', confirm: '' })

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.division?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' ? user.is_active : !user.is_active)

        return matchesSearch && matchesRole && matchesStatus
    })

    // Stats
    const stats = {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        inactive: users.filter(u => !u.is_active).length,
        admins: users.filter(u => u.role === 'admin_staff').length
    }

    // Handlers
    const handleAddUser = async () => {
        if (!newUser.full_name || !newUser.email || !newUser.password) {
            toast.error("Please fill in required fields")
            return
        }
        if (newUser.password.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)
        const res = await createStaff(newUser)
        setIsLoading(false)

        if (res.success) {
            toast.success("User created successfully")
            setIsAddUserOpen(false)
            setNewUser({ full_name: '', email: '', password: '', role: 'project_staff', division: '', position: '', id_number: '' })
            router.refresh()
        } else {
            toast.error(res.error || "Failed to create user")
        }
    }

    const handleEditUser = async () => {
        if (!selectedUser) return
        setIsLoading(true)

        // Update role
        if (editForm.role !== selectedUser.role) {
            const res = await updateUserRole(selectedUser.id, editForm.role)
            if (!res.success) toast.error("Failed to update role")
        }

        // Update division
        if (editForm.division !== selectedUser.division) {
            const res = await updateUserDivision(selectedUser.id, editForm.division)
            if (!res.success) toast.error("Failed to update division")
        }

        // Update position
        if (editForm.position !== selectedUser.position_title) {
            const res = await updateUserPosition(selectedUser.id, editForm.position)
            if (!res.success) toast.error("Failed to update position")
        }

        setIsLoading(false)
        toast.success("User updated")
        setIsEditSheetOpen(false)
        router.refresh()
    }

    const handleResetPassword = async () => {
        if (!selectedUser) return
        if (resetPassword.new !== resetPassword.confirm) {
            toast.error("Passwords do not match")
            return
        }
        if (resetPassword.new.length < 8) {
            toast.error("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)
        const res = await resetUserPassword(selectedUser.id, resetPassword.new)
        setIsLoading(false)

        if (res.success) {
            toast.success("Password reset successfully")
            setIsResetPasswordOpen(false)
            setResetPassword({ new: '', confirm: '' })
        } else {
            toast.error(res.error)
        }
    }

    const handleToggleActive = async () => {
        if (!selectedUser) return
        setIsLoading(true)
        const newState = !selectedUser.is_active
        const res = await toggleUserActive(selectedUser.id, newState)
        setIsLoading(false)

        if (res.success) {
            toast.success(`User ${newState ? 'activated' : 'deactivated'}`)
            setIsDeactivateOpen(false)
            router.refresh()
        } else {
            toast.error(res.error)
        }
    }

    const openEdit = (user: User) => {
        setSelectedUser(user)
        setEditForm({ role: user.role, division: user.division || '', position: user.position_title || '' })
        setIsEditSheetOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
                    <p className="text-slate-500">Manage staff accounts, roles, and access.</p>
                </div>
                <Button onClick={() => setIsAddUserOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-slate-500 mb-1">Total Users</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-slate-500 mb-1">Active</div>
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-slate-500 mb-1">Inactive</div>
                    <div className="text-2xl font-bold text-slate-400">{stats.inactive}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="text-sm font-medium text-slate-500 mb-1">Admin Staff</div>
                    <div className="text-2xl font-bold text-rose-600">{stats.admins}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 p-4 rounded-lg border">
                <div className="relative w-full sm:w-[300px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search users..."
                        className="pl-9 bg-white"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-white">
                        <SelectValue placeholder="Filter Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {ROLES.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-white">
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="w-[300px]">Staff Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Division</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">No users found</p>
                                            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                                                We couldn't find any users matching your criteria. Try adjusting your search or filters.
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => {
                                const roleConfig = ROLES.find(r => r.value === user.role)
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-blue-50 text-blue-600 font-semibold text-xs">
                                                        {getInitials(user.full_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium text-slate-900">{user.full_name}</div>
                                                    <div className="text-xs text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={roleConfig?.color || 'bg-slate-100'}>
                                                {roleConfig?.label || user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm">
                                            {user.division || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={user.is_active ?
                                                "border-green-200 text-green-700 bg-green-50" :
                                                "border-slate-200 text-slate-500 bg-slate-50"
                                            }>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openEdit(user)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Role/Division
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedUser(user)
                                                        setIsResetPasswordOpen(true)
                                                    }}>
                                                        <RefreshCw className="mr-2 h-4 w-4" /> Reset Password
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className={user.is_active ? "text-red-600" : "text-green-600"}
                                                        onClick={() => {
                                                            setSelectedUser(user)
                                                            setIsDeactivateOpen(true)
                                                        }}
                                                    >
                                                        {user.is_active ? (
                                                            <><PowerOff className="mr-2 h-4 w-4" /> Deactivate User</>
                                                        ) : (
                                                            <><Power className="mr-2 h-4 w-4" /> Reactivate User</>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add User Dialog */}
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Staff</DialogTitle>
                        <DialogDescription>Create a new account for a staff member. They can use the password you set to log in initially.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullname">Full Name</Label>
                            <Input id="fullname" value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Temporary Password</Label>
                            <Input id="password" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
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
                                <p className="text-xs text-muted-foreground">
                                    Role is auto-suggested based on position and division. You may override if needed.
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label>ID Number</Label>
                                <Input value={newUser.id_number} onChange={e => setNewUser({ ...newUser, id_number: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddUser} disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Account'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Sheet */}
            <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Edit User Profile</SheetTitle>
                        <SheetDescription>Update role and assignment details for {selectedUser?.full_name}.</SheetDescription>
                    </SheetHeader>
                    <div className="grid gap-6 py-6">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input value={selectedUser?.full_name || ''} disabled className="bg-slate-50" />
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
                            <p className="text-xs text-muted-foreground">
                                Role is auto-suggested based on position and division. You may override if needed.
                            </p>
                        </div>
                    </div>
                    <SheetFooter>
                        <Button variant="outline" onClick={() => setIsEditSheetOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditUser} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Reset Password Dialog */}
            <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>Set a new password for {selectedUser?.full_name}.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>New Password</Label>
                            <Input type="password" value={resetPassword.new} onChange={e => setResetPassword({ ...resetPassword, new: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Confirm Password</Label>
                            <Input type="password" value={resetPassword.confirm} onChange={e => setResetPassword({ ...resetPassword, confirm: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>Cancel</Button>
                        <Button onClick={handleResetPassword} disabled={isLoading}>{isLoading ? 'Resetting...' : 'Reset Password'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deactivate Dialog */}
            <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedUser?.is_active ? 'Deactivate User?' : 'Reactivate User?'}</DialogTitle>
                        <DialogDescription>
                            {selectedUser?.is_active
                                ? `Are you sure you want to deactivate ${selectedUser?.full_name}? They will no longer be able to log in.`
                                : `Are you sure you want to reactivate ${selectedUser?.full_name}? They will regain access to the system.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeactivateOpen(false)}>Cancel</Button>
                        <Button
                            variant={selectedUser?.is_active ? "destructive" : "default"}
                            onClick={handleToggleActive}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : (selectedUser?.is_active ? 'Deactivate' : 'Reactivate')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
