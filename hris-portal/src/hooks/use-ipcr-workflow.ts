'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export type IpcrStatus = 'Draft' | 'Submitted' | 'Reviewed' | 'Approved' | 'Returned'

export interface IpcrWorkflowItem {
    id: string
    employee_id: string
    period_id: string
    status: IpcrStatus
    final_average_rating: number | null
    adjectival_rating: string | null
    profiles: {
        full_name: string
    }
    ipcr_periods: {
        year: number
        semester: number
    }
}

export function useIpcrWorkflow() {
    const [pendingIpcrs, setPendingIpcrs] = useState<IpcrWorkflowItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPendingIpcrs = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        const supabase = createClient()

        try {
            const { data, error: fetchError } = await supabase
                .from('ipcr_forms')
                .select(`
          *,
          profiles:employee_id (full_name),
          ipcr_periods:period_id (year, semester)
        `)
                .neq('status', 'Draft')
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError
            setPendingIpcrs(data as any[])
        } catch (err: any) {
            setError(err.message)
            toast.error("Failed to load IPCR workflow")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPendingIpcrs()
    }, [fetchPendingIpcrs])

    const updateStatus = async (formId: string, newStatus: IpcrStatus, remarks?: string) => {
        const supabase = createClient()

        // Optimistic Update
        const previousState = [...pendingIpcrs]
        setPendingIpcrs(prev => prev.filter(item => item.id !== formId))

        try {
            const { error } = await supabase
                .from('ipcr_forms')
                .update({ status: newStatus })
                .eq('id', formId)

            if (error) throw error

            toast.success(`IPCR successfully ${newStatus === 'Approved' ? 'approved' : 'returned'}`)
        } catch (err: any) {
            setPendingIpcrs(previousState) // Rollback
            toast.error(err.message || "Failed to update IPCR status")
            throw err
        }
    }

    const approveIpcr = (formId: string) => updateStatus(formId, 'Approved')
    const returnIpcr = (formId: string, remarks: string) => updateStatus(formId, 'Returned', remarks)

    return {
        pendingIpcrs,
        isLoading,
        error,
        approveIpcr,
        returnIpcr,
        refresh: fetchPendingIpcrs
    }
}
