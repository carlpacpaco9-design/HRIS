export type DevelopmentPlanStatus =
    | 'active'
    | 'in_progress'
    | 'achieved'
    | 'cancelled'

export type DevelopmentPlanTask = {
    id: string
    development_plan_id: string
    task_description: string
    next_step?: string
    outcome?: string
    sort_order: number
    created_at: string
}

export type DevelopmentPlan = {
    id: string
    employee_id: string
    ipcr_form_id: string
    rating_period_id: string
    created_by: string
    plan_date: string
    aim: string
    objective: string
    target_date?: string
    review_date?: string
    achieved_date?: string
    comments?: string
    status: DevelopmentPlanStatus
    created_at: string
    updated_at: string
    // Joined fields
    employee?: {
        full_name: string
        avatar_url?: string
        division_id: string
    }
    division?: { name: string; code: string }
    rating_period?: { name: string }
    ipcr_form?: {
        final_average_rating?: number
        adjectival_rating?: string
        status: string
    }
    created_by_profile?: { full_name: string; role: string }
    tasks?: DevelopmentPlanTask[]
}

export type DevelopmentPlanTaskInput = Omit<
    DevelopmentPlanTask,
    'id' | 'development_plan_id' | 'created_at'
>

export type DevelopmentPlanInput = {
    employee_id: string
    ipcr_form_id: string
    rating_period_id: string
    plan_date: string
    aim: string
    objective: string
    target_date?: string
    review_date?: string
    comments?: string
    tasks: DevelopmentPlanTaskInput[]
}
