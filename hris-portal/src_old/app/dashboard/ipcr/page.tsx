import { Suspense } from "react"
import { getProfile } from "@/app/actions/profile"
import { getIPCRForms, getActiveRatingPeriod } from "@/app/actions/ipcr"
import { IPCRPageClient } from "@/components/ipcr/ipcr-page-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "IPCR Management | HRIS Portal",
    description: "Individual Performance Commitment and Review Management System",
}

import { PageContainer } from "@/components/layout/page-container"

export default async function IPCRPage() {
    const profile = await getProfile()

    const [formsResult, activePeriodResult] = await Promise.all([
        getIPCRForms(),
        getActiveRatingPeriod()
    ])

    return (
        <PageContainer className="space-y-8">
            <Suspense fallback={<IPCRPageSkeleton />}>
                <IPCRPageClient
                    initialProfile={profile}
                    initialForms={formsResult.data || []}
                    activePeriod={activePeriodResult.data}
                />
            </Suspense>
        </PageContainer>
    )
}

function IPCRPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                ))}
            </div>
            <Skeleton className="h-[400px] w-full" />
        </div>
    )
}
