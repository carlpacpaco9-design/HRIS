import { createClient } from "@/utils/supabase/server"

/**
 * Logs a system-wide user activity to the audit_logs table.
 * Designed to be used within server actions or server components.
 */
export async function logActivity(
    action: string,
    resourceType: string,
    resourceId: string,
    details: any = {}
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return // No user to log

        const { error } = await supabase
            .from('audit_logs')
            .insert({
                user_id: user.id,
                action,
                resource_type: resourceType,
                resource_id: resourceId,
                details: details
            })

        if (error) {
            console.error('Audit Logging Error:', error.message)
        }
    } catch (err) {
        // Silently fail logging to prevent application crash
        console.error('Audit Logging Failed:', err)
    }
}
