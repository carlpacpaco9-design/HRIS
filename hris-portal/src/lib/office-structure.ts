// FIXED OFFICE STRUCTURE
// These values are HARDCODED and must
// never be made configurable in the DB.

export const OFFICE_NAME =
    "Provincial Assessor's Office"

export const OFFICE_SHORT = 'PAO'

// The 5 fixed divisions — exact strings
// used in DB profiles.division column
export const DIVISIONS = [
    'Administrative Division',
    'Assessment Records Management Division',
    'Assessment Standards and Valuation Division',
    'Appraisal and Assessment Division',
    'Tax Mapping Division',
] as const

export type Division =
    typeof DIVISIONS[number]

// Fixed positions per division
// Used in User Management dropdowns
export const POSITIONS_BY_DIVISION: Record<Division, string[]> = {
    'Administrative Division': [
        'Provincial Assessor',
        'Administrative Officer',
        'Administrative Assistant',
        'Administrative Aide',
        'Project Staff',
    ],
    'Assessment Records Management Division': [
        'Local Assessment Operations Officer',
        'Computer Programmer',
        'Administrative Aide',
        'Project Staff',
    ],
    'Assessment Standards and Valuation Division': [
        'Local Assessment Operations Officer',
        'Administrative Aide',
    ],
    'Appraisal and Assessment Division': [
        'Local Assessment Operations Officer',
    ],
    'Tax Mapping Division': [
        'Tax Mapper',
    ],
}

// All unique positions (flat)
export const ALL_POSITIONS = [
    'Provincial Assessor',
    'Administrative Officer',
    'Administrative Assistant',
    'Administrative Aide',
    'Local Assessment Operations Officer',
    'Computer Programmer',
    'Tax Mapper',
    'Project Staff',
] as const

export type Position =
    typeof ALL_POSITIONS[number]

// Import Role type
import type { Role } from './roles'

// Smart role assignment
// Used in User Management when
// admin creates a new user
export function determineRole(
    position: string,
    division: Division
): Role {
    // Provincial Assessor = always head
    if (position === 'Provincial Assessor') {
        return 'head_of_office'
    }
    // All Admin Division staff = admin_staff
    // (Division Chief of Admin is manually
    //  set as division_chief if needed)
    if (division === 'Administrative Division') {
        return 'admin_staff'
    }
    // All other positions = project_staff
    // Division Chiefs are manually promoted
    return 'project_staff'
}
