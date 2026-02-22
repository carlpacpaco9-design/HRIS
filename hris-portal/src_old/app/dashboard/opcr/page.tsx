import { Suspense } from "react"
import { getProfile } from "@/app/actions/profile"
import { getOPCRForms, getActiveOPCR } from "@/app/actions/opcr"
import { getRatingPeriods } from "@/app/actions/ipcr"
import { OPCRPageClient } from "@/components/opcr/opcr-page-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "OPCR Management | HRIS Portal",
    description: "Office Performance Commitment and Review Management System",
}

import { PageContainer } from "@/components/layout/page-container"

export default async function OPCRPage() {
    // 1. Fetch User Profile
    const profile = await getProfile()

    // 2. Fetch OPCR Data
    const [formsResult, activeOPCRResult, periodsResult] = await Promise.all([
        getOPCRForms(),
        getActiveOPCR(),
        getRatingPeriods()
    ])

    return (
        <PageContainer className="space-y-8">
            <Suspense fallback={<OPCRPageSkeleton />}>
                <OPCRPageClient
                    profile={profile}
                    initialForms={formsResult.data || []}
                    activeOPCR={activeOPCRResult.data}
                    ratingPeriods={periodsResult.data || []}
                />
            </Suspense>
        </PageContainer>
    )
}

function OPCRPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full" />
        </div>
    )
}
