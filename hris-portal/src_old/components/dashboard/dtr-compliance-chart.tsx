'use client'

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Clock, BarChart3 } from 'lucide-react'

interface DTRTrendData {
    month: string
    complianceRate: number
    compliantStaff: number
    totalStaff: number
}

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload as DTRTrendData
    return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-md text-sm">
            <p className="font-semibold mb-1">{d.month}</p>
            <p>Compliance: <strong>{d.complianceRate.toFixed(1)}%</strong></p>
            <p className="text-muted-foreground">{d.compliantStaff}/{d.totalStaff} staff</p>
        </div>
    )
}

interface DTRComplianceChartProps {
    data: DTRTrendData[]
}

export function DTRComplianceChart({ data }: DTRComplianceChartProps) {
    const isEmpty = !data || data.length === 0

    return (
        <div className="bg-card border border-border rounded-lg p-5 h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        DTR Compliance Trend
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Monthly attendance compliance rate — last 6 months
                    </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-4 border-t-2 border-dashed border-green-500" />
                    <span>90% target</span>
                </div>
            </div>

            {isEmpty ? (
                <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No DTR data available yet</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id="dtrGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: '#64748B' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tickFormatter={(v: number) => `${v}%`}
                            tick={{ fontSize: 11, fill: '#64748B' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={90} stroke="#22C55E" strokeDasharray="4 4" strokeWidth={1.5} />
                        <Area
                            type="monotone"
                            dataKey="complianceRate"
                            stroke="#1E3A5F"
                            strokeWidth={2.5}
                            fill="url(#dtrGradient)"
                            dot={{ fill: '#1E3A5F', r: 4, strokeWidth: 0 }}
                            activeDot={{ fill: '#F59E0B', r: 6 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}
