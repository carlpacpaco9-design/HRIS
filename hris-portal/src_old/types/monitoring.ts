export type MonitoringJournalStatus =
    | 'draft'
    | 'submitted'
    | 'noted'

export type ActivityType = 'monitoring' | 'coaching'

export type MechanismType =
    | 'one_on_one'
    | 'group_meeting'
    | 'memo'
    | 'field_visit'
    | 'email'
    | 'other'

export type MonitoringEntry = {
    id: string
    journal_id: string
    activity_type: ActivityType
    mechanism: MechanismType
    mechanism_other?: string
    activity_date: string
    participants: string[]
    notes?: string
    created_at: string
}

export type MonitoringTask = {
    id: string
    journal_id: string
    task_id_no?: string
    subject: string
    action_officer_id?: string
    output?: string
    date_assigned?: string
    date_accomplished?: string
    remarks?: string
    created_at: string
    updated_at: string
    // Joined
    action_officer?: { full_name: string }
}

export type MonitoringJournal = {
    id: string
    rating_period_id: string
    division_id: string
    quarter: 1 | 2 | 3 | 4
    conducted_by: string
    noted_by?: string
    conducted_date?: string
    status: MonitoringJournalStatus
    created_at: string
    updated_at: string
    // Joined
    rating_period?: { name: string }
    division?: { name: string; code: string }
    conducted_by_profile?: { full_name: string }
    noted_by_profile?: { full_name: string }
    entries?: MonitoringEntry[]
    tasks?: MonitoringTask[]
}

export type MonitoringEntryInput = Omit<
    MonitoringEntry,
    'id' | 'journal_id' | 'created_at'
>

export type MonitoringTaskInput = Omit<
    MonitoringTask,
    | 'id' | 'journal_id' | 'created_at'
    | 'updated_at' | 'action_officer'
>
