export type IPCRAttachment = {
    id: string
    ipcr_form_id: string
    ipcr_output_id?: string | null
    // null = form-level attachment
    file_name: string
    file_size: number
    file_type: string
    file_extension: string
    storage_path: string
    uploaded_by: string
    created_at: string
    // Joined
    uploader?: { full_name: string }
    // Computed on fetch
    download_url?: string
}

export type AttachmentLevel =
    'form' | 'output'

// File icon helper type
export type FileIconType =
    | 'pdf' | 'word' | 'excel'
    | 'image' | 'generic'

export function getFileIconType(
    extension: string
): FileIconType {
    const ext = extension.toLowerCase()
    if (ext === 'pdf') return 'pdf'
    if (['doc', 'docx'].includes(ext)) return 'word'
    if (['xls', 'xlsx', 'csv'].includes(ext))
        return 'excel'
    if (['jpg', 'jpeg', 'png', 'gif',
        'webp', 'svg'].includes(ext))
        return 'image'
    return 'generic'
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576)
        return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
}
