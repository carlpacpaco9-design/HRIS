'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { Camera, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'

interface AvatarUploadProps {
    userId: string
    currentUrl: string | null
    userName: string
    onUploadComplete: (newUrl: string) => void
}

export function AvatarUpload({ userId, currentUrl, userName, onUploadComplete }: AvatarUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    // Get initials for the fallback
    const initials = userName
        ? userName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
        : ''

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file (PNG, JPG, or JPEG)')
            return
        }

        // Validate file size (e.g., 2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('File is too large. Please upload an image smaller than 2MB.')
            return
        }

        setIsUploading(true)
        const toastId = toast.loading('Uploading profile photo...')

        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `${userId}/${Date.now()}.${fileExt}`

            // 1. Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // 3. Update profiles table
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId)

            if (updateError) throw updateError

            // 4. Success handling
            onUploadComplete(publicUrl)
            toast.success('Profile photo updated successfully', { id: toastId })
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(`Upload failed: ${error.message}`, { id: toastId })
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="group relative">
                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center relative">
                    {currentUrl ? (
                        <Image
                            src={currentUrl}
                            alt={userName}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                            {initials || <User className="h-12 w-12" />}
                        </div>
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-full">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all transform hover:scale-110 border-2 border-white"
                    title="Change Photo"
                >
                    <Camera className="h-5 w-5" />
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            <p className="text-[10px] text-slate-400 font-medium">JPG or PNG (max 2MB)</p>
        </div>
    )
}
