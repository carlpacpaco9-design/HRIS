import { getDPCRById } from '@/app/actions/dpcr'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DPCREditor } from '@/components/dpcr/dpcr-editor'
import { isHRManager, Role } from '@/lib/roles'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function DPCRDetailPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !isHRManager(profile.role as Role)) {
        redirect('/dashboard')
    }

    const res = await getDPCRById(params.id)

    if (!res.success || !res.form) {
        redirect('/dashboard/dpcr')
    }

    const role = profile.role as Role
    const canEdit = res.form.status === 'draft'
    const canApprove = (role === 'head_of_office' || role === 'admin_staff') && res.form.status === 'submitted'

    const startDate = new Date(res.form.spms_cycles?.start_date || '')
    const endDate = new Date(res.form.spms_cycles?.end_date || '')

    const periodStr = `${format(startDate, 'MMMM')} to ${format(endDate, 'MMMM yyyy')}`

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link href="/dashboard/dpcr" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to DPCR List
                    </Link>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">DPCR — {periodStr}</h1>
                            <p className="text-slate-600 mt-1">
                                <span className="font-medium text-slate-800">Prepared by:</span> {res.form.profiles?.full_name}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                ${res.form.status === 'draft' ? 'bg-slate-100 text-slate-800 border-slate-200' : ''}
                ${res.form.status === 'submitted' ? 'bg-amber-100 text-amber-800 border-amber-200' : ''}
                ${res.form.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : ''}
              `}>
                                {res.form.status === 'submitted' ? 'For Approval' : res.form.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
                    <p className="text-amber-800 text-sm font-medium flex items-center gap-2">
                        <span className="text-lg">⚠</span> DPCR targets serve as the basis for individual IPCR commitments. Define office MFOs here first before employees create their IPCRs.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <span className="block text-sm font-medium text-slate-500">Period</span>
                        <span className="block font-semibold text-slate-900 mt-1">
                            {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
                        </span>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-slate-500">Office</span>
                        <span className="block font-semibold text-slate-900 mt-1">
                            Provincial Assessor's Office
                        </span>
                    </div>
                </div>

                <DPCREditor
                    dpcr={res.form}
                    initialOutputs={res.outputs || []}
                    canEdit={canEdit}
                    canApprove={canApprove}
                />
            </div>
        </div>
    )
}
