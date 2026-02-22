'use server'

import { createClient } from "@/utils/supabase/server"
import { logActivity } from "@/lib/audit-logger"
import { revalidatePath } from "next/cache"

export async function getMFAFactors() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.mfa.listFactors()

    if (error) {
        return { error: error.message, factors: [] }
    }

    return { factors: data.all }
}

export async function enrollMFA() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'HRIS Portal',
        friendlyName: user.email
    })

    if (error) {
        await logActivity('MFA_ENROLL_FAILED', 'USER', user.id, { error: error.message })
        return { error: error.message }
    }

    await logActivity('MFA_ENROLL_INITIATED', 'USER', user.id)
    return { data }
}

export async function verifyMFA(factorId: string, challengeId: string, code: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code
    })

    if (error) {
        await logActivity('MFA_VERIFY_FAILED', 'USER', user.id, { factorId, error: error.message })
        return { error: error.message }
    }

    await logActivity('MFA_VERIFY_SUCCESS', 'USER', user.id, { factorId })
    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function disableMFA(factorId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase.auth.mfa.unenroll({
        factorId
    })

    if (error) {
        await logActivity('MFA_DISABLE_FAILED', 'USER', user.id, { factorId, error: error.message })
        return { error: error.message }
    }

    await logActivity('MFA_DISABLE_SUCCESS', 'USER', user.id, { factorId })
    revalidatePath('/dashboard/settings')
    return { success: true }
}
