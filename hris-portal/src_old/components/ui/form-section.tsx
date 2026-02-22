import { ReactNode } from "react"
import { cn } from "@/lib/utils"

type FormSectionProps = {
    title: string
    description?: string
    children: ReactNode
    className?: string
}

export function FormSection({
    title,
    description,
    children,
    className
}: FormSectionProps) {
    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="border-b border-border pb-2">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                {description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                )}
            </div>
            <div className="grid gap-4">{children}</div>
        </div>
    )
}
