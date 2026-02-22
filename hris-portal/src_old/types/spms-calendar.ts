export type CalendarEventType =
    | 'planning_commitment'
    | 'monitoring_coaching'
    | 'review_evaluation'
    | 'rewarding_development'
    | 'submission_deadline'
    | 'other'

export type CalendarEventStatus =
    | 'upcoming'
    | 'ongoing'
    | 'completed'
    | 'overdue'

export type SPMSCalendarEvent = {
    id: string
    rating_period_id?: string
    title: string
    description?: string
    activity_type: CalendarEventType
    due_date: string
    submit_to?: string
    responsible_roles: string[]
    is_system_generated: boolean
    status: CalendarEventStatus
    created_by?: string
    created_at: string
    updated_at: string
    // Joined
    rating_period?: { name: string }
    created_by_profile?: { full_name: string }
}

export type SPMSCalendarEventInput = {
    rating_period_id?: string
    title: string
    description?: string
    activity_type: CalendarEventType
    due_date: string
    submit_to?: string
    responsible_roles: string[]
}

// For calendar view rendering
export type CalendarDay = {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    events: SPMSCalendarEvent[]
}

// For compliance summary
export type ComplianceSummary = {
    activity_type: CalendarEventType
    total: number
    completed: number
    percentage: number
}
