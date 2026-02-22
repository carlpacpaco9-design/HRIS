import { getIPCRById } from '@/app/actions/ipcr'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { IPCREditor } from '@/components/ipcr/ipcr-editor'
import { isHRManager, isDivisionChief, Role } from '@/lib/roles'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function IPCRDetailPage({ params }: { params: { id: string } }) {
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

    if (!profile) {
        redirect('/login')
    }

    const res = await getIPCRById(params.id)

    if (!res.success || !res.form) {
        redirect('/dashboard/ipcr')
    }

    const role = profile.role as Role
    const isOwner = user.id === res.form.employee_id
    const isHR = isHRManager(role)
    const isChief = isDivisionChief(role)

    const canEdit = isOwner && (res.form.status === 'draft' || res.form.status === 'returned')
    const canRate = isHR && res.form.status === 'reviewed'
    const canReview = (isChief || isHR) && res.form.status === 'submitted'
    const canReturn = isHR && res.form.status === 'reviewed'

    const startDate = new Date(res.form.spms_cycles?.start_date || '')
    const endDate = new Date(res.form.spms_cycles?.end_date || '')

    const periodStr = `${format(startDate, 'MMMM')} to ${format(endDate, 'MMMM yyyy')}`

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link href="/dashboard/ipcr" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 mb-2">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to IPCR List
                    </Link>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">IPCR — {periodStr}</h1>
                            <p className="text-slate-600 mt-1">
                                <span className="font-medium text-slate-800">{res.form.profiles?.full_name}</span> &middot; {res.form.profiles?.position}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                ${res.form.status === 'draft' ? 'bg-slate-100 text-slate-800 border-slate-200' : ''}
                ${res.form.status === 'submitted' ? 'bg-amber-100 text-amber-800 border-amber-200' : ''}
                ${res.form.status === 'reviewed' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                ${res.form.status === 'finalized' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                ${res.form.status === 'returned' ? 'bg-rose-100 text-rose-800 border-rose-200' : ''}
              `}>
                                {res.form.status === 'reviewed' ? 'Endorsed' : res.form.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <span className="block text-sm font-medium text-slate-500">Period</span>
                        <span className="block font-semibold text-slate-900 mt-1">
                            {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
                        </span>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-slate-500">Supervisor</span>
                        <span className="block font-semibold text-slate-900 mt-1">
                            {res.form.immediate_supervisor?.full_name || 'Not assigned'}
                        </span>
                    </div>
                    <div>
                        <span className="block text-sm font-medium text-slate-500">Division</span>
                        <span className="block font-semibold text-slate-900 mt-1">
                            {res.form.profiles?.division}
                        </span>
                    </div>
                </div>

                <IPCREditor
                    ipcr={res.form}
                    initialOutputs={res.outputs || []}
                    canEdit={canEdit}
                    canRate={canRate}
                    canReview={canReview}
                    canReturn={canReturn}
                    currentUserId={user.id}
                />
            </div>
        </div>
    )
}
