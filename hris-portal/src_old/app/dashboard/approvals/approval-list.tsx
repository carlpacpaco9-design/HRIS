'use client'

import { useState } from 'react'
import { PendingSubmission, reviewSubmission, finalApproveSubmission } from '@/app/actions/approvals'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, XCircle, Eye, Clock, Star, FileBarChart, ArrowLeft } from "lucide-react"
import Link from 'next/link'

export default function ApprovalList({ initialData, teamData = [] }: { initialData: PendingSubmission[], teamData?: any[] }) {
    const [selectedSubmission, setSelectedSubmission] = useState<PendingSubmission | null>(null)

    if (selectedSubmission) {
        return (
            <ReviewDetail
                submission={selectedSubmission}
                onBack={() => setSelectedSubmission(null)}
            />
        )
    }

    return (
        <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                <TabsTrigger value="pending" className="relative">
                    Pending Approvals
                    {initialData.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                            {initialData.length}
                        </span>
                    )}
                </TabsTrigger>
                <TabsTrigger value="team">Details & Ratings</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
                {initialData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <div className="bg-slate-100 p-4 rounded-full mb-4">
                            <CheckCircle2 className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                        <p className="text-sm text-slate-500 max-w-sm mt-1">
                            You have no pending IPCR reviews at the moment.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {initialData.map((submission) => (
                            <ReviewCard
                                key={submission.id}
                                submission={submission}
                                onSelect={() => setSelectedSubmission(submission)}
                            />
                        ))}
                    </div>
                )}
            </TabsContent>

            <TabsContent value="team">
                {teamData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                        <div className="bg-slate-100 p-4 rounded-full mb-4">
                            <FileBarChart className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">No records found</h3>
                        <p className="text-sm text-slate-500 max-w-sm mt-1">
                            Your team members haven't submitted approved IPCRs yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {teamData.map((item) => (
                            <TeamCard key={item.id} data={item} />
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>
    )
}

