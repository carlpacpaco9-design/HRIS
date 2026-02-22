'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { IPCRDocument } from './ipcr-document'
import { getIPCRReportData } from '@/app/actions/report'

// Import PDFDownloadLink dynamically to avoid SSR issues with @react-pdf/renderer
const PDFDownloadLink: any = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink) as any,
    {
        ssr: false,
        loading: () => (
            <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing PDF...
            </Button>
        ),
    }
)

export default function DownloadIPCRButton({ commitmentId }: { commitmentId: string }) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Fetch data when button mounts
    useEffect(() => {
        if (!commitmentId) return

        async function load() {
            setLoading(true)
            try {
                const reportData = await getIPCRReportData(commitmentId)
                setData(reportData)
            } catch (err) {
                console.error("Failed to load PDF data", err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [commitmentId])

    if (loading || !data) {
        return (
            <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing PDF...
            </Button>
        )
    }

    return (
        <PDFDownloadLink
            document={<IPCRDocument data={data} />}
            fileName={`IPCR_${data.employee.name.replace(/\s+/g, '_')}_${data.period}.pdf`}
        >
            {/* @ts-ignore */}
            {({ blob, url, loading, error }) => (
                <Button variant="outline" disabled={loading} className="gap-2">
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <FileDown className="h-4 w-4" />
                            Download Official IPCR
                        </>
                    )}
                </Button>
            )}
        </PDFDownloadLink>
    )
}
