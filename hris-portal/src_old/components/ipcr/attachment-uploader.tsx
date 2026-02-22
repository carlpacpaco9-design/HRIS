'use client'

import { useState, useRef, useCallback } from 'react'
import {
    Upload,
    Paperclip,
    Lock,
    AlertCircle,
    CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { IPCRAttachment, getFileIconType, formatFileSize } from '@/types/ipcr-attachment'
import { uploadIPCRAttachment } from '@/app/actions/ipcr-attachments'
import { FileTypeIcon } from './file-type-icon'

type AttachmentUploaderProps = {
    ipcr_form_id: string
    ipcr_output_id?: string | null
    employee_id: string
    ipcr_status: string
    existing_count: number
    onUploadSuccess: (attachment: IPCRAttachment) => void
    compact?: boolean
}

type UploadingFile = {
    id: string
    name: string
    size: number
    progress: number
    status: 'uploading' | 'success' | 'error'
    error?: string
}

export function AttachmentUploader({
    ipcr_form_id,
    ipcr_output_id,
    employee_id,
    ipcr_status,
    existing_count,
    onUploadSuccess,
    compact = false
}: AttachmentUploaderProps) {
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
    const inputRef = useRef<HTMLInputElement>(null)

    const limit = ipcr_output_id ? 5 : 10
    const isLocked = ipcr_status === 'finalized'
    const isLimitReached = existing_count >= limit

    const updateFileStatus = (id: string, status: 'success' | 'error', error?: string) => {
        setUploadingFiles(prev => prev.map(f =>
            f.id === id ? { ...f, status, progress: status === 'success' ? 100 : 0, error } : f
        ))
    }

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        if (isLocked || isLimitReached) return

        const fileArray = Array.from(files)

        // Add to uploading state
        const newUploads = fileArray.map(file => ({
            id: Math.random().toString(36).substring(7),
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'uploading' as const
        }))

        setUploadingFiles(prev => [...prev, ...newUploads])

        // Process uploads (simulated parallel but limited by browser)
        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i]
            const uploadStateId = newUploads[i].id

            // Validate in frontend first
            if (file.size > 10 * 1024 * 1024) {
                updateFileStatus(uploadStateId, 'error', 'File exceeds 10MB limit')
                continue
            }

            const formData = new FormData()
            formData.append('file', file)
            formData.append('ipcr_form_id', ipcr_form_id)
            if (ipcr_output_id) {
                formData.append('ipcr_output_id', ipcr_output_id)
            } else {
                formData.append('ipcr_output_id', 'null')
            }
            formData.append('employee_id', employee_id)

            // Simulate progress (fake) because Server Actions don't support progress events yet standardly
            const progressInterval = setInterval(() => {
                setUploadingFiles(prev => prev.map(f =>
                    f.id === uploadStateId && f.status === 'uploading'
                        ? { ...f, progress: Math.min(f.progress + 10, 90) }
                        : f
                ))
            }, 200)

            try {
                const res = await uploadIPCRAttachment(formData)
                clearInterval(progressInterval)

                if (res.error) {
                    updateFileStatus(uploadStateId, 'error', res.error)
                    toast.error(`Failed to upload ${file.name}: ${res.error}`)
                } else if (res.data) {
                    updateFileStatus(uploadStateId, 'success')
                    onUploadSuccess(res.data)
                    // Remove from list after delay
                    setTimeout(() => {
                        setUploadingFiles(prev => prev.filter(f => f.id !== uploadStateId))
                    }, 3000)
                }
            } catch (err: any) {
                clearInterval(progressInterval)
                updateFileStatus(uploadStateId, 'error', err.message)
                toast.error(`Error uploading ${file.name}`)
            }
        }

        // Reset input
        if (inputRef.current) inputRef.current.value = ''
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleUpload(e.target.files)
    }

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        handleUpload(e.dataTransfer.files)
    }, [])

    // Render Compact Mode
    if (compact) {
        if (isLocked) {
            return null
        }

        return (
            <div className="flex items-center gap-2">
                <button
                    className={cn(
                        "flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-md",
                        isLimitReached
                            ? "text-amber-600 bg-amber-50 cursor-not-allowed"
                            : "text-muted-foreground hover:text-primary hover:bg-muted"
                    )}
                    onClick={() => !isLimitReached && inputRef.current?.click()}
                    disabled={isLimitReached}
                    type="button"
                >
                    {isLimitReached ? <AlertCircle className="w-3.5 h-3.5" /> : <Paperclip className="w-3.5 h-3.5" />}
                    {isLimitReached
                        ? 'Max files'
                        : (existing_count > 0 ? `${existing_count} file(s)` : 'Attach proof')
                    }
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    multiple // Allow multiple even in compact?
                    onChange={handleFileSelect}
                />

                {/* Minimalist progress for compact */}
                {uploadingFiles.length > 0 && (
                    <div className="flex -space-x-2">
                        {uploadingFiles.map(f => (
                            <div key={f.id} className="w-4 h-4 rounded-full border border-white bg-primary flex items-center justify-center">
                                <span className="animate-spin w-2 h-2 border-2 border-t-transparent border-white rounded-full" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // Render Full Mode
    return (
        <div className="space-y-3">
            {isLocked ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-3 border border-dashed border-muted-foreground/20">
                    <Lock className="w-3.5 h-3.5" />
                    Uploads locked — IPCR is finalized
                </div>
            ) : isLimitReached ? (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-4 py-3 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Maximum {limit} files reached
                </div>
            ) : (
                <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <div className="bg-muted group-hover:bg-white p-3 rounded-full w-fit mx-auto mb-3 transition-colors">
                        <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                        Drop files here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        All file types accepted · Max 10MB per file · Up to {limit} files
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        multiple
                        onChange={handleFileSelect}
                    />
                </div>
            )}

            {/* Upload Progress List */}
            {uploadingFiles.length > 0 && (
                <div className="space-y-2">
                    {uploadingFiles.map(f => (
                        <div key={f.id} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2 border border-border">
                            <FileTypeIcon type={getFileIconType(f.name.split('.').pop() || '')} className="text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs font-medium truncate max-w-[180px]">{f.name}</p>
                                    <span className="text-[10px] text-muted-foreground shrink-0">{f.status === 'uploading' ? `${f.progress}%` : f.status}</span>
                                </div>
                                <div className="h-1.5 bg-border/50 rounded-full overflow-hidden w-full">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-300",
                                            f.status === 'success' && "bg-green-500",
                                            f.status === 'error' && "bg-destructive",
                                            f.status === 'uploading' && "bg-primary"
                                        )}
                                        style={{ width: `${f.progress}%` }}
                                    />
                                </div>
                                {f.error && (
                                    <p className="text-[10px] text-destructive mt-1 truncate">
                                        {f.error}
                                    </p>
                                )}
                            </div>
                            {f.status === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            ) : (
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                    {formatFileSize(f.size)}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
