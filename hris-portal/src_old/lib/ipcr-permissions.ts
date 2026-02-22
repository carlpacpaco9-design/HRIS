import { isHRManager } from './roles'

export interface IPCRPermissions {
    canCreate: boolean
    canReview: boolean
    canFinalize: boolean
    canRate: boolean
    canViewAll: boolean
    canViewDivision: boolean
}

export function getIPCRPermissions(role: string): IPCRPermissions {
    const hrManager = isHRManager(role as any)
    return {
        // Everyone creates own IPCR
        canCreate: true,
        // Chiefs review their division's IPCR
        canReview: hrManager || role === 'division_chief',
        // Only HR Managers finalize
        canFinalize: hrManager,
        // Only HR Managers give ratings
        canRate: hrManager,
        canViewAll: hrManager,
        canViewDivision: role === 'division_chief'
    }
}
