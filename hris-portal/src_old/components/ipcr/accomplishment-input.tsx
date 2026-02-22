import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"
import { updateAccomplishments } from '@/app/actions/assessment'

export default function AccomplishmentInput({ targetId, initialValue, isReadOnly }: { targetId: string, initialValue: string, isReadOnly: boolean }) {
    const [value, setValue] = useState(initialValue || '')
    const [isSaving, setIsSaving] = useState(false)
    const [isDirty, setIsDirty] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value)
        setIsDirty(true)
    }

    const handleSave = async () => {
        if (!isDirty) return

        setIsSaving(true)
        const result = await updateAccomplishments(targetId, value)
        setIsSaving(false)

        if (result.error) {
            // alert(result.error) - toast is better
            console.error(result.error)
        } else {
            setIsDirty(false)
        }
    }

    // Auto-save on blur
    const handleBlur = async () => {
        if (isDirty) {
            await handleSave()
        }
    }

    if (isReadOnly) {
        return <div className="text-sm text-slate-700 whitespace-pre-wrap">{value || 'No accomplishments recorded.'}</div>
    }

    return (
        <div className="relative group">
            <textarea
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter actual accomplishments..."
                className="min-h-[100px] w-full resize-none border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all p-4 text-sm text-slate-700 leading-relaxed shadow-sm disabled:opacity-50"
            />
            {isDirty && (
                <div className="absolute top-2 right-2 flex items-center justify-center pointer-events-none">
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    ) : (
                        <span className="text-xs text-amber-500 font-medium bg-white/80 px-1 rounded">Unsaved</span>
                    )}
                </div>
            )}
        </div>
    )
}
