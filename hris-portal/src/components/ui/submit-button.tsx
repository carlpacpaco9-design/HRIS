import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type SubmitButtonProps = {
    isLoading: boolean
    label: string
    loadingLabel?: string
    className?: string
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function SubmitButton({
    isLoading,
    label,
    loadingLabel,
    className,
    onClick
}: SubmitButtonProps) {
    return (
        <Button
            type="submit"
            disabled={isLoading}
            className={cn("bg-primary text-white hover:bg-primary/90 min-w-[120px]", className)}
            onClick={onClick}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {loadingLabel ?? "Saving..."}
                </>
            ) : (
                label
            )}
        </Button>
    )
}
