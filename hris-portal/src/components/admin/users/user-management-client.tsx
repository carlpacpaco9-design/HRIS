'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    MoreHorizontal, UserPlus, Search,
    RefreshCw, Power, PowerOff, Edit
} from "lucide-react"
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Import actions & components
import { deactivateUser, reactivateUser } from '@/app/actions/users'
import { CreateUserDialog } from './create-user-dialog'
import { EditUserSheet } from './edit-user-sheet'
import { ResetPasswordDialog } from './reset-password-dialog'

const ROLES_INFO = [
    { value: 'project_staff', label: 'Project Staff', color: 'bg-slate-100 text-slate-700' },
    { value: 'division_chief', label: 'Division Chief', color: 'bg-blue-100 text-blue-700' },
    { value: 'head_of_office', label: 'Provincial Assessor', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'admin_staff', label: 'Administrative Staff', color: 'bg-rose-100 text-rose-700' }
]

export function UserManagementClient({ initialUsers }: { initialUsers: any[] }) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    // Dialog States
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
    const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)

    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Filter Logic
    const filteredUsers = initialUsers.filter(user => {
        const matchesSearch =
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.division?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' ? user.is_active : !user.is_active)

        return matchesSearch && matchesRole && matchesStatus
    })

    // Stats
    const stats = {
        total: initialUsers.length,
        active: initialUsers.filter(u => u.is_active).length,
        inactive: initialUsers.filter(u => !u.is_active).length,
        admins: initialUsers.filter(u => u.role === 'admin_staff').length
    }

    const handleToggleActive = async () => {
        if (!selectedUser) return
        setIsLoading(true)

        let res
        if (selectedUser.is_active) {
            res = await deactivateUser(selectedUser.id)
        } else {
            res = await reactivateUser(selectedUser.id)
        }

        setIsLoading(false)

        if (res.success) {
            toast.success(`User ${selectedUser.is_active ? 'deactivated' : 'reactivated'}`)
            setIsDeactivateOpen(false)
            router.refresh()
        } else {
            toast.error(res.error)
        }
    }

    function getInitials(name: string) {
        if (!name) return '?'
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h1>
                    <p className="text-slate-500">Manage staff accounts, roles, and access.</p>
                </div>
                <Button onClick={() => setIsAddUserOpen(true)} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
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
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
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
                        {ROLES_INFO.map(r => (
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
                                            <Search className="h-8 w-8 text-slate-300" />
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
                                const roleConfig = ROLES_INFO.find(r => r.value === user.role)
                                return (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-[#1E3A5F]/10 text-[#1E3A5F] font-semibold text-xs">
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
                                            <Badge variant="secondary" className={roleConfig?.color || 'bg-slate-100 text-slate-700'}>
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
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedUser(user)
                                                        setIsEditSheetOpen(true)
                                                    }}>
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

            <CreateUserDialog
                isOpen={isAddUserOpen}
                onOpenChange={setIsAddUserOpen}
            />

            <EditUserSheet
                user={selectedUser}
                isOpen={isEditSheetOpen}
                onOpenChange={setIsEditSheetOpen}
            />

            <ResetPasswordDialog
                user={selectedUser}
                isOpen={isResetPasswordOpen}
                onOpenChange={setIsResetPasswordOpen}
            />

            {/* Deactivate/Reactivate AlertDialog */}
            <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {selectedUser?.is_active ? 'Deactivate User?' : 'Reactivate User?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedUser?.is_active
                                ? `Are you sure you want to deactivate ${selectedUser?.full_name}? They will no longer be able to log in.`
                                : `Are you sure you want to reactivate ${selectedUser?.full_name}? They will regain access to the system.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                            variant={selectedUser?.is_active ? "destructive" : "default"}
                            onClick={handleToggleActive}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : (selectedUser?.is_active ? 'Deactivate' : 'Reactivate')}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    )
}
