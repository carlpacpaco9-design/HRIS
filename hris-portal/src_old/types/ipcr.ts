export type IPCRStatus =
    | 'draft' | 'submitted' | 'reviewed'
    | 'approved' | 'returned' | 'finalized'

export type AdjectivalRating =
    | 'Outstanding' | 'Very Satisfactory'
    | 'Satisfactory' | 'Unsatisfactory' | 'Poor'

export type OutputCategory =
    | 'strategic_priority' | 'core_function'

export type IPCROutput = {
    id: string
    ipcr_form_id: string
    category: OutputCategory
    output_title: string
    success_indicator: string
    actual_accomplishments?: string
    rating_q?: number
    rating_e?: number
    rating_t?: number
    average_rating?: number
    remarks?: string
    sort_order: number
}

export type IPCRForm = {
    id: string
    rating_period_id: string
    employee_id: string
    division_id: string
    opcr_form_id?: string
    immediate_supervisor_id?: string
    reviewed_by?: string
    approved_by?: string
    status: IPCRStatus
    final_average_rating?: number
    adjectival_rating?: AdjectivalRating
    comments_recommendations?: string
    discussed_with_employee_at?: string
    submitted_at?: string
    approved_at?: string
    finalized_at?: string
    created_at: string
    updated_at: string
    // Joined fields
    employee?: { full_name: string; avatar_url?: string }
    division?: { name: string; code: string }
    rating_period?: { name: string }
    outputs?: IPCROutput[]
}

export type IPCROutputInput = Omit<
    IPCROutput,
    'id' | 'ipcr_form_id' | 'average_rating' | 'created_at' | 'sort_order'
>

export type IPCRFormInput = {
    rating_period_id: string
    division_id: string
    immediate_supervisor_id?: string
    outputs: IPCROutputInput[]
    comments?: string
}
