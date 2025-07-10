"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calculator, Plus, X } from "lucide-react"
import { Calculator as CalculatorComponent } from "@/components/calculator"

export function MobileFAB() {
  const [showCalculator, setShowCalculator] = useState(false)
  const pathname = usePathname()

  // Only show FAB on tutor page and practice exam pages
  const shouldShowFAB = pathname === "/student/tutor" || pathname.startsWith("/student/practice-exam")

  // Don't render anything if we shouldn't show the FAB
  if (!shouldShowFAB) {
    return null
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <div className="flex flex-col items-end space-y-2">
          {/* Calculator Button */}
          <Button
            onClick={() => setShowCalculator(!showCalculator)}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          >
            {showCalculator ? <X className="h-6 w-6" /> : <Calculator className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Calculator Modal */}
      {showCalculator && (
        <CalculatorComponent onClose={() => setShowCalculator(false)} />
      )}
    </>
  )
} 