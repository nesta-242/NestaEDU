import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
