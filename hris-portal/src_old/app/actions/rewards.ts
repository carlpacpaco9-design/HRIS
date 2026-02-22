'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'
import {
    AwardType,
    AwardStatus,
    EligibleStaff,
    RewardInput,
    RewardsSummary,
} from '@/types/rewards'
import { buildNotificationContent, notifyUser } from '@/lib/notifications'

// ── HELPERS ──────────────────────────────────────────

async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, division_id, full_name')
        .eq('id', user.id)
        .single()

    if (!profile) throw new Error('User profile not found')
    return { user, profile, supabase }
}

// ── QUERIES ──────────────────────────────────────────

/**
 * Get all rewards visible to the current user.
 * - Project Staff: own rewards only
 * - Division Chief: own division staff's rewards
 * - Provincial Assessor/PMT/Administrative Staff: all rewards
 */
export async function getRewards(filters?: {
    status?: AwardStatus
    award_type?: AwardType
    rating_period_id?: string
    division_id?: string
    staff_id?: string
}) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        let query = supabase
            .from('rewards_incentives')
            .select(`
                *,
                staff:profiles!rewards_incentives_employee_id_fkey(full_name, avatar_url),
                division:divisions(name, code),
                rating_period:rating_periods(name),
                ipcr_form:ipcr_forms(final_average_rating, adjectival_rating),
                awarded_by_profile:profiles!rewards_incentives_awarded_by_fkey(full_name)
            `)
            .order('created_at', { ascending: false })

        // Role-based visibility
        if (profile.role === 'project_staff') {
            query = query.eq('employee_id', profile.id)
        } else if (profile.role === 'division_chief') {
            // Division chief sees own division's awards
            const { data: divStaff } = await supabase
                .from('profiles')
                .select('id')
                .eq('division_id', profile.division_id)
            const staffIds = (divStaff || []).map((e: any) => e.id)
            if (staffIds.length > 0) {
                query = query.in('employee_id', staffIds)
            } else {
                return { data: [] }
            }
        }
        // Provincial Assessor, Administrative Staff see all

        // Apply filters
        if (filters?.status) query = query.eq('status', filters.status)
        if (filters?.award_type) query = query.eq('award_type', filters.award_type)
        if (filters?.rating_period_id) query = query.eq('rating_period_id', filters.rating_period_id)
        if (filters?.division_id) query = query.eq('division_id', filters.division_id)
        if (filters?.staff_id) query = query.eq('employee_id', filters.staff_id)

        const { data, error } = await query
        if (error) throw error

        return { data: data || [] }
    } catch (err: any) {
        return { error: err.message, data: [] }
    }
}

/**
 * Get eligible staff for awards.
 * Returns staff with finalized IPCRs rated Outstanding or Very Satisfactory
 * for the specified rating period, including their existing_awards array.
 */
export async function getEligibleStaff(
    rating_period_id: string
): Promise<EligibleStaff[]> {
    try {
        const { supabase } = await getAuthenticatedUser()

        // Get finalized IPCRs with Outstanding or Very Satisfactory ratings
        const { data: ipcrs, error } = await supabase
            .from('ipcr_forms')
            .select(`
                id,
                employee_id,
                final_average_rating,
                adjectival_rating,
                staff:profiles!employee_id(full_name, avatar_url, division_id),
                division:divisions(name, code),
                rating_period:rating_periods(name)
            `)
            .eq('rating_period_id', rating_period_id)
            .eq('status', 'finalized')
            .in('adjectival_rating', ['Outstanding', 'Very Satisfactory'])
            .order('final_average_rating', { ascending: false })

        if (error) throw error
        if (!ipcrs || ipcrs.length === 0) return []

        // Get existing awards for these staff members in this period
        const staffIds = ipcrs.map((i: any) => i.employee_id)
        const { data: existingAwards } = await supabase
            .from('rewards_incentives')
            .select('employee_id, award_type')
            .eq('rating_period_id', rating_period_id)
            .in('employee_id', staffIds)
            .neq('status', 'cancelled')

        // Build existing awards map
        const awardsMap: Record<string, AwardType[]> = {}
        for (const award of (existingAwards || [])) {
            if (!awardsMap[award.employee_id]) awardsMap[award.employee_id] = []
            awardsMap[award.employee_id].push(award.award_type as AwardType)
        }

        return ipcrs.map((ipcr: any) => ({
            staff_id: ipcr.employee_id,
            full_name: ipcr.staff?.full_name || 'Unknown',
            avatar_url: ipcr.staff?.avatar_url,
            division_id: ipcr.staff?.division_id || '',
            division_name: ipcr.division?.name || '',
            ipcr_form_id: ipcr.id,
            final_average_rating: ipcr.final_average_rating || 0,
            adjectival_rating: ipcr.adjectival_rating as 'Outstanding' | 'Very Satisfactory',
            rating_period_name: ipcr.rating_period?.name || '',
            existing_awards: awardsMap[ipcr.employee_id] || [],
        }))
    } catch (err: any) {
        console.error('getEligibleEmployees error:', err)
        return []
    }
}

