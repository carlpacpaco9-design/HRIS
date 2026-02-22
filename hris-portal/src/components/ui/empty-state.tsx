import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
    icon?: LucideIcon
    title: string
    description: string
    action?: React.ReactNode
    className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50", className)}>
            {Icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
                    <Icon className="h-6 w-6 text-slate-400" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="max-w-sm text-sm text-slate-500 mt-1 mb-6">{description}</p>
            {action}
        </div>
    )
}
