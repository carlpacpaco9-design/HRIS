'use client'

import { Card } from "@/components/ui/card"
import { Activity } from 'lucide-react'
import Link from 'next/link'

interface ActivityItem {
    id: string
    action: string
    description: string
    user_name: string
    user_initials: string
    created_at: string
    relative_time: string
}

export function ActivityFeed({ data = [] }: { data?: ActivityItem[] }) {
    return (
        <Card className="border border-border shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Recent Activity</h3>
                </div>
                <Link href="/dashboard/activity" className="text-xs font-medium text-primary hover:underline">
                    View all →
                </Link>
            </div>

            <div className="flex-1 overflow-hidden">
                {data.length > 0 ? (
                    <div className="divide-y divide-border/40">
                        {data.map((item) => (
                            <div key={item.id} className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 uppercase">
                                    {item.user_initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm leading-snug">
                                        <span className="font-semibold">{item.user_name}</span>{' '}
                                        <span className="text-muted-foreground">{item.description}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.relative_time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Activity className="w-8 h-8 text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No recent activity
                        </p>
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-border/40 bg-muted/10 text-center">
                <Link href="/dashboard/activity" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    View deeper history →
                </Link>
            </div>
        </Card>
    )
}
