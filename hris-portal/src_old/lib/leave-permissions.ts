import { isHRManager } from './roles'

export interface LeavePermissions {
    canFile: boolean
    canApprove: boolean
    canRecommend: boolean
    canViewAll: boolean
    canViewDivision: boolean
    canViewOwn: boolean
}

export function getLeavePermissions(role: string): LeavePermissions {
    const hrManager = isHRManager(role as any)
    return {
        // Everyone can file leaves
        canFile: true,
        // Only HR Managers give final approval
        canApprove: hrManager,
        // Chiefs can recommend (first-level)
        canRecommend: role === 'division_chief',
        // HR Managers see all,
        // Chiefs see own division,
        // Staff see own only
        canViewAll: hrManager,
        canViewDivision: role === 'division_chief',
        canViewOwn: true
    }
}
