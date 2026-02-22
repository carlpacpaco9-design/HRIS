export type IPCRStatus = 'draft' | 'pending_approval' | 'approved' | 'rated';

export interface IPCRTarget {
    id: string;
    organization: string;
    category: 'strategic' | 'core' | 'support';
    mfo: string;
    indicators: string;
    target_qty?: number;
    target_quality?: string;
    target_timeliness?: string;
}

export interface IPCRCommitment {
    id: string;
    cycle_id: string;
    user_id: string;
    supervisor_id?: string;
    status: IPCRStatus;
    final_rating?: number;
    adjectival_rating?: string;
    spms_targets?: IPCRTarget[];
    created_at?: string;
    updated_at?: string;
}

export interface PendingSubmission {
    id: string;
    employeeName: string;
    position: string;
    department: string;
    dateSubmitted: string;
    status: string;
    targets: IPCRTarget[];
    final_rating?: number;
    adjectival_rating?: string;
}

export interface TeamCommitment {
    id: string;
    employee_name: string;
    position_title: string;
    date_submitted: string;
    status: string;
    final_rating?: number;
    adjectival_rating?: string;
}

export interface LeaveBalance {
    id: string;
    user_id: string;
    year: number;
    vacation_leave: number;
    sick_leave: number;
    special_privilege_leave: number;
    forced_leave: number;
    wellness_leave: number;
    maternity_leave: number;
    paternity_leave: number;
    solo_parent_leave: number;
    vawc_leave: number;
    study_leave: number;
    rehabilitation_leave: number;
    created_at?: string;
    updated_at?: string;
}

export interface AttendanceLog {
    id: string;
    user_id: string;
    date: string;
    am_arrival?: string | null;
    am_departure?: string | null;
    pm_arrival?: string | null;
    pm_departure?: string | null;
    created_at?: string;
    // UI specific properties mapped from DB
    log_date?: string;
    am_in?: string | null;
    pm_out?: string | null;
}

export interface UserProfile {
    full_name: string | null;
    role: string | null;
    email?: string;
}
