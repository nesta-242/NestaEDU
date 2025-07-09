"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

interface UseExamGuardProps {
  examStarted: boolean
  showResults: boolean
}

export function useExamGuard({ examStarted, showResults }: UseExamGuardProps) {
  const router = useRouter()

  // Handle browser navigation (back/forward, close tab, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examStarted && !showResults) {
        e.preventDefault()
        e.returnValue = "If you leave this page, your exam progress will be lost. Are you sure you want to exit?"
        return "If you leave this page, your exam progress will be lost. Are you sure you want to exit?"
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [examStarted, showResults])

  // Custom navigation function that checks exam state
  const navigateWithGuard = useCallback((url: string) => {
    if (examStarted && !showResults) {
      const confirmed = window.confirm(
        "If you leave this page, your exam progress will be lost. Are you sure you want to exit?"
      )
      if (!confirmed) {
        return false
      }
    }
    router.push(url)
    return true
  }, [examStarted, showResults, router])

  return { navigateWithGuard }
} 