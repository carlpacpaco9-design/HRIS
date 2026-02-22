'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"

interface RatingDistributionData {
    name: string
    count: number
}

// TODO: Replace with real query from commitments/ratings table
const MOCK_RATINGS: RatingDistributionData[] = [
    { name: 'O', count: 4 },
    { name: 'VS', count: 18 },
    { name: 'S', count: 3 },
    { name: 'US', count: 0 },
    { name: 'P', count: 0 },
]

export function PerformanceRatingsChart() {
    // ... logic ...
    const maxVal = Math.max(...MOCK_RATINGS.map((d) => d.count))

    return (
        <Card className="border border-border shadow-sm h-full flex flex-col">
            {/* ... Content ... */}
            <div className="flex-1 min-h-[240px] p-4 relative">
                {/* ... Chart ... */}

                {/* Summary Row */}
                {/* TODO: Replace with real dynamic counts */}
                <div className="absolute bottom-2 right-4 text-xs font-medium text-muted-foreground flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        <span>Rated: 25</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                        <span>Pending: 5</span>
                    </div>
                </div>
            </div>
        </Card>
    )
}