function TeamCard({ data }: { data: any }) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleReject() {
        if (!confirm(`Are you sure you want to return ${data.staff_name}'s IPCR for revision? This will revert it to Draft status.`)) return

        setIsLoading(true)
        const result = await reviewSubmission(data.id, 'return')
        setIsLoading(false)

        if (result.error) {
            alert(result.error)
        }
    }

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                                {data.staff_name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-base line-clamp-1">{data.staff_name}</CardTitle>
                            <CardDescription className="line-clamp-1">{data.position_title}</CardDescription>
                        </div>
                    </div>
                    <Badge variant={data.status === 'rated' ? 'default' : 'secondary'}>
                        {data.status === 'rated' ? 'RATED' : 'TO RATE'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pb-3 flex-1">
                <div className="flex flex-col gap-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Submitted: {new Date(data.date_submitted).toLocaleDateString()}</span>
                    </div>
                    {data.final_rating ? (
                        <div className="flex items-center gap-2 font-semibold text-slate-700 bg-slate-50 p-2 rounded">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span>{Number(data.final_rating).toFixed(2)} - {data.adjectival_rating}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400 bg-slate-50 p-2 rounded italic">
                            <Star className="h-4 w-4" />
                            <span>Not rated yet</span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 py-3 border-t pt-3 flex gap-2">
                {data.status !== 'rated' && (
                    <Button
                        variant="destructive"
                        size="icon"
                        className="shrink-0"
                        onClick={handleReject}
                        disabled={isLoading}
                        title="Return for Revision"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                )}
                <Link href={`/dashboard/rate/${data.id}`} className="w-full">
                    <Button className="w-full" variant={data.status === 'rated' ? "outline" : "default"}>
                        {data.status === 'rated' ? 'View Assessment' : 'Rate Performance'}
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}

function ReviewCard({ submission, onSelect }: { submission: PendingSubmission, onSelect: () => void }) {
    const isFinalApproval = submission.status === 'rated' || submission.status === 'approved'

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>{submission.staffName?.substring(0, 2).toUpperCase() || 'ST'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-base font-medium">{submission.staffName}</CardTitle>
                            <CardDescription className="text-xs truncate max-w-[180px]">
                                {submission.position || 'No Position Title'}
                            </CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-3 flex-1">
                <div className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Submitted: {submission.dateSubmitted}
                </div>

                {isFinalApproval ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                        <div className="text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">Final Rating</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-slate-900">{submission.final_rating?.toFixed(2)}</span>
                            <span className="text-sm text-slate-600 font-medium">{submission.adjectival_rating}</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Total Targets:</span>
                            <span className="font-medium">{submission.targets.length}</span>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-0">
                <Button
                    onClick={onSelect}
                    variant={isFinalApproval ? "default" : "outline"}
                    className={`w-full ${isFinalApproval ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                >
                    <Eye className="mr-2 h-4 w-4" />
                    {isFinalApproval ? "Review Final Rating" : "Review Targets"}
                </Button>
            </CardFooter>
        </Card>
    )
}

function ReviewDetail({ submission, onBack }: { submission: PendingSubmission, onBack: () => void }) {
    const [isLoading, setIsLoading] = useState(false)
    const isFinalApproval = submission.status === 'rated' || submission.status === 'approved'

    const strategic = submission.targets.filter((t: any) => t.mfo_category === 'strategic')
    const core = submission.targets.filter((t: any) => t.mfo_category === 'core')
    const support = submission.targets.filter((t: any) => t.mfo_category === 'support')

    async function handleReview(decision: 'approve' | 'return') {
        if (!confirm(`Are you sure you want to ${decision} this submission?`)) return

        setIsLoading(true)

        // If it's a final approval (Provincial Assessor), call the final approve action
        if (isFinalApproval && decision === 'approve') {
            const result = await finalApproveSubmission(submission.id)
            if (result.error) {
                alert(result.error)
                setIsLoading(false)
            } else {
                onBack() // Go back to list on success
            }
            return
        }

        const result = await reviewSubmission(submission.id, decision)

        if (result.error) {
            alert(result.error)
            setIsLoading(false)
        } else {
            onBack() // Go back to list on success
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack} size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                        {isFinalApproval ? "Final Approval Review" : "Review IPCR Targets"}
                    </h2>
                    <p className="text-sm text-slate-500">
                        Reviewing submission for <span className="font-medium text-slate-900">{submission.staffName}</span>
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    {isFinalApproval && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="font-semibold text-slate-900 mb-2">Performance Summary</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Numerical Rating</p>
                                    <p className="text-2xl font-bold">{submission.final_rating?.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Adjectival Rating</p>
                                    <Badge variant={
                                        submission.adjectival_rating === 'Outstanding' ? 'default' :
                                            submission.adjectival_rating === 'Very Satisfactory' ? 'secondary' : 'outline'
                                    }>
                                        {submission.adjectival_rating}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    <TargetGroup title="Strategic Priorities" targets={strategic} />
                    <TargetGroup title="Core Functions" targets={core} />
                    <TargetGroup title="Support Functions" targets={support} />
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-6 bg-slate-50 rounded-b-lg">
                    {!isFinalApproval && (
                        <form action={() => handleReview('return')} className="w-full sm:w-auto">
                            <Button
                                type="submit"
                                variant="destructive"
                                className="w-full sm:w-auto"
                                disabled={isLoading}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Return for Revision
                            </Button>
                        </form>
                    )}

                    <form action={() => handleReview('approve')} className="w-full sm:w-auto">
                        <Button
                            type="submit"
                            className={`w-full ${isFinalApproval ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
                            disabled={isLoading}
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {isFinalApproval ? "Final Approve & Sign" : "Approve Targets"}
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}

function TargetGroup({ title, targets }: { title: string, targets: { id: string, output: string, indicators: string }[] }) {
    if (targets.length === 0) return null
    return (
        <div className="space-y-3">
            <h4 className="font-semibold text-sm text-slate-900 border-b pb-1">{title}</h4>
            <div className="space-y-4">
                {targets.map(t => (
                    <div key={t.id} className="text-sm border-l-2 border-slate-200 pl-3">
                        <p className="font-medium text-slate-800">{t.output}</p>
                        <p className="text-slate-500 whitespace-pre-wrap mt-1">{t.indicators}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
