'use client'

import React from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LucideIcon } from 'lucide-react'

// You can use this as a wrapper for any widget to give it consistent spacing/headers
interface DashboardWidgetProps {
    title: string
    icon?: LucideIcon
    action?: React.ReactNode
    children: React.ReactNode
    className?: string
}

export function DashboardWidget({ title, icon: Icon, action, children, className }: DashboardWidgetProps) {
    return (
        <Card className={cn("border-slate-200 overflow-hidden", className)}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    {Icon && (
                        <div className="p-1.5 bg-white border border-slate-200 shadow-sm rounded-md">
                            <Icon className="h-4 w-4 text-slate-500" />
                        </div>
                    )}
                    <h3 className="font-bold text-slate-700 text-sm">{title}</h3>
                </div>
                {action}
            </div>
            <div className="p-6">
                {children}
            </div>
        </Card>
    )
}
