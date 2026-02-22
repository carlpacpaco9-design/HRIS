'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    Trophy, Banknote, TrendingUp, Award, GraduationCap,
    Star, Search, ChevronLeft, CheckCircle2,
    Users,
    Save
} from 'lucide-react'
import { EligibleStaff, AwardType, AWARD_TYPE_CONFIG } from '@/types/rewards'
import { createReward } from '@/app/actions/rewards'
import { ScrollArea } from '@/components/ui/scroll-area'

const rewardSchema = z.object({
    staff_id: z.string().min(1, 'Staff member is required'),
    ipcr_form_id: z.string().min(1, 'IPCR reference is required'),
    award_type: z.enum([
        'praise_award', 'performance_bonus',
        'step_increment', 'certificate_of_recognition', 'scholarship'
    ]),
    award_title: z.string().min(3, 'Award title is required').max(200),
    description: z.string().max(300).optional(),
    award_date: z.string().optional(),
    remarks: z.string().max(300).optional(),
})

type RewardFormValues = z.infer<typeof rewardSchema>

const AWARD_ICONS: Record<AwardType, React.ElementType> = {
    praise_award: Trophy,
    performance_bonus: Banknote,
    step_increment: TrendingUp,
    certificate_of_recognition: Award,
    scholarship: GraduationCap,
}

const COLOR_MAP: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-700 border-amber-300',
    green: 'bg-green-100 text-green-700 border-green-300',
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    purple: 'bg-purple-100 text-purple-700 border-purple-300',
    teal: 'bg-teal-100 text-teal-700 border-teal-300',
}

const ICON_COLOR_MAP: Record<string, string> = {
    amber: 'text-amber-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    teal: 'text-teal-600',
}

