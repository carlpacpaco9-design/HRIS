import { Metadata } from 'next'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getProfile } from '@/app/actions/profile'
import { getRatingPeriods } from '@/app/actions/ipcr'
import {
    getRewards,
    getEligibleStaff,
    getRewardsSummary,
    getTopPerformers,
} from '@/app/actions/rewards'
import { RewardsPageClient } from '@/components/rewards/rewards-page-client'

export const metadata: Metadata = {
    title: 'Rewards & Incentives | HRIS Portal',
    description: 'PRAISE Awards and Performance-Based Incentives — SPMS Stage 4',
}

export const dynamic = 'force-dynamic'

import { PageContainer } from "@/components/layout/page-container"

export default async function RewardsPage() {
    const [profile, periodsResult] = await Promise.all([
        getProfile(),
        getRatingPeriods(),
    ])

    const periods = periodsResult.data || []
    const activePeriod = periods.find((p: any) => p.status === 'active') || null

    const [rewardsResult, eligibleStaff, summary, topPerformers] = await Promise.all([
        getRewards(),
        activePeriod ? getEligibleStaff(activePeriod.id) : Promise.resolve([]),
        activePeriod ? getRewardsSummary(activePeriod.id) : Promise.resolve({}),
        activePeriod ? getTopPerformers(activePeriod.id) : Promise.resolve({ outstanding: [], verySatisfactory: [] }),
    ])

    return (
        <PageContainer>
            <Suspense fallback={<RewardsSkeleton />}>
                <RewardsPageClient
                    profile={profile}
                    initialRewards={rewardsResult.data || []}
                    eligibleStaff={eligibleStaff}
                    ratingPeriods={periods}
                    activePeriod={activePeriod ? { id: activePeriod.id, name: activePeriod.name } : null}
                    summary={summary}
                    topPerformers={topPerformers as any}
                />
            </Suspense>
        </PageContainer>
    )
}

function RewardsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
            </div>
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
    )
}
