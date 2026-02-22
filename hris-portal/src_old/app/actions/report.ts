'use server'

import { createClient } from '@/utils/supabase/server'

export async function getIPCRReportData(commitmentId: string) {
    const supabase = await createClient()

    // Fetch Full Data
    const { data: commitment, error } = await supabase
        .from('spms_commitments')
        .select(`
            *,
            profiles!user_id (
                full_name,
                position_title,
                department
            ),
            supervisor:profiles!supervisor_id (
                full_name,
                position_title
            ),
            spms_targets (*)
        `)
        .eq('id', commitmentId)
        .single()

    if (error) {
        console.error("getIPCRReportData Error:", JSON.stringify(error, null, 2))
        return null
    }

    if (!commitment) {
        console.error("getIPCRReportData: Commitment not found")
        return null
    }

    // Fetch Provincial Assessor
    const { data: head } = await supabase
        .from('profiles')
        .select('full_name') // Assuming strict typing might need 'full_name' 
        .eq('role', 'head_of_office')
        .limit(1)
        .single()

    // Transform Data
    return {
        commitment: {
            id: commitment.id,
            status: commitment.status,
            updated_at: commitment.updated_at,
            spms_targets: commitment.spms_targets, // Include targets here
            final_rating: commitment.final_rating,
            adjectival_rating: commitment.adjectival_rating
        },
        employee: {
            name: commitment.profiles.full_name,
            position: commitment.profiles.position_title,
            department: commitment.profiles.department || 'Provincial Assessor\'s Office',
            division: 'N/A' // Or fetch
        },
        supervisor: {
            name: commitment.supervisor?.full_name || 'N/A',
            position: commitment.supervisor?.position_title || 'N/A'
        },
        head: {
            name: head?.full_name || 'Provincial Assessor' // Fallback
        },
        period: 'Jan - June 2026', // Ideally fetched from spms_cycles
        targets: commitment.spms_targets.map((t: any) => ({
            category: t.mfo_category,
            mfo: t.output,
            indicators: t.indicators,
            actual_accomplishment: t.actual_accomplishment || '',
            q: t.quantity_score,
            e: t.quality_score,
            t: t.timeliness_score,
            a: t.average_score,
            remarks: t.remarks || ''
        })),
        final_rating: commitment.final_rating || 0,
        adjectival_rating: commitment.adjectival_rating || ''
    }
}
