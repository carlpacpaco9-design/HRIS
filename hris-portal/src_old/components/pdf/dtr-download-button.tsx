'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { DTRForm48 } from './dtr-form48'
import { Button } from '@/components/ui/button'
import { Printer, Loader2 } from 'lucide-react'

export function DTRDownloadButton({
    profile,
    month,
    year,
    logs,
    monthName
}: {
    profile: any,
    month: string,
    year: string,
    logs: any[],
    monthName: string
}) {
    return (
        <PDFDownloadLink
            document={<DTRForm48 profile={profile} month={monthName} year={year} logs={logs} />}
            fileName={`DTR_${profile?.full_name?.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`}
        >
            {({ blob, url, loading, error }) => (
                <Button
                    variant="default"
                    className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Preparing PDF...
                        </>
                    ) : (
                        <>
                            <Printer className="h-4 w-4" />
                            Print Form 48
                        </>
                    )}
                </Button>
            )}
        </PDFDownloadLink>
    )
}
