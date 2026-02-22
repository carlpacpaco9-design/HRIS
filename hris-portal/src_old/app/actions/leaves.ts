'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/audit-logger"
import { notifyUser } from "@/lib/notifications"
import { isHRManager, isDivisionChief } from "@/lib/roles"

// Helper
function err(message: string) { return { error: message } }

export type LeaveRequest = {
    id: string
    user_id: string
    employee_id?: string // Some queries use employee_id
    leave_type: string
    start_date: string
    end_date: string
    reason: string
    status: 'pending_recommendation' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled'
    created_at: string
    recommended_by?: string
    recommended_at?: string
    approved_by?: string
    approved_at?: string
    remarks?: string
}

export async function getLeaveBalances(userId?: string) {
    const supabase = await createClient()

    if (!userId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        userId = user.id
    }

    const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('year', new Date().getFullYear())
        .single()

    if (error) {
        console.error("Error fetching leave balances:", error)
        return null
    }

    return data
}

export async function getLeaveApplications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .or(`user_id.eq.${user.id},employee_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching leave applications:", error)
        return []
    }

    return data as LeaveRequest[]
}

/**
 * PHASE 3D — SUBMIT LEAVE
 * Correct chain of command logic
 */
export async function submitLeaveApplication(data: {
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    is_half_day?: boolean;
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = profile?.role || 'project_staff'

    // VALIDATE LEAVE BALANCE PRE-INSERTION
    const dateFrom = new Date(data.start_date);
    const dateTo = new Date(data.end_date);
    let workingDays = 0;
    let current = new Date(dateFrom);

    while (current <= dateTo) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) { // Not weekend
            workingDays++;
        }
        current.setDate(current.getDate() + 1);
    }

    if (data.is_half_day) workingDays = 0.5;

    if (workingDays > 0) {
        const balances = await getLeaveBalances(user.id);
        if (balances) {
            let available = 0;
            const t = data.leave_type.toLowerCase();
            if (t.includes('sick')) available = balances.sick_leave - balances.sick_leave_used;
            else if (t.includes('vacation')) available = balances.vacation_leave - balances.vacation_leave_used;
            else if (t.includes('special')) available = balances.special_leave - balances.special_leave_used;
            else if (t.includes('forced')) available = balances.forced_leave - balances.forced_leave_used;

            if (workingDays > available) {
                return { error: `Insufficient leave balance. You have ${available} days remaining.` }
            }
        }
    }

    /**
     * LOGIC:
     * 1. Project Staff -> pending_recommendation
     * 2. Division Chief -> pending_approval (skips recommendation)
     * 3. Administrative Staff/Provincial Assessor -> pending_approval (peer review)
     */
    let initialStatus: LeaveRequest['status'] = 'pending_recommendation'

    if (isDivisionChief(role as any) || isHRManager(role as any)) {
        initialStatus = 'pending_approval'
    }

    const { error } = await supabase
        .from('leave_requests')
        .insert({
            user_id: user.id,
            employee_id: user.id, // For backward compatibility with some queries
            leave_type: data.leave_type,
            start_date: data.start_date,
            end_date: data.end_date,
            reason: data.reason,
            is_half_day: data.is_half_day || false,
            status: initialStatus
        })

    if (error) return { error: error.message }

    await logActivity('LEAVE_APPLICATION_SUBMITTED', 'LEAVE', 'new', {
        type: data.leave_type,
        status: initialStatus
    })

    revalidatePath('/dashboard/leaves')
    return { success: true }
}

/**
 * PHASE 3D — RECOMMEND LEAVE
 * Only for Division Chiefs
 */
export async function recommendLeave(leaveId: string, remarks?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, division')
        .eq('id', user.id)
        .single()

    if (!isDivisionChief(profile?.role as any)) {
        return err('Only Division Chiefs can recommend leaves')
    }

    // SCENARIO TEST 4D: Ensure division chief only recommends for their own division
    const { data: leave } = await supabase
        .from('leave_requests')
        .select('*, employee:profiles!user_id(division)')
        .eq('id', leaveId)
        .single()

    if (!leave) return err('Not found')
    if (leave.employee?.division !== profile?.division) {
        return err('Forbidden')
    }

    const { error } = await supabase
        .from('leave_requests')
        .update({
            status: 'pending_approval',
            recommended_by: user.id,
            recommended_at: new Date().toISOString(),
            recommendation_remarks: remarks || null
        })
        .eq('id', leaveId)
        .eq('status', 'pending_recommendation')

    if (error) return err(error.message)

    revalidatePath('/dashboard/approvals')
    revalidatePath('/dashboard/leaves')
    return { success: true }
}

export async function approveLeaveApplication(leaveId: string, remarks?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!isHRManager(profile?.role as any)) {
        return err('Forbidden')
    }

    const { data: leave } = await supabase
        .from('leave_requests')
        .select('*, employee:profiles!user_id(*)')
        .eq('id', leaveId)
        .single()

    if (!leave) return err('Leave not found')
    if (leave.status !== 'pending_approval') {
        return err('Leave is not awaiting approval')
    }

    const { error } = await supabase
        .from('leave_requests')
        .update({
            status: 'approved',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            remarks: remarks ?? null
        })
        .eq('id', leaveId)

    if (error) return err(error.message)

    try {
        const dateFrom = new Date(leave.start_date);
        const dateTo = new Date(leave.end_date);
        let workingDays = 0;
        let current = new Date(dateFrom);

        while (current <= dateTo) {
            const day = current.getDay();
            if (day !== 0 && day !== 6) { // Not weekend
                workingDays++;
            }
            current.setDate(current.getDate() + 1);
        }

        let p_column = 'vacation_leave_used';
        const t = leave.leave_type.toLowerCase();
        if (t.includes('sick')) p_column = 'sick_leave_used';
        else if (t.includes('special')) p_column = 'special_leave_used';
        else if (t.includes('forced')) p_column = 'forced_leave_used';

        await supabase.rpc('deduct_leave_balance', {
            p_employee_id: leave.user_id,
            p_year: new Date().getFullYear(),
            p_column: p_column,
            p_days: workingDays
        });
    } catch (e) {
        console.error('Failed to deduct leave balance', e);
    }

    if (leave.employee) {
        await notifyUser({
            type: 'leave.approved',
            recipient_id: leave.user_id,
            title: 'Leave Approved',
            message: `Your ${leave.leave_type} has been approved.`,
            entity_type: 'leave',
            entity_id: leaveId,
            action_url: '/dashboard/leaves'
        }, leave.employee.email, leave.employee.full_name)
    }

    revalidatePath('/dashboard/approvals')
    revalidatePath('/dashboard/leaves')
    return { success: true }
}

export async function rejectLeaveApplication(leaveId: string, reason: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return err('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // Both HR Managers and Division Chiefs can Reject
    const role = profile?.role as any
    if (!isHRManager(role) && !isDivisionChief(role)) {
        return err('Unauthorized to reject leaves')
    }

    const { data: leave } = await supabase
        .from('leave_requests')
        .select('*, employee:profiles!user_id(*)')
        .eq('id', leaveId)
        .single()

    if (!leave) return err('Leave not found')

    const { error } = await supabase
        .from('leave_requests')
        .update({
            status: 'rejected',
            approved_by: user.id,
            approved_at: new Date().toISOString(),
            remarks: reason
        })
        .eq('id', leaveId)

    if (error) return err(error.message)

    if (leave.employee) {
        await notifyUser({
            type: 'leave.rejected',
            recipient_id: leave.user_id,
            title: 'Leave Rejected',
            message: `Your leave request was rejected. Reason: ${reason}`,
            entity_type: 'leave',
            entity_id: leaveId,
            action_url: '/dashboard/leaves'
        }, leave.employee.email, leave.employee.full_name)
    }

    revalidatePath('/dashboard/approvals')
    revalidatePath('/dashboard/leaves')
    return { success: true }
}

export async function cancelLeaveApplication(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .in('status', ['pending_recommendation', 'pending_approval'])

    if (error) return err("Failed to cancel leave")

    revalidatePath('/dashboard/leaves')
    return { success: true }
}

