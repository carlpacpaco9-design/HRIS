// The 4 roles of the system
export const ROLES = {
    HEAD_OF_OFFICE: 'head_of_office',
    ADMIN_STAFF: 'admin_staff',
    DIVISION_CHIEF: 'division_chief',
    PROJECT_STAFF: 'project_staff'
} as const

export type Role = typeof ROLES[
    keyof typeof ROLES
]

// Roles with full HR management access
// (Office Head + Administrative Division)
export const HR_MANAGERS: Role[] = [
    'head_of_office',
    'admin_staff'
]

// Roles that can review/recommend
// (Division Chiefs)
export const REVIEWERS: Role[] = [
    'head_of_office',
    'admin_staff',
    'division_chief'
]

// All roles (every logged-in user)
export const ALL_ROLES: Role[] = [
    'head_of_office',
    'admin_staff',
    'division_chief',
    'project_staff'
]

// Human-readable role labels
export const ROLE_LABELS: Record<Role, string> = {
    head_of_office: 'Head of Office',
    admin_staff: 'Admin Staff',
    division_chief: 'Division Chief',
    project_staff: 'Project Staff'
}

// Check helpers
export const isHRManager = (role: Role) =>
    HR_MANAGERS.includes(role as Role)

export const isReviewer = (role: Role) =>
    REVIEWERS.includes(role as Role)

export const isDivisionChief = (role: Role) =>
    role === 'division_chief'

export const isProjectStaff = (role: Role) =>
    role === 'project_staff'
