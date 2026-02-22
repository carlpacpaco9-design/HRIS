export type OPCRStatus =
    | 'draft'
    | 'submitted'
    | 'reviewed'
    | 'finalized'
    | 'returned'

export type OPCRCategory =
    | 'strategic_priority'
    | 'core_function'
    | 'support_function'

export type AdjectivalRating =
    | 'Outstanding'
    | 'Very Satisfactory'
    | 'Satisfactory'
    | 'Unsatisfactory'
    | 'Poor'

export type OPCROutput = {
    id: string
    opcr_form_id: string
    category: OPCRCategory
    output_title: string
    success_indicator: string
    allotted_budget?: number
    accountable_division?: string
    actual_accomplishments?: string
    rating_q?: number
    rating_e?: number
    rating_t?: number
    average_rating?: number
    remarks?: string
    sort_order: number
    created_at: string
    updated_at: string
}

export type OPCRForm = {
    id: string
    rating_period_id: string
    division_id: string
    prepared_by: string
    reviewed_by?: string
    approved_by?: string
    status: OPCRStatus
    office_rating_q?: number
    office_rating_e?: number
    office_rating_t?: number
    office_final_rating?: number
    adjectival_rating?: AdjectivalRating
    remarks?: string
    submitted_at?: string
    approved_at?: string
    created_at: string
    updated_at: string
    // Joined fields
    rating_period?: { name: string; period_from: string; period_to: string }
    prepared_by_profile?: { full_name: string }
    reviewed_by_profile?: { full_name: string }
    outputs?: OPCROutput[]
}

export type OPCROutputInput = Omit<
    OPCROutput,
    'id' | 'opcr_form_id' | 'average_rating' | 'created_at' | 'updated_at' | 'sort_order'
>

export type OPCRFormInput = {
    rating_period_id: string
    outputs: OPCROutputInput[]
    remarks?: string
}
