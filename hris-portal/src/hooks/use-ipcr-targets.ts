'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { IpcrTarget } from '@/components/spms/ipcr-target-form'

export function useIpcrTargets(formId: string | null) {
    const [targets, setTargets] = useState<IpcrTarget[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!formId) {
            setTargets([])
            return
        }

        async function fetchTargets() {
            setIsLoading(true)
            const supabase = createClient()
            const { data, error } = await supabase
                .from('ipcr_targets')
                .select('*')
                .eq('form_id', formId)
                .order('category', { ascending: false })

            if (!error && data) {
                setTargets(data as IpcrTarget[])
            }
            setIsLoading(false)
        }

        fetchTargets()
    }, [formId])

    return { targets, isLoading }
}
