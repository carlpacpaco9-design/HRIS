'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SPMSStage {
    stage: string
    label: string
    completed: number
    total: number
    percentage: number
    color: string
}

interface SPMSCycleGaugeProps {
    data: SPMSStage[]
}

export function SPMSCycleGauge({ data }: SPMSCycleGaugeProps) {
    const overallPercentage = data.length > 0
        ? Math.round(data.reduce((sum, s) => sum + s.percentage, 0) / data.length)
        : 0

    const gaugeData = [{ value: overallPercentage, fill: '#1E3A5F' }]

    return (
        <div className="bg-card border border-border rounded-lg p-5 h-full">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary" />
                SPMS Cycle Progress
            </h3>

            {data.length === 0 ? (
                <div className="h-[160px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Activity className="w-8 h-8 opacity-20" />
                    <p className="text-xs">No active rating period</p>
                </div>
            ) : (
                <>
                    {/* Radial Gauge */}
                    <div className="flex items-center justify-center mb-4">
                        <div className="relative">
                            <ResponsiveContainer width={160} height={160}>
                                <RadialBarChart
                                    cx="50%" cy="50%"
                                    innerRadius="60%" outerRadius="100%"
                                    data={gaugeData}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    <RadialBar
                                        dataKey="value"
                                        cornerRadius={8}
                                        background={{ fill: '#F1F5F9' }}
                                        max={100}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            {/* Center text overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-primary leading-none">
                                    {overallPercentage}%
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-1">Complete</span>
                            </div>
                        </div>
                    </div>

                    {/* Stage Breakdown */}
                    <div className="space-y-2.5">
                        {data.map(stage => (
                            <div key={stage.stage}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="font-medium leading-tight">{stage.label}</span>
                                    <span className="text-muted-foreground shrink-0 ml-2">
                                        {stage.completed}/{stage.total}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn('h-full rounded-full transition-all duration-700', stage.color)}
                                        style={{ width: `${stage.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
