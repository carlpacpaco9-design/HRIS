import { Suspense } from "react"
import { Metadata } from "next"
import { getProfile } from "@/app/actions/profile"
import {
    syncEventStatuses,
    getEventsByMonth,
    getActiveRatingPeriod,
    getComplianceSummary,
    getRatingPeriods,
    getCalendarEvents
} from "@/app/actions/spms-calendar"
import { SPMSCalendarPageClient } from "@/components/spms-calendar/spms-calendar-page-client"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
    title: "SPMS Calendar | HRIS Portal",
    description: "Strategic Performance Management System — Activity Calendar & Deadlines Tracker",
}

import { PageContainer } from "@/components/layout/page-container"

export default async function SPMSCalendarPage() {
    // Auto-sync overdue statuses on every page load
    await syncEventStatuses()

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const [profile, activePeriodResult, periodsResult, monthEventsResult, allEventsResult] = await Promise.all([
        getProfile(),
        getActiveRatingPeriod(),
        getRatingPeriods(),
        getEventsByMonth(currentMonth, currentYear),
        getCalendarEvents()
    ])

    const activePeriod = activePeriodResult.data || null

    const complianceSummary = activePeriod
        ? await getComplianceSummary(activePeriod.id)
        : []

    return (
        <PageContainer>
            <Suspense fallback={<CalendarSkeleton />}>
                <SPMSCalendarPageClient
                    profile={profile}
                    initialEvents={allEventsResult.data || []}
                    initialMonthEvents={monthEventsResult.data || []}
                    activePeriod={activePeriod}
                    ratingPeriods={periodsResult.data || []}
                    complianceSummary={complianceSummary}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                />
            </Suspense>
        </PageContainer>
    )
}

function CalendarSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
    )
}
