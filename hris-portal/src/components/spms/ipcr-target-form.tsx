'use client'

import React, { useMemo } from 'react'
import { useForm, useFieldArray, useWatch, Control } from 'react-hook-form'
import { Plus, Trash2, Calculator, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type IpcrCategory = 'Strategic' | 'Core' | 'Support'

export interface IpcrTarget {
    id?: string
    category: IpcrCategory
    mfo_pap: string
    success_indicator: string
    actual_accomplishment: string
    rating_q: number
    rating_e: number
    rating_t: number
}

interface IpcrFormValues {
    targets: IpcrTarget[]
}

interface IpcrTargetFormProps {
    initialTargets?: IpcrTarget[]
    isReviewPhase?: boolean
    readOnly?: boolean
    onSubmit?: (data: IpcrFormValues) => void
}

/**
 * IpcrTargetForm Component
 * Manages dynamic IPCR targets grouped by category with automatic average calculation.
 */
export function IpcrTargetForm({
    initialTargets = [],
    isReviewPhase = false,
    readOnly = false,
    onSubmit
}: IpcrTargetFormProps) {
    const { register, control, handleSubmit, formState: { errors } } = useForm<IpcrFormValues>({
        defaultValues: {
            targets: initialTargets.length > 0 ? initialTargets : [
                { category: 'Core', mfo_pap: '', success_indicator: '', actual_accomplishment: '', rating_q: 0, rating_e: 0, rating_t: 0 }
            ]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "targets"
    })

    // Watch all targets to calculate real-time averages
    const watchedTargets = useWatch({
        control,
        name: "targets"
    })

    const categories: IpcrCategory[] = ['Strategic', 'Core', 'Support']

    return (
        <form onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined} className="space-y-12">
            {categories.map((category) => {
                const categoryFields = fields.map((field, index) => ({ field, index }))
                    .filter(item => item.field.category === category)

                return (
                    <section key={category} className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "w-2 h-6 rounded-full",
                                    category === 'Strategic' ? "bg-purple-500" :
                                        category === 'Core' ? "bg-primary" : "bg-blue-400"
                                )} />
                                <h2 className="text-xl font-bold tracking-tight">{category} Functions</h2>
                            </div>
                            {!readOnly && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({
                                        category,
                                        mfo_pap: '',
                                        success_indicator: '',
                                        actual_accomplishment: '',
                                        rating_q: 0, rating_e: 0, rating_t: 0
                                    })}
                                    className="hover:bg-primary/5 border-dashed"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add {category} Target
                                </Button>
                            )}
                        </div>

                        {categoryFields.length === 0 ? (
                            <div className="py-8 text-center border-2 border-dashed rounded-xl bg-muted/20 opacity-50">
                                <p className="text-sm">No targets set for this category.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {categoryFields.map(({ field, index }) => (
                                    <TargetRow
                                        key={field.id}
                                        index={index}
                                        register={register}
                                        remove={remove}
                                        isReviewPhase={isReviewPhase}
                                        readOnly={readOnly}
                                        control={control}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                )
            })}

            {!readOnly && (
                <div className="pt-8 border-t flex justify-end gap-4 print:hidden">
                    <Button variant="ghost" type="button">Discard Changes</Button>
                    <Button type="submit" size="lg" className="min-w-[150px]">
                        Save IPCR Form
                    </Button>
                </div>
            )}
        </form>
    )
}

function TargetRow({
    index,
    register,
    remove,
    isReviewPhase,
    readOnly,
    control
}: {
    index: number
    register: any
    remove: (index: number) => void
    isReviewPhase: boolean
    readOnly: boolean
    control: Control<IpcrFormValues>
}) {
    // Watch specific ratings for this row
    const q = useWatch({ control, name: `targets.${index}.rating_q` as any })
    const e = useWatch({ control, name: `targets.${index}.rating_e` as any })
    const t = useWatch({ control, name: `targets.${index}.rating_t` as any })

    const average = useMemo(() => {
        const vals = [Number(q), Number(e), Number(t)].filter(v => v > 0)
        if (vals.length === 0) return 0
        return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
    }, [q, e, t])

    return (
        <Card className="overflow-hidden border-l-4 border-l-muted hover:border-l-primary transition-all shadow-sm">
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Column 1: Commitment */}
                    <div className="lg:col-span-5 p-4 space-y-4 border-r bg-muted/5">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                MFO / PAP
                            </Label>
                            <textarea
                                {...register(`targets.${index}.mfo_pap`)}
                                required
                                disabled={readOnly}
                                placeholder="Major Final Output / Program Action Plan..."
                                className="w-full min-h-[80px] text-sm p-3 rounded-md border focus:ring-2 focus:ring-primary outline-none resize-none bg-white disabled:bg-muted/10 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <Calculator className="w-3 h-3" />
                                Success Indicator
                            </Label>
                            <textarea
                                {...register(`targets.${index}.success_indicator`)}
                                required
                                disabled={readOnly}
                                placeholder="Target Measure (Quantity, Quality, Timeliness)..."
                                className="w-full min-h-[80px] text-sm p-3 rounded-md border focus:ring-2 focus:ring-primary outline-none resize-none bg-white disabled:bg-muted/10 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Column 2: Review/Evaluation */}
                    <div className={cn(
                        "lg:col-span-6 p-4 space-y-4",
                        (!isReviewPhase || readOnly) && "bg-muted/30 grayscale-[0.5]"
                    )}>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <Calculator className="w-3 h-3" />
                                Actual Accomplishment
                            </Label>
                            <textarea
                                {...register(`targets.${index}.actual_accomplishment`)}
                                disabled={!isReviewPhase || readOnly}
                                placeholder={isReviewPhase ? "What was achieved?" : "Evaluation period not yet open"}
                                className="w-full min-h-[80px] text-sm p-3 rounded-md border focus:ring-2 focus:ring-primary outline-none resize-none bg-white disabled:cursor-not-allowed"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {(['q', 'e', 't'] as const).map((rating) => (
                                <div key={rating} className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-center block">
                                        {rating === 'q' ? 'Qual' : rating === 'e' ? 'Effi' : 'Time'}
                                    </Label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="5"
                                        step="1"
                                        disabled={!isReviewPhase || readOnly}
                                        {...register(`targets.${index}.rating_${rating}`, { valueAsNumber: true })}
                                        className="w-full p-2 text-center rounded-md border focus:ring-2 focus:ring-primary outline-none bg-white font-bold disabled:bg-muted/50"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 3: Actions & Score */}
                    <div className="lg:col-span-1 border-l bg-muted/10 p-4 flex flex-col items-center justify-between gap-4">
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Score</p>
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center font-black text-xs border-2 shadow-inner",
                                Number(average) >= 4 ? "bg-green-100 border-green-300 text-green-700" :
                                    Number(average) >= 2 ? "bg-yellow-100 border-yellow-300 text-yellow-700" :
                                        Number(average) > 0 ? "bg-red-100 border-red-300 text-red-700" : "bg-white border-dashed text-muted-foreground"
                            )}>
                                {average}
                            </div>
                        </div>

                        {!readOnly && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
