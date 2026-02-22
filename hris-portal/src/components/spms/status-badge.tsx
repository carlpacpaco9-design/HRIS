import { cn } from "@/lib/utils"
import { IpcrStatus } from "@/hooks/use-ipcr-workflow"

interface StatusBadgeProps {
    status: IpcrStatus
    className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const styles: Record<IpcrStatus, string> = {
        'Draft': 'bg-gray-100 text-gray-600 border-gray-200',
        'Submitted': 'bg-amber-100 text-amber-700 border-amber-200',
        'Reviewed': 'bg-blue-100 text-blue-700 border-blue-200',
        'Approved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Returned': 'bg-rose-100 text-rose-700 border-rose-200'
    }

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            styles[status] || styles['Draft'],
            className
        )}>
            {status}
        </span>
    )
}
