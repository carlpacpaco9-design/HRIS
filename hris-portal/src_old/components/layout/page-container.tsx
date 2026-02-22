import { cn } from '@/lib/utils'

type PageContainerProps = {
    children: React.ReactNode
    className?: string
}

export function PageContainer({
    children,
    className
}: PageContainerProps) {
    return (
        <div className={cn(
            "container mx-auto",
            "px-4 sm:px-6",
            "py-6",
            "max-w-7xl",
            className
        )}>
            {children}
        </div>
    )
}
