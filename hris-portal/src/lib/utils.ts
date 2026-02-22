import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatTime12h(timeStr: string | null | undefined, showSuffix: boolean = true) {
  if (!timeStr) return showSuffix ? '--:--' : ''
  try {
    const parts = timeStr.split(':')
    const [h, m] = parts
    if (!h || !m) return timeStr

    let hours = parseInt(h)
    const minutes = m.substring(0, 2)

    // If it's already a small number (1-11) and it's PM departure/arrival, 
    // it was likely saved in 12h format already.
    // However, to be safe, if we just want the display string:
    const ampm = hours >= 12 ? 'PM' : 'AM'
    let displayHours = hours % 12
    displayHours = displayHours ? displayHours : 12

    if (!showSuffix) return `${displayHours}:${minutes}`
    return `${displayHours}:${minutes} ${ampm}`
  } catch (e) {
    return timeStr
  }
}

export function getInitials(name: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
