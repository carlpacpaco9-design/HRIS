export const LEAVE_TYPES_CONFIG = {
    'Regular': { label: 'Regular Work', deducts: null, color: '' },
    'Absent': { label: 'Absent (LWOP)', deducts: null, color: 'bg-red-100 dark:bg-red-900/20' },
    'Vacation Leave (VL)': { label: 'Vacation Leave', deducts: 'vacation_leave', color: 'bg-blue-100 dark:bg-blue-900/20' },
    'Sick Leave (SL)': { label: 'Sick Leave', deducts: 'sick_leave', color: 'bg-blue-100 dark:bg-blue-900/20' },
    'Wellness Leave': { label: 'Wellness Leave', deducts: 'wellness_leave', limit: 5, color: 'bg-green-100 dark:bg-green-900/20' },
    'Special Privilege Leave (SPL)': { label: 'Special Privilege Leave', deducts: 'special_privilege_leave', limit: 3, color: 'bg-purple-100 dark:bg-purple-900/20' },
    'Maternity Leave': { label: 'Maternity Leave', deducts: 'maternity_leave', color: 'bg-pink-100 dark:bg-pink-900/20' },
    'Paternity Leave': { label: 'Paternity Leave', deducts: 'paternity_leave', color: 'bg-blue-200 dark:bg-blue-800/20' },
    'Solo Parent Leave': { label: 'Solo Parent Leave', deducts: 'solo_parent_leave', color: 'bg-orange-100 dark:bg-orange-900/20' },
    'VAWC Leave': { label: 'VAWC Leave (RA 9262)', deducts: 'vawc_leave', color: 'bg-red-50 dark:bg-red-900/10' },
    'Rehabilitation Leave': { label: 'Rehabilitation Leave', deducts: 'rehabilitation_leave', color: 'bg-purple-50 dark:bg-purple-900/10' },
    'Study Leave': { label: 'Study Leave', deducts: 'study_leave', color: 'bg-indigo-50 dark:bg-indigo-900/10' },
    'Calamity Leave': { label: 'Calamity Leave', deducts: null, color: 'bg-amber-50 dark:bg-amber-900/10' },
    'Official Business / TO': { label: 'Official Business / TO', deducts: null, color: 'bg-yellow-100 dark:bg-yellow-900/20' },
    'Holiday': { label: 'Holiday', deducts: null, color: 'bg-amber-100 dark:bg-amber-900/30' },
    'Suspension': { label: 'Suspension', deducts: null, color: 'bg-slate-200 dark:bg-slate-700' }
}

export type LeaveTypeKey = keyof typeof LEAVE_TYPES_CONFIG;
