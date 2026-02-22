import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getProfile } from "@/app/actions/profile"
import { getMonitoringJournalById, getDivisionStaff } from "@/app/actions/monitoring"
import { JournalDetailPageClient } from "@/components/monitoring/journal-detail-page-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Journal Details | HRIS Portal",
    description: "Performance Monitoring and Coaching Journal Details",
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function JournalDetailPage({ params }: PageProps) {
    const { id } = await params

    // 1. Fetch data
    const profile = await getProfile()
    const { data: journal, error } = await getMonitoringJournalById(id)

    if (error || !journal) {
        notFound()
    }

    // 2. Fetch division staff for selectors
    const staff = await getDivisionStaff(journal.division_id)

    return (
        <div className="container mx-auto py-8">
            <Suspense fallback={<JournalDetailSkeleton />}>
                <JournalDetailPageClient
                    profile={profile}
                    journal={journal}
                    employees={staff}
                />
            </Suspense>
        </div>
    )
}

function JournalDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[500px] w-full" />
        </div>
    )
}
