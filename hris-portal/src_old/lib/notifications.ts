import { createClient } from '@/utils/supabase/server'

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType =
    | 'ipcr.finalized'
    | 'leave.filed'
    | 'leave.approved'
    | 'leave.rejected'
    | 'opcr.submitted'
    | 'monitoring.submitted'
    | 'monitoring.noted'
    | 'reward.given'
    | 'spms.deadline'
    | 'development_plan.created'

export type NotificationPayload = {
    recipient_id: string
    type: NotificationType
    title: string
    message: string
    entity_type?: string
    entity_id?: string
    action_url?: string
}

// ── Core DB Insert ────────────────────────────────────────────────────────────

/**
 * Insert one or more notifications into DB using service role to bypass RLS.
 */
export async function createNotifications(
    notifications: NotificationPayload[]
): Promise<void> {
    try {
        // Use the server supabase client (service role handles INSERT policy)
        const supabase = await createClient()
        const { error } = await supabase
            .from('notifications')
            .insert(notifications)
        if (error) {
            console.error('[notifications] DB insert error:', error.message)
        }
    } catch (err) {
        console.error('[notifications] createNotifications failed:', err)
    }
}

// ── Email Dispatch ────────────────────────────────────────────────────────────

/**
 * Dispatch email via Supabase Edge Function.
 * Non-blocking – fire and forget with try/catch.
 * Email failure will never break the calling server action.
 */
export async function dispatchEmailNotification(
    notification: NotificationPayload & {
        recipient_email: string
        recipient_name: string
    }
): Promise<void> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

        if (!supabaseUrl || !serviceKey) return

        await fetch(
            `${supabaseUrl}/functions/v1/send-notification-email`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({
                    to: notification.recipient_email,
                    recipient_name: notification.recipient_name,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    action_url: notification.action_url
                        ? `${appUrl}${notification.action_url}`
                        : undefined,
                }),
            }
        )
    } catch {
        // Email failure should never break the main action
        console.error('[notifications] Email dispatch failed for type:', notification.type)
    }
}

// ── Convenience Helpers ───────────────────────────────────────────────────────

/**
 * Create a DB notification AND dispatch an email for a single recipient.
 */
export async function notifyUser(
    payload: NotificationPayload,
    recipientEmail: string,
    recipientName: string
): Promise<void> {
    await createNotifications([payload])
    // Fire-and-forget – do not await so it doesn't block the action
    dispatchEmailNotification({
        ...payload,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
    }).catch(() => { })
}

/**
 * Notify multiple users at once (e.g., all PMT members).
 * Batch-inserts all DB rows, then dispatches emails in parallel (non-blocking).
 */
export async function notifyMultipleUsers(
    recipients: { id: string; email: string; full_name: string }[],
    payload: Omit<NotificationPayload, 'recipient_id'>
): Promise<void> {
    if (recipients.length === 0) return

    // Batch insert all DB notifications
    await createNotifications(
        recipients.map((r) => ({ ...payload, recipient_id: r.id }))
    )

    // Send emails in parallel (non-blocking)
    Promise.allSettled(
        recipients.map((r) =>
            dispatchEmailNotification({
                ...payload,
                recipient_id: r.id,
                recipient_email: r.email,
                recipient_name: r.full_name,
            })
        )
    ).catch(() => { })
}

// ── Content Factory ───────────────────────────────────────────────────────────

/**
 * Returns the title + message string for a given notification type + context.
 */
export function buildNotificationContent(
    type: NotificationType,
    context: Record<string, string>
): { title: string; message: string } {
    const templates: Record<NotificationType, { title: string; message: string }> = {
        'ipcr.finalized': {
            title: 'Your IPCR Has Been Finalized',
            message: `Your Individual Performance Commitment and Review for ${context.period} has been finalized by ${context.approver}.\nFinal Rating: ${context.rating} (${context.adjectival}).`,
        },
        'leave.filed': {
            title: 'New Leave Application',
            message: `${context.staff} has filed a ${context.leaveType} leave request from ${context.fromDate} to ${context.toDate} (${context.days} day/s).\nPlease review and take action.`,
        },
        'leave.approved': {
            title: 'Leave Application Approved',
            message: `Your ${context.leaveType} leave request from ${context.fromDate} to ${context.toDate} has been approved by ${context.approver}.`,
        },
        'leave.rejected': {
            title: 'Leave Application Rejected',
            message: `Your ${context.leaveType} leave request from ${context.fromDate} to ${context.toDate} has been rejected by ${context.approver}.\nReason: ${context.reason ?? 'No reason provided.'}`,
        },
        'opcr.submitted': {
            title: 'OPCR Submitted for PMT Review',
            message: `The Office Performance Commitment and Review for ${context.period} has been submitted by ${context.submitter}.\nPlease review and validate.`,
        },
        'monitoring.submitted': {
            title: 'Monitoring Journal Submitted',
            message: `${context.divisionChief} has submitted the Q${context.quarter} Monitoring and Coaching Journal for ${context.division}.\nPlease review and note.`,
        },
        'monitoring.noted': {
            title: 'Monitoring Journal Noted',
            message: `Your Q${context.quarter} Monitoring and Coaching Journal for ${context.division} has been noted by ${context.approver}.`,
        },
        'reward.given': {
            title: 'You Have Received an Award',
            message: `Congratulations! You have been awarded the ${context.awardType} — "${context.awardTitle}" by ${context.approver} for your ${context.adjectival} performance rating during ${context.period}.`,
        },
        'spms.deadline': {
            title: 'SPMS Deadline Approaching',
            message: `Reminder: "${context.eventTitle}" is due on ${context.dueDate} (${context.daysLeft} day/s remaining).${context.submitTo ? `\nSubmit to: ${context.submitTo}` : ''}`,
        },
        'development_plan.created': {
            title: 'Professional Development Plan Created',
            message: `A Professional Development Plan has been created for you by ${context.creator} for the ${context.period} rating period.\nPlan Aim: ${context.aim}`,
        },
    }

    return templates[type]
}
