import { cn } from "@/lib/utils"

type StatusBadgeProps = {
    status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const getStatusStyles = (status: string) => {
        const s = status.toLowerCase()
        switch (s) {
            case 'active':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'inactive':
                return 'bg-slate-100 text-slate-600 border-slate-200'
            case 'pending':
                return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'approved':
            case 'present':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'rejected':
            case 'absent':
                return 'bg-red-100 text-red-700 border-red-200'
            case 'submitted':
            case 'on leave':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'draft':
                return 'bg-gray-100 text-gray-600 border-gray-200'
            case 'reviewed':
                return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'finalized':
                return 'bg-primary/20 text-primary border-primary/30'
            case 'returned':
                return 'bg-rose-100 text-rose-700 border-rose-200'
            case 'late':
                return 'bg-orange-100 text-orange-700 border-orange-200'
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }

    return (
        <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize",
            getStatusStyles(status)
        )}>
            {status}
        </span>
    )
}
