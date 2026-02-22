import { Suspense } from "react"
import { getProfile } from "@/app/actions/profile"
import { getRatingPeriods } from "@/app/actions/ipcr"
import { getMonitoringJournals } from "@/app/actions/monitoring"
import { MonitoringPageClient } from "@/components/monitoring/monitoring-page-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Monitoring & Coaching Journals | HRIS Portal",
    description: "Performance Monitoring and Coaching Journal Management System",
}

import { PageContainer } from "@/components/layout/page-container"

export default async function MonitoringPage() {
    // 1. Fetch User Profile
    const profile = await getProfile()

    // 2. Fetch Initial Monitoring Data
    const [journalsResult, periodsResult] = await Promise.all([
        getMonitoringJournals(),
        getRatingPeriods()
    ])

    const activePeriod = periodsResult.data?.find((p: any) => p.status === 'active')

    // 3. Calculate current quarter on server for hydration stability
    const currentMonth = new Date().getMonth() + 1
    const currentQuarter = Math.ceil(currentMonth / 3)

    return (
        <PageContainer>
            <Suspense fallback={<MonitoringPageSkeleton />}>
                <MonitoringPageClient
                    profile={profile}
                    initialJournals={journalsResult.data || []}
                    ratingPeriods={periodsResult.data || []}
                    activePeriod={activePeriod}
                    serverQuarter={currentQuarter}
                />
            </Suspense>
        </PageContainer>
    )
}

function MonitoringPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))}
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    )
}
