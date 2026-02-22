import { Suspense } from "react"
import { getProfile } from "@/app/actions/profile"
import { getDevelopmentPlans } from "@/app/actions/development-plan"
import { getRatingPeriods } from "@/app/actions/ipcr"
import { DevelopmentPlanPageClient } from "@/components/development-plan/development-plan-page-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Development Plan | HRIS Portal",
    description: "Annex K — Professional Development Plan",
}

import { PageContainer } from "@/components/layout/page-container"

export default async function DevelopmentPlanPage() {
    // 1. Fetch data
    const [profile, periodsResult, plansResult] = await Promise.all([
        getProfile(),
        getRatingPeriods(),
        getDevelopmentPlans()
    ])

    const activePeriod = periodsResult.data?.find((p: any) => p.status === 'active')

    return (
        <PageContainer>
            <Suspense fallback={<DevelopmentPlanSkeleton />}>
                <DevelopmentPlanPageClient
                    profile={profile}
                    initialPlans={plansResult.data || []}
                    ratingPeriods={periodsResult.data || []}
                    activePeriod={activePeriod}
                />
            </Suspense>
        </PageContainer>
    )
}

function DevelopmentPlanSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>

            <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        </div>
    )
}
