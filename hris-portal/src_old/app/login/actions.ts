'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Please fill in all fields' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Check for MFA factors
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()

    if (!factorsError && factors.all.length > 0) {
        const verifiedFactors = factors.all.filter(f => f.status === 'verified')
        if (verifiedFactors.length > 0) {
            // MFA is required. We return the factor ID to the client.
            return {
                mfaRequired: true,
                factorId: verifiedFactors[0].id
            }
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function verifyMfaLogin(factorId: string, code: string) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