/**
 * Get a single reward with all joined data.
 */
export async function getRewardById(id: string) {
    try {
        const { supabase } = await getAuthenticatedUser()

        const { data, error } = await supabase
            .from('rewards_incentives')
            .select(`
                *,
                staff:profiles!rewards_incentives_employee_id_fkey(full_name, avatar_url),
                division:divisions(name, code),
                rating_period:rating_periods(name),
                ipcr_form:ipcr_forms(final_average_rating, adjectival_rating, status),
                awarded_by_profile:profiles!rewards_incentives_awarded_by_fkey(full_name)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        return { data }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Get rewards summary for dashboard — counts by award_type and status.
 */
export async function getRewardsSummary(rating_period_id: string): Promise<RewardsSummary> {
    try {
        const { supabase } = await getAuthenticatedUser()

        const { data, error } = await supabase
            .from('rewards_incentives')
            .select('award_type, status')
            .eq('rating_period_id', rating_period_id)

        if (error) throw error

        const summary: RewardsSummary = {}
        for (const row of (data || [])) {
            const type = row.award_type as AwardType
            if (!summary[type]) {
                summary[type] = { awarded: 0, approved: 0, cancelled: 0, total: 0 }
            }
            summary[type]!.total++
            if (row.status === 'awarded') summary[type]!.awarded++
            else if (row.status === 'approved') summary[type]!.approved++
            else if (row.status === 'cancelled') summary[type]!.cancelled++
        }

        return summary
    } catch (err: any) {
        console.error('getRewardsSummary error:', err)
        return {}
    }
}

/**
 * Check if a specific award type already exists for a staff member in a rating period.
 */
export async function checkAwardExists(
    staff_id: string,
    rating_period_id: string,
    award_type: AwardType
): Promise<boolean> {
    try {
        const { supabase } = await getAuthenticatedUser()

        const { data, error } = await supabase
            .from('rewards_incentives')
            .select('id')
            .eq('employee_id', staff_id)
            .eq('rating_period_id', rating_period_id)
            .eq('award_type', award_type)
            .neq('status', 'cancelled')
            .maybeSingle()

        if (error) throw error
        return !!data
    } catch {
        return false
    }
}

/**
 * Get top performers list — staff with Outstanding rating sorted by score.
 */
export async function getTopPerformers(rating_period_id: string) {
    try {
        const { supabase } = await getAuthenticatedUser()

        const { data: ipcrs, error } = await supabase
            .from('ipcr_forms')
            .select(`
                id,
                employee_id,
                final_average_rating,
                adjectival_rating,
                employee:profiles!employee_id(full_name, avatar_url, division_id),
                division:divisions(name, code)
            `)
            .eq('rating_period_id', rating_period_id)
            .eq('status', 'finalized')
            .in('adjectival_rating', ['Outstanding', 'Very Satisfactory'])
            .order('final_average_rating', { ascending: false })

        if (error) throw error

        // Get existing awards
        const staffIds = (ipcrs || []).map((i: any) => i.employee_id)
        const { data: awards } = await supabase
            .from('rewards_incentives')
            .select('employee_id, award_type, status')
            .eq('rating_period_id', rating_period_id)
            .in('employee_id', staffIds.length > 0 ? staffIds : ['none'])

        const awardsMap: Record<string, any[]> = {}
        for (const award of (awards || [])) {
            if (!awardsMap[award.employee_id]) awardsMap[award.employee_id] = []
            awardsMap[award.employee_id].push(award)
        }

        const outstanding = (ipcrs || [])
            .filter((i: any) => i.adjectival_rating === 'Outstanding')
            .map((i: any, idx: number) => ({
                rank: idx + 1,
                employee_id: i.employee_id,
                full_name: i.employee?.full_name || '',
                avatar_url: i.employee?.avatar_url,
                division_name: i.division?.name || '',
                final_average_rating: i.final_average_rating,
                adjectival_rating: i.adjectival_rating,
                awards: awardsMap[i.employee_id] || [],
            }))

        const verySatisfactory = (ipcrs || [])
            .filter((i: any) => i.adjectival_rating === 'Very Satisfactory')
            .map((i: any, idx: number) => ({
                rank: idx + 1,
                employee_id: i.employee_id,
                full_name: i.employee?.full_name || '',
                avatar_url: i.employee?.avatar_url,
                division_name: i.division?.name || '',
                final_average_rating: i.final_average_rating,
                adjectival_rating: i.adjectival_rating,
                awards: awardsMap[i.employee_id] || [],
            }))

        return { outstanding, verySatisfactory }
    } catch (err: any) {
        return { outstanding: [], verySatisfactory: [], error: err.message }
    }
}

/**
 * Get recent awards for dashboard widget.
 */
export async function getRecentAwards(limit = 5) {
    try {
        const { supabase } = await getAuthenticatedUser()

        const { data, error } = await supabase
            .from('rewards_incentives')
            .select(`
                id, award_type, award_title, status,
                staff:profiles!rewards_incentives_employee_id_fkey(full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return { data: data || [] }
    } catch (err: any) {
        return { data: [], error: err.message }
    }
}

// ── MUTATIONS ────────────────────────────────────────

/**
 * Create award directly (Provincial Assessor/Administrative Staff only).
 * Status set to 'approved' immediately.
 * Validates eligibility before creating.
 */
export async function createReward(data: RewardInput) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        // Role check
        if (!['head_of_office', 'admin_staff'].includes(profile.role)) {
            return { error: 'Only Provincial Assessor or Administrative Staff can create awards' }
        }

        // 1. Verify employee has finalized IPCR
        const { data: ipcr, error: ipcrError } = await supabase
            .from('ipcr_forms')
            .select('id, final_average_rating, adjectival_rating, status, division_id')
            .eq('id', data.ipcr_form_id)
            .eq('employee_id', data.staff_id)
            .single()

        if (ipcrError || !ipcr) {
            return { error: 'IPCR record not found for this staff member' }
        }

        if (ipcr.status !== 'finalized') {
            return { error: 'Staff IPCR must be finalized before giving an award' }
        }

        // 2. Validate rating eligibility
        const adjectival = ipcr.adjectival_rating
        if (!['Outstanding', 'Very Satisfactory'].includes(adjectival)) {
            return { error: 'Staff member must have Outstanding or Very Satisfactory rating to receive an award' }
        }

        // 3. PRAISE Award requires Outstanding only
        if (data.award_type === 'praise_award' && adjectival !== 'Outstanding') {
            return { error: 'PRAISE Award requires an Outstanding (5) rating' }
        }

        // 4. Check for duplicate award type in same period
        const alreadyExists = await checkAwardExists(
            data.staff_id,
            data.rating_period_id,
            data.award_type
        )
        if (alreadyExists) {
            return { error: 'This award type has already been given to this staff member for this rating period' }
        }

        // Create the award
        const { data: created, error: insertError } = await supabase
            .from('rewards_incentives')
            .insert({
                employee_id: data.staff_id,
                rating_period_id: data.rating_period_id,
                ipcr_form_id: data.ipcr_form_id,
                division_id: ipcr.division_id,
                award_type: data.award_type,
                award_title: data.award_title,
                description: data.description || null,
                basis_rating: adjectival,
                awarded_by: profile.id,
                award_date: data.award_date || null,
                remarks: data.remarks || null,
                status: 'approved',
            })
            .select()
            .single()

        if (insertError) throw insertError

        await logActivity(
            'create_reward',
            'rewards_incentives',
            created.id,
            {
                award_type: data.award_type,
                staff_id: data.staff_id,
                award_title: data.award_title,
            }
        )

        revalidatePath('/dashboard/rewards')
        revalidatePath('/dashboard')

        // ── Notification ────────────────────────────────────────────────────
        const { data: staffProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', data.staff_id)
            .single()
        const { data: ratingPeriod } = await supabase
            .from('rating_periods')
            .select('name')
            .eq('id', data.rating_period_id)
            .single()
        if (staffProfile) {
            const awardTypeLabel = data.award_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            const { title, message } = buildNotificationContent('reward.given', {
                awardType: awardTypeLabel,
                awardTitle: data.award_title,
                approver: profile.full_name,
                adjectival: adjectival,
                period: ratingPeriod?.name ?? 'current period',
            })
            await notifyUser(
                {
                    recipient_id: data.staff_id,
                    type: 'reward.given',
                    title,
                    message,
                    entity_type: 'reward',
                    entity_id: created.id,
                    action_url: '/dashboard/rewards',
                },
                staffProfile.email ?? '',
                staffProfile.full_name ?? ''
            )
        }

        return { data: created }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Mark award as physically given/awarded.
 * Status: approved → awarded
 */
export async function markAsAwarded(id: string, award_date: string) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        if (!['head_of_office', 'admin_staff'].includes(profile.role)) {
            return { error: 'Unauthorized' }
        }

        const { data, error } = await supabase
            .from('rewards_incentives')
            .update({
                status: 'awarded',
                award_date: award_date,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('status', 'approved')
            .select()
            .single()

        if (error) throw error
        if (!data) return { error: 'Award not found or already processed' }

        await logActivity('mark_awarded', 'rewards_incentives', id, { award_date })

        revalidatePath('/dashboard/rewards')
        revalidatePath('/dashboard')
        return { data }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Cancel award (before it is physically given).
 * Status: approved → cancelled
 */
export async function cancelReward(id: string, reason: string) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        if (!['head_of_office', 'admin_staff'].includes(profile.role)) {
            return { error: 'Unauthorized' }
        }

        const { data, error } = await supabase
            .from('rewards_incentives')
            .update({
                status: 'cancelled',
                remarks: reason,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('status', 'approved')
            .select()
            .single()

        if (error) throw error
        if (!data) return { error: 'Award not found or cannot be cancelled' }

        await logActivity('cancel_reward', 'rewards_incentives', id, { reason })

        revalidatePath('/dashboard/rewards')
        revalidatePath('/dashboard')
        return { data }
    } catch (err: any) {
        return { error: err.message }
    }
}

/**
 * Update award details (approved status only).
 */
export async function updateReward(id: string, data: Partial<RewardInput>) {
    try {
        const { profile, supabase } = await getAuthenticatedUser()

        if (!['head_of_office', 'admin_staff'].includes(profile.role)) {
            return { error: 'Unauthorized' }
        }

        const { data: updated, error } = await supabase
            .from('rewards_incentives')
            .update({
                ...(data.award_title && { award_title: data.award_title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.award_date !== undefined && { award_date: data.award_date }),
                ...(data.remarks !== undefined && { remarks: data.remarks }),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('status', 'approved')
            .select()
            .single()

        if (error) throw error
        if (!updated) return { error: 'Award not found or cannot be updated' }

        await logActivity('update_reward', 'rewards_incentives', id, data)

        revalidatePath('/dashboard/rewards')
        return { data: updated }
    } catch (err: any) {
        return { error: err.message }
    }
}
