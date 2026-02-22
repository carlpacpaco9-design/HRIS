'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Paperclip,
    Trash2,
    FileText,
    Image as ImageIcon,
    Loader2,
    ExternalLink,
    UploadCloud,
    File,
    X
} from "lucide-react"
import { uploadEvidence, deleteEvidence, getEvidenceFiles, getEvidenceUrl, Evidence } from "@/app/actions/evidence"

export default function EvidenceModal({ targetId, isLocked }: { targetId: string, isLocked: boolean }) {
    const [isOpen, setIsOpen] = useState(false)
    const [files, setFiles] = useState<Evidence[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            loadFiles()
        }
    }, [isOpen, targetId])

    async function loadFiles() {
        setIsLoading(true)
        const data = await getEvidenceFiles(targetId)
        setFiles(data || [])
        setIsLoading(false)
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        setIsUploading(true)
        const file = e.target.files[0]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('targetId', targetId)

        await uploadEvidence(formData)

        // Reset and reload
        if (fileInputRef.current) fileInputRef.current.value = ''
        await loadFiles()
        setIsUploading(false)
    }

    async function handleDelete(id: string, path: string) {
        if (!confirm('Permanently delete this evidence file?')) return
        const newFiles = files.filter(f => f.id !== id)
        setFiles(newFiles) // Optimistic update
        await deleteEvidence(id, path)
        await loadFiles() // Verify
    }

    async function handleView(path: string) {
        const url = await getEvidenceUrl(path)
        if (url) window.open(url, '_blank')
    }

    const triggerLabel = files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Attach Proof'

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 gap-2 transition-all ${files.length > 0 ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{triggerLabel}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-slate-50/50">
                <DialogHeader className="p-6 bg-white border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <DialogTitle className="text-lg font-bold text-slate-900">Evidence Locker</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-500 text-sm">
                        Manage supporting documents for this target. Allowed: PDF, Images (Max 5MB).
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 bg-slate-50/50 min-h-[300px]">
                    {/* File List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attached Files</h4>
                            {files.length > 0 && <Badge variant="secondary" className="bg-white text-slate-600 shadow-sm border border-slate-200">{files.length}</Badge>}
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500/50" />
                                <span className="text-xs">Loading files...</span>
                            </div>
                        ) : files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-white/50 text-center">
                                <div className="bg-slate-100 p-3 rounded-full mb-3">
                                    <UploadCloud className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-600">No evidence attached yet</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Upload documents to prove your accomplishments</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[220px] pr-4">
                                <div className="space-y-2">
                                    {files.map(file => (
                                        <div key={file.id} className="group flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-2 rounded-lg ${file.file_type.includes('image') ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                                                    {file.file_type.includes('image') ? <ImageIcon className="h-4 w-4" /> : <File className="h-4 w-4" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-700 truncate max-w-[200px]">{file.file_name}</p>
                                                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        <span className="uppercase">{file.file_type.split('/')[1] || 'FILE'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                    onClick={() => handleView(file.file_path)}
                                                    title="View File"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(file.id, file.file_path)}
                                                    title="Delete File"
                                                    disabled={isLocked} // Optional: Lock delete on approved status?
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    {/* Footer Upload Action */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-auto">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={isUploading}
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-slate-900 text-white hover:bg-slate-800 shadow-md h-11"
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading Evidence...
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="mr-2 h-4 w-4" />
                                    Upload New Evidence
                                </>
                            )}
                        </Button>
                        <p className="text-[10px] text-slate-400 text-center mt-2">
                            Supported: PDF, JPG, PNG (Max 5MB)
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
