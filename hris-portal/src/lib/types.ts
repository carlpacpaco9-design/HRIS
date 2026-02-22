export type Role =
    'head_of_office' |
    'admin_staff' |
    'division_chief' |
    'project_staff'

export type Division =
    'Administrative Division' |
    'Assessment Records Management' |
    'Assessment Standards & Valuation' |
    'Appraisal & Assessment' |
    'Tax Mapping Division'

export type LeaveStatus =
    'pending_approval' |
    'approved' |
    'rejected' |
    'cancelled'
export type LeaveType =
    | 'Vacation Leave'
    | 'Mandatory/Forced Leave'
    | 'Sick Leave'
    | 'Maternity Leave'
    | 'Paternity Leave'
    | 'Special Privilege Leave'
    | 'Solo Parent Leave'
    | 'Study Leave'
    | '10-Day VAWC Leave'
    | 'Rehabilitation Privilege'
    | 'Special Leave Benefits for Women'
    | 'Special Emergency (Calamity) Leave'
    | 'Adoption Leave'
    | 'Leave Without Pay'

export type IPCRStatus =
    'draft' |
    'submitted' |
    'reviewed' |
    'finalized' |
    'returned'

export type DPCRStatus =
    'draft' |
    'submitted' |
    'approved'

export type AdjectivalRating =
    'Outstanding' |
    'Very Satisfactory' |
    'Satisfactory' |
    'Unsatisfactory' |
    'Poor'

export type IPCRCategory =
    'Core Function' |
    'Support Function'

export type Profile = {
    id: string
    full_name: string
    email: string
    employee_number: string | null
    position: string
    division: Division
    role: Role
    employment_status: string
    salary_grade: string | null
    contact_number: string | null
    date_hired: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export type DTRLog = {
    id: string
    employee_id: string
    date: string
    am_arrival: string | null
    am_departure: string | null
    pm_arrival: string | null
    pm_departure: string | null
    undertime_minutes: number
    remarks: string | null
    encoded_by: string
    created_at: string
    updated_at: string
}

export type LeaveRequest = {
    id: string
    employee_id: string
    leave_type: LeaveType
    date_from: string
    date_to: string
    working_days: number
    reason: string
    status: LeaveStatus
    approver_id: string | null
    rejection_reason: string | null
    created_at: string
    updated_at: string
}

export type LeaveBalance = {
    id: string
    employee_id: string
    year: number
    vacation_leave_total: number
    vacation_leave_used: number
    sick_leave_total: number
    sick_leave_used: number
    special_leave_total: number
    special_leave_used: number
    emergency_leave_total: number
    emergency_leave_used: number
    created_at: string
    updated_at: string
}

export type SPMSCycle = {
    id: string
    name: string
    start_date: string
    end_date: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export type IPCRForm = {
    id: string
    employee_id: string
    spms_cycle_id: string
    status: IPCRStatus
    average_rating: number | null
    adjectival_rating: AdjectivalRating | null
    reviewer_id: string | null
    approver_id: string | null
    feedback: string | null
    created_at: string
    updated_at: string
}

export type IPCROutput = {
    id: string
    ipcr_id: string
    category: IPCRCategory
    output_name: string
    success_indicator: string
    actual_accomplishment: string | null
    q_rating: number | null
    e_rating: number | null
    t_rating: number | null
    average_rating: number | null
    remarks: string | null
    created_at: string
    updated_at: string
}

export type DPCRForm = {
    id: string
    division: Division
    spms_cycle_id: string
    status: DPCRStatus
    average_rating: number | null
    adjectival_rating: AdjectivalRating | null
    reviewer_id: string | null
    approver_id: string | null
    created_at: string
    updated_at: string
}

export type MonitoringJournal = {
    id: string
    employee_id: string
    type: string
    details: string
    action_plan: string | null
    encoded_by: string
    created_at: string
    updated_at: string
}

export type DevelopmentPlan = {
    id: string
    employee_id: string
    spms_cycle_id: string | null
    target_role: string | null
    strengths: string | null
    development_needs: string | null
    action_plan: string | null
    timeline: string | null
    status: string
    created_at: string
    updated_at: string
}

export type Award = {
    id: string
    employee_id: string
    award_name: string
    date_given: string
    reason: string | null
    given_by: string
    created_at: string
    updated_at: string
}

export type AuditLog = {
    id: string
    user_id: string | null
    action_type: string
    action_details: string
    target_resource: string | null
    created_at: string
}
