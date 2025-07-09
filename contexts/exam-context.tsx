"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface ExamContextType {
  examStarted: boolean
  showResults: boolean
  setExamStarted: (started: boolean) => void
  setShowResults: (show: boolean) => void
  resetExamState: () => void
}

const ExamContext = createContext<ExamContextType | undefined>(undefined)

export function ExamProvider({ children }: { children: ReactNode }) {
  const [examStarted, setExamStarted] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const resetExamState = () => {
    setExamStarted(false)
    setShowResults(false)
  }

  return (
    <ExamContext.Provider
      value={{
        examStarted,
        showResults,
        setExamStarted,
        setShowResults,
        resetExamState,
      }}
    >
      {children}
    </ExamContext.Provider>
  )
}

export function useExamContext() {
  const context = useContext(ExamContext)
  if (context === undefined) {
    throw new Error("useExamContext must be used within an ExamProvider")
  }
  return context
} 