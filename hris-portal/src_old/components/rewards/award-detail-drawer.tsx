'use client'

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
    Trophy, Banknote, TrendingUp, Award, GraduationCap,
    Star, CalendarDays, User, Clock, FileText, PencilLine,
    XCircle, CheckCircle2, Info
} from 'lucide-react'
import { RewardIncentive, AwardType, AWARD_TYPE_CONFIG } from '@/types/rewards'
import { ScrollArea } from '@/components/ui/scroll-area'

const AWARD_ICONS: Record<AwardType, React.ElementType> = {
    praise_award: Trophy,
    performance_bonus: Banknote,
    step_increment: TrendingUp,
    certificate_of_recognition: Award,
    scholarship: GraduationCap,
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

const STATUS_CONFIG = {
    approved: { label: 'Pending Award', className: 'bg-amber-100 text-amber-700 border-amber-300' },
    awarded: { label: 'Awarded', className: 'bg-green-100 text-green-700 border-green-300' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-300' },
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface AwardDetailDrawerProps {
    isOpen: boolean
    onClose: () => void
    reward: RewardIncentive | null
    userRole: string
    onMarkAwarded?: (reward: RewardIncentive) => void
    onEdit?: (reward: RewardIncentive) => void
    onCancel?: (reward: RewardIncentive) => void
}

export function AwardDetailDrawer({
    isOpen,
    onClose,
    reward,
    userRole,
    onMarkAwarded,
    onEdit,
    onCancel,
}: AwardDetailDrawerProps) {
    if (!reward) return null

    const config = AWARD_TYPE_CONFIG[reward.award_type]
    const Icon = AWARD_ICONS[reward.award_type]
    const statusCfg = STATUS_CONFIG[reward.status]
    const canManage = ['head_of_office', 'admin_staff'].includes(userRole)

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="right" className="sm:max-w-xl w-full flex flex-col p-0 overflow-hidden">
                <SheetHeader className="p-6 border-b shrink-0 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-start gap-4">
                        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border', BG_COLOR_MAP[config.color], `border-${config.color}-200/50`)}>
                            <Icon className={cn('w-7 h-7', ICON_COLOR_MAP[config.color])} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="text-xl font-bold leading-tight tracking-tight">{reward.award_title}</SheetTitle>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className={cn('text-[10px] h-5 uppercase tracking-wider font-bold', statusCfg.className)}>
                                    {statusCfg.label}
                                </Badge>
                                <Badge variant="outline" className={cn('text-[10px] h-5 uppercase tracking-wider font-bold', BG_COLOR_MAP[config.color], ICON_COLOR_MAP[config.color])}>
                                    {config.label}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-8 pb-10">
                            {/* Staff Member Card */}
                            <section className="space-y-3">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <User className="w-3 h-3" /> Beneficiary Detail
                                </h3>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-inner flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                        {getInitials(reward.staff?.full_name || 'U')}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-base text-slate-800">{reward.staff?.full_name || '—'}</p>
                                        <p className="text-xs text-muted-foreground font-medium">{reward.division?.name || '—'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-primary tracking-tight">
                                            {reward.ipcr_form?.final_average_rating?.toFixed(2) || '—'}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                'text-[10px] h-5 px-1.5 font-bold',
                                                reward.basis_rating === 'Outstanding'
                                                    ? 'bg-amber-100 text-amber-700 border-amber-300'
                                                    : 'bg-blue-100 text-blue-700 border-blue-300'
                                            )}
                                        >
                                            {reward.basis_rating === 'Outstanding' ? (
                                                <Trophy className="w-2.5 h-2.5 mr-1" />
                                            ) : (
                                                <Star className="w-2.5 h-2.5 mr-1" />
                                            )}
                                            {reward.basis_rating}
                                        </Badge>
                                    </div>
                                </div>
                            </section>

                            {/* Award Info */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Info className="w-3 h-3" /> Information & Metadata
                                </h3>
                                <div className="grid grid-cols-2 gap-6 bg-white rounded-2xl border p-5 shadow-sm">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                                            <Award className="w-3 h-3" /> Award Type
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800">{config.label}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                                            <FileText className="w-3 h-3" /> Rating Period
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800">{reward.rating_period?.name || '—'}</p>
                                    </div>
                                    <div className="space-y-1 border-t pt-3">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                                            <CalendarDays className="w-3 h-3" /> Award Date
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {reward.award_date
                                                ? format(new Date(reward.award_date), 'MMMM dd, yyyy')
                                                : <span className="text-muted-foreground italic font-normal">Pending presentation</span>}
                                        </p>
                                    </div>
                                    <div className="space-y-1 border-t pt-3">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                                            <User className="w-3 h-3" /> Recorded By
                                        </p>
                                        <p className="text-sm font-semibold text-slate-800">{reward.awarded_by_profile?.full_name || '—'}</p>
                                    </div>
                                    <div className="col-span-2 space-y-1 border-t pt-3">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" /> System Logs
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Entry created on {format(new Date(reward.created_at), 'MMM dd, yyyy @ hh:mm a')}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Narratives */}
                            {(reward.description || reward.remarks) && (
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> Narratives & Remarks
                                    </h3>
                                    <div className="space-y-4">
                                        {reward.description && (
                                            <div className="bg-amber-50/30 border border-amber-100 rounded-2xl p-5">
                                                <p className="text-[10px] uppercase font-black text-amber-700/60 tracking-widest mb-2">Description</p>
                                                <p className="text-sm leading-relaxed text-slate-700">{reward.description}</p>
                                            </div>
                                        )}
                                        {reward.remarks && (
                                            <div className="bg-slate-100/50 border border-slate-200 rounded-2xl p-5 font-mono italic">
                                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest not-italic mb-2">Administrative Remarks</p>
                                                <p className="text-xs leading-relaxed text-slate-600">"{reward.remarks}"</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <SheetFooter className="p-6 border-t shrink-0 bg-slate-50/80 backdrop-blur-sm sticky bottom-0 z-10 flex flex-col sm:flex-row gap-3 sm:justify-between items-center w-full">
                    <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto hover:bg-slate-200/50">Close View</Button>

                    {canManage && reward.status === 'approved' && (
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                className="flex-1 sm:flex-none text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors"
                                onClick={() => onCancel?.(reward)}
                            >
                                <XCircle className="w-4 h-4 mr-2" /> Cancel
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 sm:flex-none border-slate-200"
                                onClick={() => onEdit?.(reward)}
                            >
                                <PencilLine className="w-4 h-4 mr-2" /> Edit
                            </Button>
                            <Button
                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/10"
                                onClick={() => onMarkAwarded?.(reward)}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Awarded
                            </Button>
                        </div>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
