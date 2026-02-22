import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
            <div className="bg-slate-100 p-6 rounded-full mb-6">
                <WifiOff className="w-12 h-12 text-slate-400" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2 underline decoration-red-500/30">You are Offline</h1>
            <p className="text-slate-500 max-w-xs mb-8">
                The Assessor HRIS requires an internet connection to sync your records. Please check your data or Wi-Fi.
            </p>
            <Button asChild className="bg-[#0f172a] hover:bg-slate-800 px-8 py-6 h-auto text-lg font-bold rounded-xl shadow-xl shadow-slate-900/10">
                <Link href="/dashboard">Try Reloading Dashboard</Link>
            </Button>
            <div className="mt-12 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Provincial Assessor's Office - Ilocos Sur
            </div>
        </div>
    )
}