const BG_COLOR_MAP: Record<string, string> = {
    amber: 'bg-amber-100',
    green: 'bg-green-100',
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    teal: 'bg-teal-100',
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getTitleSuggestion(awardType: AwardType, periodName: string): string {
    switch (awardType) {
        case 'praise_award': return `PRAISE Award — ${periodName}`
        case 'performance_bonus': return `Performance Bonus — ${periodName}`
        case 'step_increment': return `Step Increment — ${periodName}`
        case 'certificate_of_recognition': return `Certificate of Recognition — ${periodName}`
        case 'scholarship': return `Scholarship Grant — ${periodName}`
        default: return ''
    }
}

interface AwardFormDrawerProps {
    isOpen: boolean
    onClose: () => void
    eligibleStaff: EligibleStaff[]
    activePeriodName: string
    activePeriodId: string
    preselectedStaff?: EligibleStaff | null
    preselectedAwardType?: AwardType | null
}

export function AwardFormDrawer({
    isOpen,
    onClose,
    eligibleStaff,
    activePeriodName,
    activePeriodId,
    preselectedStaff,
    preselectedAwardType,
}: AwardFormDrawerProps) {
    const [step, setStep] = useState(1)
    const [selectedStaff, setSelectedStaff] = useState<EligibleStaff | null>(null)
    const [selectedAwardType, setSelectedAwardType] = useState<AwardType | null>(null)
    const [search, setSearch] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<RewardFormValues>({
        resolver: zodResolver(rewardSchema),
        defaultValues: {
            staff_id: '',
            ipcr_form_id: '',
            award_type: undefined,
            award_title: '',
            description: '',
            award_date: '',
            remarks: '',
        },
    })

    // Apply preselections when drawer opens
    useEffect(() => {
        if (isOpen) {
            setStep(preselectedStaff ? 2 : 1)
            setSelectedStaff(preselectedStaff || null)
            setSelectedAwardType(preselectedAwardType || null)
            setSearch('')
            if (preselectedStaff) {
                form.setValue('staff_id', preselectedStaff.staff_id)
                form.setValue('ipcr_form_id', preselectedStaff.ipcr_form_id)
            }
            if (preselectedAwardType && preselectedStaff) {
                form.setValue('award_type', preselectedAwardType)
                form.setValue('award_title', getTitleSuggestion(preselectedAwardType, activePeriodName))
            }
        }
    }, [isOpen, preselectedStaff, preselectedAwardType])

    const filteredStaff = eligibleStaff.filter(e =>
        e.full_name.toLowerCase().includes(search.toLowerCase()) ||
        e.division_name.toLowerCase().includes(search.toLowerCase())
    )

    const handleSelectStaff = (emp: EligibleStaff) => {
        setSelectedStaff(emp)
        form.setValue('staff_id', emp.staff_id)
        form.setValue('ipcr_form_id', emp.ipcr_form_id)
        setSelectedAwardType(null)
        form.setValue('award_type', undefined as any)
    }

    const handleSelectAwardType = (type: AwardType) => {
        if (!selectedStaff) return
        const config = AWARD_TYPE_CONFIG[type]
        // Disable PRAISE for VS staff
        if (config.outstandingOnly && selectedStaff.adjectival_rating !== 'Outstanding') return
        // Disable already-given awards
        if (selectedStaff.existing_awards.includes(type)) return

        setSelectedAwardType(type)
        form.setValue('award_type', type)
        form.setValue('award_title', getTitleSuggestion(type, activePeriodName))
    }

    const handleNext = () => {
        if (!selectedStaff || !selectedAwardType) {
            toast.error('Please select both a staff member and an award type')
            return
        }
        setStep(2)
    }

    const handleBack = () => {
        setStep(1)
    }

    const handleClose = () => {
        if (!isSubmitting) {
            form.reset()
            setStep(1)
            setSelectedStaff(null)
            setSelectedAwardType(null)
            setSearch('')
            onClose()
        }
    }

    const onSubmit = async (values: RewardFormValues) => {
        setIsSubmitting(true)
        try {
            const result = await createReward({
                ...values,
                rating_period_id: activePeriodId,
                basis_rating: selectedStaff!.adjectival_rating,
            })

            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.success('Award successfully recorded')
            handleClose()
        } catch {
            toast.error('Failed to create award')
        } finally {
            setIsSubmitting(false)
        }
    }

    const allAwardTypes: AwardType[] = [
        'praise_award', 'performance_bonus', 'step_increment',
        'certificate_of_recognition', 'scholarship'
    ]

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0 overflow-hidden">
                <SheetHeader className="p-6 border-b shrink-0 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-2.5 rounded-xl shadow-sm border border-amber-200/50">
                            <Trophy className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold flex items-center gap-2 tracking-tight">
                                {step === 1 ? 'Select Recipient' : 'Award Details'}
                                <Badge variant="outline" className="ml-2 font-bold uppercase text-[9px] tracking-widest bg-amber-50 text-amber-700 border-amber-200">
                                    Step {step} of 2
                                </Badge>
                            </SheetTitle>
                            <SheetDescription className="text-xs">
                                {step === 1
                                    ? 'Choose an eligible staff member and award type based on performance.'
                                    : 'Review basis and specify the formal details of the award.'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
                            {step === 1 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                                    {/* Rating Period (read-only) */}
                                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Active Rating Period</p>
                                            <p className="text-sm font-semibold text-primary">{activePeriodName}</p>
                                        </div>
                                        <Badge variant="secondary">Annual</Badge>
                                    </div>

                                    {/* Staff Selector */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Select Staff Member</p>
                                            <Badge variant="outline">{filteredStaff.length} Eligible</Badge>
                                        </div>

                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name or division..."
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                                            {filteredStaff.length === 0 ? (
                                                <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                                                    <Users className="w-10 h-10 mb-3 opacity-20" />
                                                    <p className="text-sm font-medium">No eligible staff found</p>
                                                    <p className="text-xs opacity-70">Try adjusting your search query</p>
                                                </div>
                                            ) : filteredStaff.map(emp => {
                                                const allGiven = emp.existing_awards.length === allAwardTypes.length
                                                const isSelected = selectedStaff?.staff_id === emp.staff_id
                                                return (
                                                    <div
                                                        key={emp.staff_id}
                                                        onClick={() => !allGiven && handleSelectStaff(emp)}
                                                        className={cn(
                                                            'border rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all',
                                                            isSelected
                                                                ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-sm'
                                                                : 'border-white bg-white hover:border-primary/20 hover:bg-white hover:shadow-sm',
                                                            allGiven && 'opacity-50 cursor-not-allowed bg-slate-100'
                                                        )}
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 border border-slate-200">
                                                            {getInitials(emp.full_name)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-sm truncate text-slate-800">{emp.full_name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{emp.division_name}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-lg font-bold text-slate-700 leading-none">
                                                                    {emp.final_average_rating.toFixed(2)}
                                                                </span>
                                                                <Badge
                                                                    className={cn(
                                                                        'text-[9px] h-4 px-1.5 mt-1 font-normal',
                                                                        emp.adjectival_rating === 'Outstanding'
                                                                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                                            : 'bg-blue-100 text-blue-700 border-blue-200'
                                                                    )}
                                                                    variant="outline"
                                                                >
                                                                    {emp.adjectival_rating === 'Outstanding' ? (
                                                                        <Trophy className="w-2 h-2 mr-1" />
                                                                    ) : (
                                                                        <Star className="w-2 h-2 mr-1" />
                                                                    )}
                                                                    {emp.adjectival_rating}
                                                                </Badge>
                                                            </div>
                                                            {allGiven && (
                                                                <p className="text-[9px] text-emerald-600 font-medium mt-1">✓ Completed</p>
                                                            )}
                                                        </div>
                                                        {isSelected && (
                                                            <div className="absolute right-3 top-3">
                                                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Award Type Selector */}
                                    {selectedStaff && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Select Award Type</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {allAwardTypes.map(type => {
                                                    const config = AWARD_TYPE_CONFIG[type]
                                                    const Icon = AWARD_ICONS[type]
                                                    const alreadyGiven = selectedStaff.existing_awards.includes(type)
                                                    const praiseDisabled = config.outstandingOnly && selectedStaff.adjectival_rating !== 'Outstanding'
                                                    const isDisabled = alreadyGiven || praiseDisabled
                                                    const isSelected = selectedAwardType === type

                                                    return (
                                                        <div
                                                            key={type}
                                                            onClick={() => !isDisabled && handleSelectAwardType(type)}
                                                            className={cn(
                                                                'border rounded-xl p-3 cursor-pointer transition-all relative overflow-hidden',
                                                                isSelected
                                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-sm'
                                                                    : 'border-border bg-white hover:border-primary/40 hover:shadow-sm',
                                                                isDisabled && 'opacity-60 cursor-not-allowed bg-slate-50 border-dashed'
                                                            )}
                                                        >
                                                            <div className="flex items-start gap-3 relative z-10">
                                                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', BG_COLOR_MAP[config.color])}>
                                                                    <Icon className={cn('w-4 h-4', ICON_COLOR_MAP[config.color])} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="text-xs font-bold leading-none text-slate-800">{config.label}</p>
                                                                    <p className="text-[10px] text-muted-foreground leading-snug">{config.eligibility}</p>
                                                                </div>
                                                            </div>

                                                            {alreadyGiven && (
                                                                <Badge variant="secondary" className="mt-2 text-[9px] bg-green-100 text-green-700 border-green-200">
                                                                    ✓ Already Awarded
                                                                </Badge>
                                                            )}
                                                            {praiseDisabled && !alreadyGiven && (
                                                                <Badge variant="secondary" className="mt-2 text-[9px] bg-red-100 text-red-700 border-red-200">
                                                                    Requires Outstanding
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {step === 2 && selectedStaff && selectedAwardType && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    {/* Staff summary */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0 shadow-sm">
                                            {getInitials(selectedStaff.full_name)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-base text-slate-800">{selectedStaff.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedStaff.division_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex flex-col items-end">
                                                <p className="text-xl font-black text-slate-800 tracking-tight">{selectedStaff.final_average_rating.toFixed(2)}</p>
                                                <Badge
                                                    className={cn(
                                                        'text-[10px] font-normal px-2',
                                                        selectedStaff.adjectival_rating === 'Outstanding'
                                                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                            : 'bg-blue-100 text-blue-700 border-blue-200'
                                                    )}
                                                    variant="outline"
                                                >
                                                    {selectedStaff.adjectival_rating}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Award Title */}
                                    <FormField
                                        control={form.control}
                                        name="award_title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Award Title <span className="text-red-500">*</span></FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g. PRAISE Award — 2024" className="font-semibold" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Description */}
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder="Brief description of the award or basis for recognition"
                                                        className="resize-none min-h-[80px]"
                                                        maxLength={300}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Award Date */}
                                        <FormField
                                            control={form.control}
                                            name="award_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Award Date <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <p className="text-[10px] text-muted-foreground">Leave blank if pending</p>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Remarks */}
                                    <FormField
                                        control={form.control}
                                        name="remarks"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Remarks <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder="Additional notes or conditions"
                                                        className="resize-none min-h-[80px]"
                                                        maxLength={300}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* IPCR Reference Card */}
                                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-3 flex items-center gap-2">
                                            <Award className="w-4 h-4" /> Performance Basis
                                        </p>
                                        <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-xs">
                                            <div>
                                                <span className="text-muted-foreground block mb-0.5">Rating Period</span>
                                                <span className="font-semibold text-slate-800">{activePeriodName}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block mb-0.5">Basis Rating</span>
                                                <span className="font-semibold text-slate-800">
                                                    {selectedStaff.final_average_rating.toFixed(2)} — {selectedStaff.adjectival_rating}
                                                </span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-muted-foreground block mb-0.5">Award Type</span>
                                                <span className="font-semibold text-slate-800">{AWARD_TYPE_CONFIG[selectedAwardType].label}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </Form>
                </div>

                <SheetFooter className="p-6 border-t shrink-0 bg-slate-50/80 backdrop-blur-sm sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3 sm:justify-between items-center w-full">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto hover:bg-slate-200/50 transition-colors"
                    >
                        Cancel
                    </Button>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {step === 2 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none border-slate-200 bg-white"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                        )}

                        {step === 1 ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={!selectedStaff || !selectedAwardType}
                                className="flex-1 sm:flex-none shadow-md"
                            >
                                Continue to Details
                            </Button>
                        ) : (
                            <Button
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
                            >
                                {isSubmitting ? (
                                    <>Saving...</>
                                ) : (
                                    <>
                                        <Trophy className="w-4 h-4 mr-2" />
                                        Finalize Award
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
