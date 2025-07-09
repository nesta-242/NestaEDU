"use client"

import Link from "next/link"
import { useExamContext } from "@/contexts/exam-context"
import { ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

interface ExamSafeLinkProps {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
  [key: string]: any
}

export function ExamSafeLink({ href, children, className, onClick, ...props }: ExamSafeLinkProps) {
  const { examStarted, showResults } = useExamContext()
  const router = useRouter()
  const pathname = usePathname()

  const handleClick = (e: React.MouseEvent) => {
    // Only show warning if we're on an exam page AND exam is in progress
    const isOnExamPage = pathname.startsWith("/student/practice-exam/")
    if (isOnExamPage && examStarted && !showResults) {
      e.preventDefault()
      const confirmed = window.confirm(
        "If you leave this page, your exam progress will be lost. Are you sure you want to exit?"
      )
      if (!confirmed) {
        return
      }
      // If confirmed, navigate programmatically
      router.push(href)
      return
    }
    
    if (onClick) {
      onClick()
    }
  }

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  )
} 