'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
    Trophy, Banknote, TrendingUp, Award, GraduationCap,
    Star, FileBarChart, Search, Eye, PencilLine,
    CheckCircle2, XCircle
} from 'lucide-react'
import {
    RewardIncentive,
    EligibleStaff,
    AwardType,
    AwardStatus,
    RewardsSummary,
    AWARD_TYPE_CONFIG,
} from '@/types/rewards'
import { cancelReward } from '@/app/actions/rewards'
import { AwardFormDrawer } from './award-form-drawer'
import { AwardDetailDrawer } from './award-detail-drawer'
import { MarkAwardedDrawer } from './mark-awarded-drawer'
import { EligibleStaffPanel } from './eligible-staff-panel'
import { TopPerformersModal } from './top-performers-modal'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
    approved: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-300' },
    awarded: { label: 'Awarded', className: 'bg-green-100 text-green-700 border-green-300' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-300' },
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface RewardsPageClientProps {
    profile: any
    initialRewards: RewardIncentive[]
    eligibleStaff: EligibleStaff[]
    ratingPeriods: Array<{ id: string; name: string; status: string }>
    activePeriod: { id: string; name: string } | null
    summary: RewardsSummary
    topPerformers: { outstanding: any[]; verySatisfactory: any[] }
}

export function RewardsPageClient({
    profile,
    initialRewards,
    eligibleStaff,
    ratingPeriods,
    activePeriod,
    summary,
    topPerformers,
}: RewardsPageClientProps) {
    const userRole = profile?.role || 'project_staff'
    const divisionName = profile?.division_name || ''

    // Dialog states
    const [showAwardForm, setShowAwardForm] = useState(false)
    const [showTopPerformers, setShowTopPerformers] = useState(false)
    const [selectedReward, setSelectedReward] = useState<RewardIncentive | null>(null)
    const [showDetail, setShowDetail] = useState(false)
    const [showMarkAwarded, setShowMarkAwarded] = useState(false)
    const [cancelTarget, setCancelTarget] = useState<RewardIncentive | null>(null)
    const [preselectedStaff, setPreselectedStaff] = useState<EligibleStaff | null>(null)
    const [preselectedAwardType, setPreselectedAwardType] = useState<AwardType | null>(null)

    // Filter states
    const [activeTab, setActiveTab] = useState<'all' | AwardStatus>('all')
    const [awardTypeFilter, setAwardTypeFilter] = useState<string>('all')
    const [divisionFilter, setDivisionFilter] = useState<string>('all')
    const [periodFilter, setPeriodFilter] = useState<string>('all')
    const [search, setSearch] = useState('')

    const canManage = ['head_of_office', 'admin_staff'].includes(userRole)
    const canSeeAll = ['head_of_office', 'admin_staff'].includes(userRole)

    // Filter rewards
    const filteredRewards = initialRewards.filter(r => {
        if (activeTab !== 'all' && r.status !== activeTab) return false
        if (awardTypeFilter !== 'all' && r.award_type !== awardTypeFilter) return false
        if (divisionFilter !== 'all' && r.division?.name !== divisionFilter) return false
        if (periodFilter !== 'all' && r.rating_period_id !== periodFilter) return false
        if (search && !r.staff?.full_name?.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    // Unique divisions for filter
    const divisions = Array.from(new Set(initialRewards.map(r => r.division?.name).filter(Boolean)))

    const handleGiveAward = (staffMember?: EligibleStaff, type?: AwardType) => {
        setPreselectedStaff(staffMember || null)
        setPreselectedAwardType(type || null)
        setShowAwardForm(true)
    }

    const handleViewDetail = (reward: RewardIncentive) => {
        setSelectedReward(reward)
        setShowDetail(true)
    }

    const handleMarkAwarded = (reward: RewardIncentive) => {
        setSelectedReward(reward)
        setShowDetail(false)
        setShowMarkAwarded(true)
    }

    const handleCancelReward = async (reason: string) => {
        if (!cancelTarget) return
        const result = await cancelReward(cancelTarget.id, reason)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Award cancelled')
        }
        setCancelTarget(null)
    }

    // Page Header
    const getHeader = () => {
        if (canManage) {
            return {
                title: 'Rewards & Incentives',
                subtitle: `PRAISE Awards and Performance-Based Incentives${activePeriod ? ` — ${activePeriod.name}` : ''}`,
                action: (
                    <Button onClick={() => handleGiveAward()} className="bg-amber-600 hover:bg-amber-700">
                        <Trophy className="w-4 h-4 mr-2" /> Give Award
                    </Button>
                ),
            }
        }
        // admin_staff is included in canManage above, so pmt_member block removed
        if (userRole === 'division_chief') {
            return {
                title: 'Division Awards',
                subtitle: `Awards and incentives for ${divisionName}`,
                action: null,
            }
        }
        return {
            title: 'My Awards & Incentives',
            subtitle: 'Your performance recognition records',
            action: null,
        }
    }

    const header = getHeader()

    const allAwardTypes: AwardType[] = [
        'praise_award', 'performance_bonus', 'step_increment',
        'certificate_of_recognition', 'scholarship'
    ]

    return (
        <div className="space-y-6">
            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{header.title}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{header.subtitle}</p>
                </div>
                {header.action}
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {allAwardTypes.map(awardType => {
                    const config = AWARD_TYPE_CONFIG[awardType]
                    const Icon = AWARD_ICONS[awardType]
                    const stats = summary[awardType]

                    return (
                        <div
                            key={awardType}
                            className={cn(
                                'bg-card border border-border rounded-lg p-4',
                                'hover:border-primary/30 transition-colors'
                            )}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', BG_COLOR_MAP[config.color])}>
                                    <Icon className={cn('w-5 h-5', ICON_COLOR_MAP[config.color])} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold leading-tight">{config.label}</p>
                                    <p className="text-xs text-muted-foreground">{config.eligibility}</p>
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-2xl font-bold">{stats?.awarded ?? 0}</p>
                                    <p className="text-xs text-muted-foreground">Awarded</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-amber-600">{stats?.approved ?? 0}</p>
                                    <p className="text-xs text-muted-foreground">Pending</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ELIGIBLE STAFF PANEL (head/admin only) */}
            {canManage && activePeriod && (
                <EligibleStaffPanel
                    staff={eligibleStaff}
                    periodName={activePeriod.name}
                    onGiveAward={handleGiveAward}
                />
            )}

            {/* AWARDS TABLE */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Filter Tabs */}
                <div className="border-b border-border px-4 pt-4">
                    <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
                        <TabsList className="h-9">
                            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                            <TabsTrigger value="approved" className="text-xs">Pending</TabsTrigger>
                            <TabsTrigger value="awarded" className="text-xs">Awarded</TabsTrigger>
                            <TabsTrigger value="cancelled" className="text-xs">Cancelled</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Filter Row */}
                <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-2 flex-1 flex-wrap">
                        <Select value={awardTypeFilter} onValueChange={setAwardTypeFilter}>
                            <SelectTrigger className="w-[160px] h-8 text-xs">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                                {allAwardTypes.map(t => (
                                    <SelectItem key={t} value={t} className="text-xs">
                                        {AWARD_TYPE_CONFIG[t].label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {canSeeAll && (
                            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                                <SelectTrigger className="w-[160px] h-8 text-xs">
                                    <SelectValue placeholder="All Divisions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">All Divisions</SelectItem>
                                    {divisions.map(d => (
                                        <SelectItem key={d} value={d!} className="text-xs">{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <Select value={periodFilter} onValueChange={setPeriodFilter}>
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                                <SelectValue placeholder="All Periods" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs">All Periods</SelectItem>
                                {ratingPeriods.map(p => (
                                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search staff member..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 h-8 text-xs w-[200px]"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                {userRole === 'project_staff' ? (
                                    <>
                                        <TableHead className="text-xs">Award Type</TableHead>
                                        <TableHead className="text-xs">Award Title</TableHead>
                                        <TableHead className="text-xs">Rating Period</TableHead>
                                        <TableHead className="text-xs">Basis Rating</TableHead>
                                        <TableHead className="text-xs">Award Date</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                        <TableHead className="text-xs w-20">Actions</TableHead>
                                    </>
                                ) : userRole === 'division_chief' ? (
                                    <>
                                        <TableHead className="text-xs">Staff Member</TableHead>
                                        <TableHead className="text-xs">Award Type</TableHead>
                                        <TableHead className="text-xs">Award Title</TableHead>
                                        <TableHead className="text-xs">Basis Rating</TableHead>
                                        <TableHead className="text-xs">Award Date</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                        <TableHead className="text-xs w-20">Actions</TableHead>
                                    </>
                                ) : (
                                    <>
                                        <TableHead className="text-xs">Staff Member</TableHead>
                                        <TableHead className="text-xs">Award Type</TableHead>
                                        <TableHead className="text-xs">Award Title</TableHead>
                                        <TableHead className="text-xs">Basis Rating</TableHead>
                                        <TableHead className="text-xs">Award Date</TableHead>
                                        <TableHead className="text-xs">Awarded By</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                        <TableHead className="text-xs w-32">Actions</TableHead>
                                    </>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRewards.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={userRole === 'project_staff' ? 7 : canSeeAll ? 8 : 7}
                                        className="text-center py-10 text-muted-foreground"
                                    >
                                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No awards found</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRewards.map(reward => {
                                const config = AWARD_TYPE_CONFIG[reward.award_type]
                                const Icon = AWARD_ICONS[reward.award_type]
                                const statusCfg = STATUS_CONFIG[reward.status]

                                const AwardTypeBadge = () => (
                                    <div className="flex items-center gap-1.5">
                                        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0', BG_COLOR_MAP[config.color])}>
                                            <Icon className={cn('w-3.5 h-3.5', ICON_COLOR_MAP[config.color])} />
                                        </div>
                                        <span className="text-xs font-medium">{config.label}</span>
                                    </div>
                                )

                                const StaffCell = () => (
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">
                                            {getInitials(reward.staff?.full_name || 'U')}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium">{reward.staff?.full_name || '—'}</p>
                                            {canSeeAll && (
                                                <p className="text-[10px] text-muted-foreground">{reward.division?.name}</p>
                                            )}
                                        </div>
                                    </div>
                                )

                                const BasisRatingCell = () => (
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'text-[10px]',
                                            reward.basis_rating === 'Outstanding'
                                                ? 'bg-amber-100 text-amber-700 border-amber-300'
                                                : 'bg-blue-100 text-blue-700 border-blue-300'
                                        )}
                                    >
                                        {reward.basis_rating === 'Outstanding'
                                            ? <Trophy className="w-2.5 h-2.5 mr-1" />
                                            : <Star className="w-2.5 h-2.5 mr-1" />}
                                        {reward.basis_rating}
                                    </Badge>
                                )

                                const AwardDateCell = () => (
                                    <span className={cn('text-xs', !reward.award_date && 'text-muted-foreground italic')}>
                                        {reward.award_date
                                            ? format(new Date(reward.award_date), 'MMM dd, yyyy')
                                            : 'Pending'}
                                    </span>
                                )

                                const StatusBadge = () => (
                                    <Badge variant="outline" className={cn('text-[10px]', statusCfg.className)}>
                                        {statusCfg.label}
                                    </Badge>
                                )

                                const ActionsCell = () => (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0"
                                            onClick={() => handleViewDetail(reward)}
                                            title="View"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </Button>
                                        {canManage && reward.status === 'approved' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleMarkAwarded(reward)}
                                                    title="Mark as Awarded"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => setCancelTarget(reward)}
                                                    title="Cancel"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )

                                return (
                                    <TableRow key={reward.id} className="hover:bg-muted/20">
                                        {userRole === 'project_staff' ? (
                                            <>
                                                <TableCell><AwardTypeBadge /></TableCell>
                                                <TableCell className="text-xs font-medium max-w-[160px] truncate">{reward.award_title}</TableCell>
                                                <TableCell className="text-xs">{reward.rating_period?.name || '—'}</TableCell>
                                                <TableCell><BasisRatingCell /></TableCell>
                                                <TableCell><AwardDateCell /></TableCell>
                                                <TableCell><StatusBadge /></TableCell>
                                                <TableCell><ActionsCell /></TableCell>
                                            </>
                                        ) : userRole === 'division_chief' ? (
                                            <>
                                                <TableCell><StaffCell /></TableCell>
                                                <TableCell><AwardTypeBadge /></TableCell>
                                                <TableCell className="text-xs font-medium max-w-[140px] truncate">{reward.award_title}</TableCell>
                                                <TableCell><BasisRatingCell /></TableCell>
                                                <TableCell><AwardDateCell /></TableCell>
                                                <TableCell><StatusBadge /></TableCell>
                                                <TableCell><ActionsCell /></TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <TableCell><StaffCell /></TableCell>
                                                <TableCell><AwardTypeBadge /></TableCell>
                                                <TableCell className="text-xs font-medium max-w-[140px] truncate">{reward.award_title}</TableCell>
                                                <TableCell><BasisRatingCell /></TableCell>
                                                <TableCell><AwardDateCell /></TableCell>
                                                <TableCell className="text-xs">{reward.awarded_by_profile?.full_name || '—'}</TableCell>
                                                <TableCell><StatusBadge /></TableCell>
                                                <TableCell><ActionsCell /></TableCell>
                                            </>
                                        )}
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* DIALOGS */}
            <AwardFormDrawer
                isOpen={showAwardForm}
                onClose={() => setShowAwardForm(false)}
                eligibleStaff={eligibleStaff}
                activePeriodName={activePeriod?.name || ''}
                activePeriodId={activePeriod?.id || ''}
                preselectedStaff={preselectedStaff}
                preselectedAwardType={preselectedAwardType}
            />

            <AwardDetailDrawer
                isOpen={showDetail}
                onClose={() => setShowDetail(false)}
                reward={selectedReward}
                userRole={userRole}
                onMarkAwarded={handleMarkAwarded}
                onCancel={(r: RewardIncentive) => { setShowDetail(false); setCancelTarget(r) }}
            />

            <MarkAwardedDrawer
                isOpen={showMarkAwarded}
                onClose={() => setShowMarkAwarded(false)}
                reward={selectedReward}
            />

            <TopPerformersModal
                isOpen={showTopPerformers}
                onClose={() => setShowTopPerformers(false)}
                outstanding={topPerformers.outstanding}
                verySatisfactory={topPerformers.verySatisfactory}
                ratingPeriods={ratingPeriods}
                activePeriodId={activePeriod?.id || ''}
            />

            {/* Cancel Confirmation */}
            <AlertDialog open={!!cancelTarget} onOpenChange={open => !open && setCancelTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Award</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel <strong>{cancelTarget?.award_title}</strong> for{' '}
                            <strong>{cancelTarget?.staff?.full_name}</strong>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Award</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleCancelReward('Cancelled by Provincial Assessor')}
                        >
                            Cancel Award
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
