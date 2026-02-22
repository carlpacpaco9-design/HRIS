import { isHRManager, isDivisionChief }
    from './roles'
import type { Role } from './roles'

// DTR Permissions
export function getDTRPermissions(
    role: Role
) {
    return {
        canEncodeAll: isHRManager(role),
        canEditEntry: isHRManager(role),
        canDeleteEntry: isHRManager(role),
        canViewAll: isHRManager(role),
        canViewDivision: isDivisionChief(role),
        canViewOwn: true,
        // Form 48: admin gets all employees,
        // others get own only
        canDownloadAnyForm48: isHRManager(role),
        canDownloadOwnForm48: true,
    }
}

// Leave Permissions
export function getLeavePermissions(
    role: Role
) {
    return {
        canFile: true,
        canApprove: isHRManager(role),
        canViewAll: isHRManager(role),
        canViewDivision: isDivisionChief(role),
        canViewOwn: true,
    }
}

// IPCR Permissions
export function getIPCRPermissions(
    role: Role
) {
    return {
        canCreate: true,
        canReview:
            isHRManager(role) ||
            isDivisionChief(role),
        canFinalize: isHRManager(role),
        canRate: isHRManager(role),
        canViewAll: isHRManager(role),
        canViewDivision: isDivisionChief(role),
        canViewOwn: true,
    }
}

// DPCR Permissions
export function getDPCRPermissions(
    role: Role
) {
    return {
        canCreate: isHRManager(role),
        canApprove: isHRManager(role),
        canView: isHRManager(role),
    }
}

// User Management Permissions
export function getUserMgmtPermissions(
    role: Role
) {
    return {
        canManageUsers: role === 'admin_staff',
    }
}

// Admin Panel Permissions
export function getAdminPermissions(
    role: Role
) {
    return {
        canAccessAdmin: isHRManager(role),
    }
}
