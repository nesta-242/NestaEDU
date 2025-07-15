import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to add cache-busting parameters to avatar URLs
export function getAvatarUrl(avatarData: string | null | undefined): string {
  if (!avatarData) {
    return ""
  }
  
  // If it's already a data URL, return it as is
  if (avatarData.startsWith('data:image/')) {
    return avatarData
  }
  
  // If it's a regular URL, add cache-busting parameter
  if (avatarData.startsWith('http://') || avatarData.startsWith('https://')) {
    return `${avatarData}?t=${Date.now()}`
  }
  
  // For any other format, return empty string
  return ""
}

// Utility function to generate a unique key for avatar components
export function getAvatarKey(avatarData: string | null | undefined, prefix: string = "avatar"): string {
  const avatarHash = avatarData ? avatarData.substring(0, 50) : 'no-avatar'
  return `${prefix}-${avatarHash}-${Date.now()}`
}

// Utility function to force refresh all avatar images in the DOM
export function forceAvatarRefresh(): void {
  if (typeof window === 'undefined') return
  
  // Find all avatar images and force them to reload
  const avatarImages = document.querySelectorAll('img[src*="data:image/"]')
  avatarImages.forEach(img => {
    const currentSrc = img.getAttribute('src')
    if (currentSrc && currentSrc.includes('data:image/')) {
      // For data URLs, we need to force a re-render by temporarily clearing and resetting
      const originalSrc = currentSrc
      img.setAttribute('src', '')
      // Set it back immediately to force browser to reload
      setTimeout(() => {
        img.setAttribute('src', originalSrc)
      }, 10)
    }
  })
  
  // Also find and refresh Avatar components by their key
  const avatarComponents = document.querySelectorAll('[data-avatar-key]')
  avatarComponents.forEach(avatar => {
    // Force a re-render by updating the data attribute
    const currentKey = avatar.getAttribute('data-avatar-key')
    if (currentKey) {
      avatar.setAttribute('data-avatar-key', `${currentKey}-${Date.now()}`)
    }
  })
  
  // Dispatch a custom event to notify components
  window.dispatchEvent(new CustomEvent('avatarRefresh', { 
    detail: { timestamp: Date.now() } 
  }))
}

// Utility function to properly capitalize subjects and BJC/BGCSE terms
export function capitalizeSubject(subject: string): string {
  if (!subject) return subject
  
  // First, ensure BJC and BGCSE are always capitalized
  let result = subject
    .replace(/\bbjc\b/gi, 'BJC')
    .replace(/\bbgcse\b/gi, 'BGCSE')
  
  // Then capitalize the first letter of the subject
  return result.charAt(0).toUpperCase() + result.slice(1)
}
