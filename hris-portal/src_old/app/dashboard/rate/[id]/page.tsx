import { getIPCRReportData } from '@/app/actions/report'
import RatingForm from '@/components/ipcr/rating-form'
import { DownloadWordButton } from '@/components/ipcr/download-word-button'
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default async function RatePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params
    const id = resolvedParams.id
    const data = await getIPCRReportData(id)

    if (!data) {
        return (
            <div className="p-8">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center gap-4 p-6 text-red-700">
                        <AlertCircle className="h-6 w-6" />
                        <div>
                            <h3 className="font-bold">Not Found</h3>
                            <p>Could not load the requested IPCR data.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-6 pb-24 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Performance Assessment</h1>
                    <p className="text-slate-500">Rate the accomplishments against the success indicators.</p>
                </div>
                {(data.commitment.status === 'rated' || data.commitment.status === 'approved') && (
                    <DownloadWordButton commitmentId={data.commitment.id} />
                )}
            </div>

            <RatingForm
                commitment={data.commitment}
                employee={data.employee}
            />
        </div>
    )
}
