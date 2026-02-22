import { ReactNode } from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type FormFieldWrapperProps = {
    label: string
    required?: boolean
    error?: string
    hint?: string
    children: ReactNode
    className?: string
}

export function FormFieldWrapper({
    label,
    required,
    error,
    hint,
    children,
    className
}: FormFieldWrapperProps) {
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <label className="text-sm font-medium text-foreground">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                </p>
            )}
        </div>
    )
}
