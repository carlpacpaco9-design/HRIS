import { isHRManager } from './roles'

export type DTRPermission = {
    canLogTime: boolean
    canEditEntry: boolean
    canDeleteEntry: boolean
    canViewAll: boolean
    canViewOwn: boolean
}

export function getDTRPermissions(role: string): DTRPermission {
    const hrManager = isHRManager(role as any)

    return {
        // Only HR Managers manage DTR
        canLogTime: hrManager,
        canEditEntry: hrManager,
        canDeleteEntry: hrManager,
        // Chiefs can view their division
        canViewAll: hrManager || role === 'division_chief',
        // Everyone views own
        canViewOwn: true
    }
}
