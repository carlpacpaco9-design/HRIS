'use client'

import { useState } from 'react'
import {
    Download,
    Trash2,
    Paperclip
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    IPCRAttachment,
    getFileIconType,
    formatFileSize
} from '@/types/ipcr-attachment'
import { getAttachmentDownloadUrl } from '@/app/actions/ipcr-attachments'
import { FileTypeIcon } from './file-type-icon'

type AttachmentListProps = {
    attachments: IPCRAttachment[]
    ipcr_form_id: string
    ipcr_status: string
    canDelete: boolean
    currentUserId: string
    onDelete: (id: string) => void
    emptyMessage?: string
    className?: string
}

export function AttachmentList({
    attachments,
    ipcr_form_id,
    ipcr_status,
    canDelete,
    currentUserId,
    onDelete,
    emptyMessage = 'No files attached yet',
    className
}: AttachmentListProps) {
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

    const handleDownload = async (attachment: IPCRAttachment) => {
        try {
            setDownloadingId(attachment.id)
            const url = await getAttachmentDownloadUrl(attachment.storage_path)

            if (!url) {
                toast.error('Download link expired. Please refresh.')
                return
            }

            const a = document.createElement('a')
            a.href = url
            a.download = attachment.file_name
            a.target = '_blank'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        } catch (err) {
            toast.error('Failed to download file')
        } finally {
            setDownloadingId(null)
        }
    }

    if (attachments.length === 0) {
        return (
            <div className={cn("py-6 text-center border-2 border-dashed border-muted rounded-lg", className)}>
                <Paperclip className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className={cn("space-y-1", className)}>
            {attachments.map((attachment) => {
                const iconType = getFileIconType(attachment.file_extension || attachment.file_name.split('.').pop() || '')
                const isOwner = attachment.uploaded_by === currentUserId

                return (
                    <div
                        key={attachment.id}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all group"
                    >
                        {/* File type icon */}
                        <div className={cn(
                            "w-8 h-8 rounded flex items-center justify-center shrink-0",
                            iconType === 'pdf' && "bg-rose-100 text-rose-600",
                            iconType === 'word' && "bg-blue-100 text-blue-600",
                            iconType === 'excel' && "bg-emerald-100 text-emerald-600",
                            iconType === 'image' && "bg-violet-100 text-violet-600",
                            iconType === 'generic' && "bg-slate-100 text-slate-600",
                        )}>
                            <FileTypeIcon type={iconType} />
                        </div>

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">
                                {attachment.file_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                <span>{formatFileSize(attachment.file_size)}</span>
                                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                                <span>{attachment.uploader?.full_name || 'User'}</span>
                                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                                <span>{new Date(attachment.created_at).toLocaleDateString()}</span>
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => handleDownload(attachment)}
                                disabled={downloadingId === attachment.id}
                                title="Download file"
                            >
                                {downloadingId === attachment.id ? (
                                    <span className="w-3.5 h-3.5 border-2 border-t-transparent border-current rounded-full animate-spin" />
                                ) : (
                                    <Download className="w-3.5 h-3.5" />
                                )}
                            </Button>

                            {canDelete && isOwner && ipcr_status !== 'finalized' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => onDelete(attachment.id)}
                                    title="Delete file"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
