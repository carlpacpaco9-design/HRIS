'use client'

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingUp, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingTrendData {
    period: string
    averageRating: number
    adjectivalRating: string
    staffCount: number
}

interface RatingTrendChartProps {
    data: RatingTrendData[]
    userRole: string
    divisionName?: string
}

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload as RatingTrendData
    return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-md text-sm">
            <p className="font-semibold mb-1">{d.period}</p>
            <p>Average: <strong>{d.averageRating.toFixed(2)}</strong></p>
            <p className="text-muted-foreground">{d.adjectivalRating}</p>
            <p className="text-muted-foreground">{d.staffCount} staff rated</p>
        </div>
    )
}

export function RatingTrendChart({ data, userRole, divisionName }: RatingTrendChartProps) {
    const isEmpty = !data || data.length === 0

    return (
        <div className="bg-card border border-border rounded-lg p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Office Rating Trend
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Average IPCR rating over last 4 periods
                    </p>
                </div>
                {userRole === 'division_chief' && divisionName && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {divisionName}
                    </span>
                )}
            </div>

            {isEmpty ? (
                <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No rating data available yet</p>
                    <p className="text-xs opacity-70">Data will appear once IPCRs are finalized</p>
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis
                                dataKey="period"
                                tick={{ fontSize: 11, fill: '#64748B' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                domain={[1, 5]}
                                ticks={[1, 2, 3, 4, 5]}
                                tick={{ fontSize: 10, fill: '#64748B' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v: number) => {
                                    const labels: Record<number, string> = {
                                        1: 'Poor', 2: 'Unsat', 3: 'Sat', 4: 'VS', 5: 'OS'
                                    }
                                    return labels[v] ?? String(v)
                                }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine y={3} stroke="#94A3B8" strokeDasharray="4 4" label={{ value: 'Satisfactory', fontSize: 9, fill: '#94A3B8', position: 'right' }} />
                            <Line
                                type="monotone"
                                dataKey="averageRating"
                                stroke="#1E3A5F"
                                strokeWidth={2.5}
                                dot={{ fill: '#F59E0B', r: 5, strokeWidth: 2, stroke: '#1E3A5F' }}
                                activeDot={{ r: 7, fill: '#F59E0B' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>

                    <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground justify-center flex-wrap">
                        {[
                            { v: 5, l: 'Outstanding' },
                            { v: 4, l: 'Very Satisfactory' },
                            { v: 3, l: 'Satisfactory' },
                            { v: 2, l: 'Unsatisfactory' },
                            { v: 1, l: 'Poor' },
                        ].map(item => (
                            <span key={item.v}>{item.v} = {item.l}</span>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
