// OFFICIAL ROLE NAMES
// DB value → UI display label

export const ROLES = {
    HEAD_OF_OFFICE: 'head_of_office',
    ADMIN_STAFF: 'admin_staff',
    DIVISION_CHIEF: 'division_chief',
    PROJECT_STAFF: 'project_staff',  // ← DB value
} as const

export type Role = typeof ROLES[
    keyof typeof ROLES
]

// UI display labels
// Used in sidebar, profile tile,
// user cards — NEVER in DB queries
export const ROLE_LABELS: Record<Role, string> = {
    head_of_office: 'Provincial Assessor',
    admin_staff: 'Administrative Staff',
    division_chief: 'Division Chief',
    project_staff: 'Regular Employee',  // ← UI label
}

// Role groupings
export const HR_MANAGERS: Role[] = [
    'head_of_office',
    'admin_staff',
]

export const REVIEWERS: Role[] = [
    'head_of_office',
    'admin_staff',
    'division_chief',
]

export const ALL_ROLES: Role[] = [
    'head_of_office',
    'admin_staff',
    'division_chief',
    'project_staff',
]

// Helper functions
export const isHRManager = (role: Role) =>
    HR_MANAGERS.includes(role)

export const isReviewer = (role: Role) =>
    REVIEWERS.includes(role)

export const isDivisionChief = (
    role: Role
) => role === 'division_chief'

export const isProjectStaff = (
    role: Role
) => role === 'project_staff'
