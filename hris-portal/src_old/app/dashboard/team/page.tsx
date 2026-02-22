'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function TeamPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Team</h1>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-slate-500" />
                        Team Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-500">View team members and their assignments.</p>
                    <div className="mt-8 p-8 border-2 border-dashed border-slate-200 rounded-lg text-center">
                        <p className="text-slate-400">Team management module coming soon.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
