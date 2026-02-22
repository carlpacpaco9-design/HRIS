'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports</h1>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-slate-500" />
                        System Analytics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-500">Generate productivity and attendance reports.</p>
                    <div className="mt-8 p-8 border-2 border-dashed border-slate-200 rounded-lg text-center">
                        <p className="text-slate-400">Advanced reports module coming soon.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
