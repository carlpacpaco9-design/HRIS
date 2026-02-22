'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/audit-logger'
import { isHRManager, Role } from '@/lib/roles'

interface DtrBatchRecord {
    employee_id: string
    am_in: string
    am_out: string
    pm_in: string
    pm_out: string
    remarks: string
}

export async function commitDtrBatch(date: string, records: DtrBatchRecord[]) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        // 1. Authorization Check
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || !isHRManager(profile.role as Role)) {
            throw new Error('Forbidden: Only admin staff can perform bulk encoding')
        }

        // 2. Prepare Data for Insertion
        // Note: We use the existing 'dtr_logs' table mapping
        const insertData = records
            .filter(r => r.am_in || r.am_out || r.pm_in || r.pm_out || r.remarks) // Skip empty rows
            .map(r => ({
                employee_id: r.employee_id,
                log_date: date,
                am_arrival: r.am_in || null,
                am_departure: r.am_out || null,
                pm_arrival: r.pm_in || null,
                pm_departure: r.pm_out || null,
                remarks: r.remarks || null,
                encoded_by: user.id
            }))

        if (insertData.length === 0) return { success: true, count: 0 }

        // 3. Upsert into dtr_logs
        // We use 'onConflict' to overwrite existing logs for that day/employee
        const { data, error } = await supabase
            .from('dtr_logs')
            .upsert(insertData, {
                onConflict: 'employee_id, log_date'
            })

        if (error) throw error

        // 4. Audit Log
        await logActivity('dtr.batch_commit', 'dtr_logs', `batch-${date}`, {
            date,
            count: insertData.length
        })

        revalidatePath('/dashboard/dtr')

        return { success: true, count: insertData.length }
    } catch (err: unknown) {
        console.error('Batch commit error:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred during batch save'
        }
    }
}
