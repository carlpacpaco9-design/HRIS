// The 5 fixed divisions of the
// Provincial Assessor's Office
// These NEVER change — hardcode them

export const DIVISIONS = [
    'Administrative Division',
    'Assessment Records Management Division',
    'Assessment Standards and Valuation Division',
    'Appraisal and Assessment Division',
    'Tax Mapping Division',
] as const

export type Division = (typeof DIVISIONS)[number]

// Fixed positions per division
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

// All positions flat list (for search / dropdowns)
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

export type Position = (typeof ALL_POSITIONS)[number]

/**
 * Default SPMS role for each position.
 * Note: 'Administrative Aide' in non-Admin divisions
 * gets 'project_staff' — handled by determineRole()
 * below rather than this flat map.
 */
export const POSITION_DEFAULT_ROLE: Record<string, string> = {
    'Provincial Assessor': 'head_of_office',
    'Administrative Officer': 'admin_staff',
    'Administrative Assistant': 'admin_staff',
    'Administrative Aide': 'admin_staff', // overridden by division in determineRole()
    'Local Assessment Operations Officer': 'project_staff',
    'Computer Programmer': 'project_staff',
    'Tax Mapper': 'project_staff',
    'Project Staff': 'project_staff',
}

// ─── Smart Role Assignment ──────────────────────────────────────────────────
/**
 * Determines the correct system role from a position + division combination.
 *
 * Rules:
 *  1. Provincial Assessor → head_of_office (always)
 *  2. Any position in Administrative Division → admin_staff
 *     (Division Chiefs of Admin are set manually by the admin)
 *  3. Everyone else → project_staff
 *     (Division Chiefs of other divisions are set manually by the admin)
 */
export function determineRole(position: string, division: Division): string {
    if (position === 'Provincial Assessor') {
        return 'head_of_office'
    }

    if (division === 'Administrative Division') {
        return 'admin_staff'
    }

    return 'project_staff'
}

// ─── Office Metadata ────────────────────────────────────────────────────────
export const OFFICE_NAME = "Provincial Assessor's Office"
export const OFFICE_SHORT_NAME = 'PAO'
