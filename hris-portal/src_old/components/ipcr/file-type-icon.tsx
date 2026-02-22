import {
    FileText,
    FileSpreadsheet,
    FileImage,
    File
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileIconType } from '@/types/ipcr-attachment'

type FileTypeIconProps = {
    type: FileIconType
    className?: string
}

export function FileTypeIcon({
    type,
    className
}: FileTypeIconProps) {
    const icons = {
        pdf: <FileText className={cn("w-4 h-4", className)} />,
        word: <FileText className={cn("w-4 h-4", className)} />,
        excel: <FileSpreadsheet className={cn("w-4 h-4", className)} />,
        image: <FileImage className={cn("w-4 h-4", className)} />,
        generic: <File className={cn("w-4 h-4", className)} />
    }
    return icons[type]
}
