import { differenceInDays, isWeekend, addDays } from 'date-fns'

export const LEAVE_TYPES = [
    'Vacation Leave',
    'Mandatory/Forced Leave',
    'Sick Leave',
    'Maternity Leave',
    'Paternity Leave',
    'Special Privilege Leave',
    'Solo Parent Leave',
    'Study Leave',
    '10-Day VAWC Leave',
    'Rehabilitation Privilege',
    'Special Leave Benefits for Women',
    'Special Emergency (Calamity) Leave',
    'Adoption Leave',
    'Leave Without Pay'
] as const

export type LeaveType = typeof LEAVE_TYPES[number]

export const TRACKED_LEAVES = [
    'Vacation Leave',
    'Sick Leave',
] as const

export function isTrackedLeave(type: string): boolean {
    return TRACKED_LEAVES.includes(type as any)
}

/**
 * Calculates working days between two dates, excluding weekends.
 */
export function calculateWorkingDays(startDateStr: string, endDateStr: string): number {
    const start = new Date(`${startDateStr}T00:00:00`)
    const end = new Date(`${endDateStr}T00:00:00`)

    if (start > end) return 0

    let count = 0
    let current = start

    while (current <= end) {
        if (!isWeekend(current)) {
            count++
        }
        current = addDays(current, 1)
    }

    return count
}
