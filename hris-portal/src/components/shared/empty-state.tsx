import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type EmptyStateProps = {
    icon: LucideIcon
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border border-dashed border-slate-200">
            <div className="p-3 bg-slate-50 rounded-full mb-4">
                <Icon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">{description}</p>

            {action && (
                <Button onClick={action.onClick} className="bg-[#1E3A5F]">
                    {action.label}
                </Button>
            )}
        </div>
    )
}
