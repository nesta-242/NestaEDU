"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { Toast, ToastDescription, ToastTitle } from "@/components/ui/toast"
import { Loader2 } from "lucide-react"

interface ProgressToastProps {
  title: string
  description: string
  progress: number
  isComplete?: boolean
}

export function ProgressToast({ title, description, progress, isComplete = false }: ProgressToastProps) {
  return (
    <Toast className="w-80">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isComplete ? (
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <ToastTitle>{title}</ToastTitle>
          <ToastDescription>{description}</ToastDescription>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Grading Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </Toast>
  )
} 