'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const ProfileForm = dynamic(() => import('./profile-form'), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center items-center h-64 w-full bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-400 font-medium">Loading profile...</span>
        </div>
    )
})

export default function ProfileClientWrapper(props: any) {
    return <ProfileForm {...props} />
}
