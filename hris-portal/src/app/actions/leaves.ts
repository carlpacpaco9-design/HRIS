'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'
import { isHRManager, isDivisionChief, Role } from '@/lib/roles'
import { isTrackedLeave, calculateWorkingDays } from '@/lib/leave-utils'

export type GetLeavesFilter = {
    employeeId?: string
    status?: string
    year?: number
}

export type LeaveRequest = {
    id: string
    employee_id: string
    leave_type: string
    date_from: string
    date_to: string
    working_days: number
    reason: string
    status: string
    approved_by: string | null
    approved_at: string | null
    approval_remarks: string | null
    created_at: string
    profiles?: {
        full_name: string
        division: string
    }
}

export type LeaveBalance = {
    id: string
    employee_id: string
    year: number
    vacation_leave_total: number
    vacation_leave_used: number
    sick_leave_total: number
    sick_leave_used: number
    special_leave_total: number
    special_leave_used: number
    emergency_leave_total: number
    emergency_leave_used: number
}

// 1. getLeaveRequests
export async function getLeaveRequests(filter: GetLeavesFilter = {}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, division')
            .eq('id', user.id)
            .single()

        if (!profile) throw new Error('Profile not found')

        const role = profile.role as Role

        let query = supabase
            .from('leave_requests')
            .select('*, profiles(full_name, division)')
            .order('created_at', { ascending: false })

        if (filter.employeeId) {
            let allowed = false
            if (user.id === filter.employeeId) {
                allowed = true
            } else if (isHRManager(role)) {
                allowed = true
            } else if (isDivisionChief(role)) {
                const { data: targetProfile } = await supabase
                    .from('profiles')
                    .select('division')
                    .eq('id', filter.employeeId)
                    .single()
                if (targetProfile && targetProfile.division === profile.division) {
                    allowed = true
                }
            }
            if (!allowed) throw new Error('Forbidden')

            query = query.eq('employee_id', filter.employeeId)
        } else {
            // No specific employee
            if (isHRManager(role)) {
                // fetch all
            } else if (isDivisionChief(role)) {
                // Since we cannot join filter simply in eq without an inner join map,
                // we use a subquery or filter the results afterwards.
                // Actually supabase supports inner join filtering: 
                // query = query.eq('profiles.division', profile.division)
                // Note: For inner joins, we'd need !inner, but we'll fetch all and filter or use the inner syntax:
                query = supabase
                    .from('leave_requests')
                    .select('*, profiles!inner(full_name, division)')
                    .eq('profiles.division', profile.division)
                    .order('created_at', { ascending: false })
            } else {
                query = query.eq('employee_id', user.id)
            }
        }

        if (filter.status && filter.status !== 'all') {
            query = query.eq('status', filter.status)
        }

        // Since year filters created_at or date_from:
        if (filter.year) {
            query = query.gte('date_from', `${filter.year}-01-01`).lte('date_from', `${filter.year}-12-31`)
        }

        const { data, error } = await query

        if (error) throw error

        return { success: true, data: data as LeaveRequest[] }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 2. getLeaveBalance
export async function getLeaveBalance(employeeId: string, year: number) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        let { data: balance, error } = await supabase
            .from('leave_balances')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('year', year)
            .single()

        if (error && error.code === 'PGRST116') { // not found
            // Security: we can silently create default balance if requested (maybe restrict to HR or self)
            const { data: newBalance, error: insertError } = await supabase
                .from('leave_balances')
                .insert({
                    employee_id: employeeId,
                    year: year,
                    vacation_leave_total: 15,
                    vacation_leave_used: 0,
                    sick_leave_total: 15,
                    sick_leave_used: 0,
                    special_leave_total: 5,
                    special_leave_used: 0,
                    emergency_leave_total: 3,
                    emergency_leave_used: 0
                })
                .select()
                .single()

            if (insertError) throw insertError
            balance = newBalance
        } else if (error) {
            throw error
        }

        return { success: true, data: balance as LeaveBalance }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 3. fileLeaveRequest
export type FileLeaveInput = {
    leave_type: string
    date_from: string
    date_to: string
    reason: string
}

function getBalanceFieldMap(type: string): { total: keyof LeaveBalance, used: keyof LeaveBalance } | null {
    switch (type) {
        case 'Vacation Leave': return { total: 'vacation_leave_total', used: 'vacation_leave_used' }
        case 'Sick Leave': return { total: 'sick_leave_total', used: 'sick_leave_used' }
        default: return null
    }
}

export async function fileLeaveRequest(input: FileLeaveInput) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const workingDays = calculateWorkingDays(input.date_from, input.date_to)

        if (workingDays <= 0) {
            throw new Error('Invalid date range or no working days selected.')
        }

        const yearStr = input.date_from.split('-')[0]
        const year = parseInt(yearStr || new Date().getFullYear().toString())

        if (isTrackedLeave(input.leave_type)) {
            const bRes = await getLeaveBalance(user.id, year)
            if (!bRes.success || !bRes.data) throw new Error('Failed to retrieve leave balance')

            const map = getBalanceFieldMap(input.leave_type)
            if (map) {
                const total = bRes.data[map.total] as number
                const used = bRes.data[map.used] as number
                const remaining = total - used

                if (workingDays > remaining) {
                    throw new Error(`Insufficient leave balance. You have ${remaining} days remaining, but requested ${workingDays} working days.`)
                }
            }
        }

        const { data, error } = await supabase
            .from('leave_requests')
            .insert({
                employee_id: user.id,
                leave_type: input.leave_type,
                date_from: input.date_from,
                date_to: input.date_to,
                working_days: workingDays,
                reason: input.reason,
                status: 'pending_approval'
            })
            .select()
            .single()

        if (error) throw error

        await logActivity('leave.filed', 'leave_requests', data.id, { input })
        revalidatePath('/dashboard/leaves')
        revalidatePath('/dashboard/approvals')

        return { success: true, data }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 4. approveLeave
export async function approveLeave(leaveId: string, remarks?: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) {
            throw new Error('Forbidden')
        }

        const { data: leave, error: fetchErr } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('id', leaveId)
            .single()

        if (fetchErr || !leave) throw new Error('Leave request not found')
        if (leave.status !== 'pending_approval') throw new Error('Only pending leaves can be approved')

        // UPDATE status
        const { error: updErr } = await supabase
            .from('leave_requests')
            .update({
                status: 'approved',
                approved_by: user.id,
                approved_at: new Date().toISOString(),
                approval_remarks: remarks || null
            })
            .eq('id', leaveId)

        if (updErr) throw updErr

        // Deduct balance
        if (isTrackedLeave(leave.leave_type)) {
            const yearStr = leave.date_from.split('-')[0]
            const year = parseInt(yearStr || new Date().getFullYear().toString())
            const { error: rpcErr } = await supabase.rpc('deduct_leave_balance', {
                p_employee_id: leave.employee_id,
                p_year: year,
                p_leave_type: leave.leave_type,
                p_days: leave.working_days
            })

            if (rpcErr) {
                throw new Error('Approved, but failed to deduct balance: ' + rpcErr.message)
            }
        }

        await logActivity('leave.approved', 'leave_requests', leaveId, { remarks })
        revalidatePath('/dashboard/leaves')
        revalidatePath('/dashboard/approvals')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 5. rejectLeave
export async function rejectLeave(leaveId: string, remarks: string) {
    try {
        if (!remarks) throw new Error('Rejection missing required remarks')

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) {
            throw new Error('Forbidden')
        }

        const { data: leave, error: fetchErr } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('id', leaveId)
            .single()

        if (fetchErr || !leave) throw new Error('Leave request not found')
        if (leave.status !== 'pending_approval') throw new Error('Only pending leaves can be rejected')

        const { error: updErr } = await supabase
            .from('leave_requests')
            .update({
                status: 'rejected',
                approved_by: user.id,
                approved_at: new Date().toISOString(),
                approval_remarks: remarks
            })
            .eq('id', leaveId)

        if (updErr) throw updErr

        await logActivity('leave.rejected', 'leave_requests', leaveId, { remarks })
        revalidatePath('/dashboard/leaves')
        revalidatePath('/dashboard/approvals')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 6. cancelLeave
export async function cancelLeave(leaveId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile) throw new Error('Profile not found')
        const role = profile.role as Role

        const { data: leave, error: fetchErr } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('id', leaveId)
            .single()

        if (fetchErr || !leave) throw new Error('Leave request not found')

        const isPending = leave.status === 'pending_approval'
        const isApproved = leave.status === 'approved'

        // Auth logic
        if (leave.employee_id === user.id) {
            if (!isPending) throw new Error('Employees can only cancel their own pending leaves')
        } else {
            if (!isHRManager(role)) throw new Error('Forbidden')
            if (!isPending && !isApproved) throw new Error('Can only cancel pending or approved leaves')
        }

        // Cancel logic
        const { error: updErr } = await supabase
            .from('leave_requests')
            .update({
                status: 'cancelled',
                approval_remarks: isHRManager(role) && isApproved ? 'Cancelled by HR Manager' : 'Cancelled by employee'
            })
            .eq('id', leaveId)

        if (updErr) throw updErr

        let restored = false
        // Restore balance if approved
        if (isApproved && isTrackedLeave(leave.leave_type)) {
            const yearStr = leave.date_from.split('-')[0]
            const year = parseInt(yearStr || new Date().getFullYear().toString())
            const map = getBalanceFieldMap(leave.leave_type)
            if (map) {
                // Find current balance to manually subtract the usage
                const { data: cBal } = await supabase.from('leave_balances').select('*').eq('employee_id', leave.employee_id).eq('year', year).single()
                if (cBal) {
                    const currentUsed = cBal[map.used] as number
                    const newUsed = Math.max(0, currentUsed - leave.working_days)
                    await supabase.from('leave_balances').update({ [map.used]: newUsed }).eq('id', cBal.id)
                    restored = true
                }
            }
        }

        await logActivity('leave.cancelled', 'leave_requests', leaveId, { restoredBalance: restored })
        revalidatePath('/dashboard/leaves')
        revalidatePath('/dashboard/approvals')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// 7. adjustLeaveBalance
export async function adjustLeaveBalance(employeeId: string, year: number, leaveType: string, newTotal: number) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) {
            throw new Error('Forbidden')
        }

        const map = getBalanceFieldMap(leaveType)
        if (!map) throw new Error('Invalid tracked leave type')

        const resBal = await getLeaveBalance(employeeId, year) // auto creates if not exist
        if (!resBal.success || !resBal.data) throw new Error('Could not resolve leave balance')

        const before = resBal.data[map.total]
        const { error: updErr } = await supabase
            .from('leave_balances')
            .update({ [map.total]: newTotal })
            .eq('id', resBal.data.id)

        if (updErr) throw updErr

        await logActivity('leave.balance_adjusted', 'leave_balances', resBal.data.id, {
            type: leaveType, year, before, after: newTotal
        })
        revalidatePath('/dashboard/leaves')

        return { success: true }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}

// Initialize all balances for a specific year (bulk)
export async function initializeBalancesForYear(year: number) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!profile || !isHRManager(profile.role as Role)) {
            throw new Error('Forbidden')
        }

        const { data: users, error: profErr } = await supabase.from('profiles').select('id').eq('is_active', true)
        if (profErr) throw profErr

        let initialized = 0
        for (const u of users) {
            const { data: existing } = await supabase.from('leave_balances').select('id').eq('employee_id', u.id).eq('year', year).single()
            if (!existing) {
                await supabase.from('leave_balances').insert({
                    employee_id: u.id,
                    year: year,
                    vacation_leave_total: 15,
                    vacation_leave_used: 0,
                    sick_leave_total: 15,
                    sick_leave_used: 0,
                    special_leave_total: 5,
                    special_leave_used: 0,
                    emergency_leave_total: 3,
                    emergency_leave_used: 0
                })
                initialized++
            }
        }

        await logActivity('leave.mass_initialize', 'system', 'all', { year, initialized })
        return { success: true, initialized }
    } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'An error occurred' }
    }
}
