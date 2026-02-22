export type AwardType =
    | 'praise_award'
    | 'performance_bonus'
    | 'step_increment'
    | 'certificate_of_recognition'
    | 'scholarship'

export type AwardStatus =
    | 'approved'
    | 'awarded'
    | 'cancelled'

export type EligibleStaff = {
    staff_id: string
    full_name: string
    avatar_url?: string
    division_id: string
    division_name: string
    ipcr_form_id: string
    final_average_rating: number
    adjectival_rating: 'Outstanding' | 'Very Satisfactory'
    rating_period_name: string
    existing_awards: AwardType[]
}

export type RewardIncentive = {
    id: string
    staff_id: string
    rating_period_id: string
    ipcr_form_id?: string
    award_type: AwardType
    award_title: string
    description?: string
    basis_rating: 'Outstanding' | 'Very Satisfactory'
    awarded_by: string
    award_date?: string
    status: AwardStatus
    remarks?: string
    created_at: string
    updated_at: string
    // Joined fields
    staff?: {
        full_name: string
        avatar_url?: string
    }
    division?: { name: string; code: string }
    rating_period?: { name: string }
    ipcr_form?: {
        final_average_rating: number
        adjectival_rating: string
    }
    awarded_by_profile?: { full_name: string }
}

export type RewardInput = {
    staff_id: string
    rating_period_id: string
    ipcr_form_id: string
    award_type: AwardType
    award_title: string
    description?: string
    basis_rating: 'Outstanding' | 'Very Satisfactory'
    award_date?: string
    remarks?: string
}

export type RewardsSummary = {
    [key in AwardType]?: {
        awarded: number
        approved: number
        cancelled: number
        total: number
    }
}

// Award type metadata for UI display
export const AWARD_TYPE_CONFIG: Record<AwardType, {
    label: string
    description: string
    icon: string
    color: string
    eligibility: string
    outstandingOnly: boolean
}> = {
    praise_award: {
        label: 'PRAISE Award',
        description: 'Program on Awards and Incentives for Service Excellence',
        icon: 'Trophy',
        color: 'amber',
        eligibility: 'Outstanding rating required',
        outstandingOnly: true,
    },
    performance_bonus: {
        label: 'Performance Bonus',
        description: 'Monetary incentive based on performance rating',
        icon: 'Banknote',
        color: 'green',
        eligibility: 'Outstanding or Very Satisfactory',
        outstandingOnly: false,
    },
    step_increment: {
        label: 'Step Increment',
        description: 'Salary step advancement based on merit',
        icon: 'TrendingUp',
        color: 'blue',
        eligibility: 'Outstanding or Very Satisfactory',
        outstandingOnly: false,
    },
    certificate_of_recognition: {
        label: 'Certificate of Recognition',
        description: 'Formal acknowledgment of service excellence',
        icon: 'Award',
        color: 'purple',
        eligibility: 'Outstanding or Very Satisfactory',
        outstandingOnly: false,
    },
    scholarship: {
        label: 'Scholarship / Training Grant',
        description: 'Learning and development opportunity',
        icon: 'GraduationCap',
        color: 'teal',
        eligibility: 'Outstanding or Very Satisfactory',
        outstandingOnly: false,
    },
}
