"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Move } from "lucide-react"

interface MathKeyboardProps {
  onInsert: (symbol: string) => void
  onClose: () => void
}

export function MathKeyboard({ onInsert, onClose }: MathKeyboardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 50, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (cardRef.current) {
      setIsDragging(true)
      const rect = cardRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && cardRef.current) {
        const cardWidth = cardRef.current.offsetWidth
        const cardHeight = cardRef.current.offsetHeight
        let newX = e.clientX - dragOffset.x
        let newY = e.clientY - dragOffset.y

        // Constrain movement within the viewport
        newX = Math.max(0, Math.min(newX, window.innerWidth - cardWidth))
        newY = Math.max(0, Math.min(newY, window.innerHeight - cardHeight))

        setPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  const mathSymbols = [
    // Basic operations
    { symbol: "+", label: "Plus" },
    { symbol: "−", label: "Minus" },
    { symbol: "±", label: "Plus or minus" },
    { symbol: "×", label: "Multiply" },
    { symbol: "÷", label: "Divide" },
    { symbol: "=", label: "Equals" },
    { symbol: "≠", label: "Not equal" },

    // Fractions and powers
    { symbol: "½", label: "One half" },
    { symbol: "¼", label: "One quarter" },
    { symbol: "¾", label: "Three quarters" },
    { symbol: "²", label: "Squared" },
    { symbol: "³", label: "Cubed" },
    { symbol: "ⁿ", label: "To the power of n" },

    // Roots
    { symbol: "√", label: "Square root" },
    { symbol: "∛", label: "Cube root" },

    // Comparison
    { symbol: "<", label: "Less than" },
    { symbol: ">", label: "Greater than" },
    { symbol: "≤", label: "Less than or equal" },
    { symbol: "≥", label: "Greater than or equal" },
    { symbol: "≈", label: "Approximately equal" },

    // Greek letters
    { symbol: "π", label: "Pi" },
    { symbol: "θ", label: "Theta" },
    { symbol: "α", label: "Alpha" },
    { symbol: "β", label: "Beta" },
    { symbol: "γ", label: "Gamma" },
    { symbol: "δ", label: "Delta" },
    { symbol: "λ", label: "Lambda" },
    { symbol: "μ", label: "Mu" },
    { symbol: "σ", label: "Sigma" },
    { symbol: "φ", label: "Phi" },

    // Set theory
    { symbol: "∈", label: "Element of" },
    { symbol: "∉", label: "Not element of" },
    { symbol: "⊂", label: "Subset of" },
    { symbol: "⊃", label: "Superset of" },
    { symbol: "∪", label: "Union" },
    { symbol: "∩", label: "Intersection" },
    { symbol: "∅", label: "Empty set" },

    // Logic
    { symbol: "∧", label: "And" },
    { symbol: "∨", label: "Or" },
    { symbol: "¬", label: "Not" },
    { symbol: "→", label: "Implies" },
    { symbol: "↔", label: "If and only if" },

    // Calculus
    { symbol: "∞", label: "Infinity" },
    { symbol: "∂", label: "Partial derivative" },
    { symbol: "∫", label: "Integral" },
    { symbol: "∑", label: "Sum" },
    { symbol: "∏", label: "Product" },
    { symbol: "lim", label: "Limit" },
  ]

  const getButtonColor = (index: number) => {
    const colors = [
      "bg-blue-600 hover:bg-blue-700 text-white shadow-md",
      "bg-red-600 hover:bg-red-700 text-white shadow-md",
      "bg-green-600 hover:bg-green-700 text-white shadow-md",
      "bg-orange-600 hover:bg-orange-700 text-white shadow-md",
      "bg-purple-600 hover:bg-purple-700 text-white shadow-md",
      "bg-teal-600 hover:bg-teal-700 text-white shadow-md",
      "bg-pink-600 hover:bg-pink-700 text-white shadow-md",
      "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md",
      "bg-cyan-600 hover:bg-cyan-700 text-white shadow-md",
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md",
      "bg-yellow-600 hover:bg-yellow-700 text-white shadow-md",
      "bg-lime-600 hover:bg-lime-700 text-white shadow-md",
    ]
    return colors[index % colors.length]
  }

  return (
    <Card
      ref={cardRef}
      className={
        `fixed z-50 overflow-hidden shadow-lg border-2 ` +
        (typeof window !== 'undefined' && window.innerWidth < 640
          ? 'w-full max-w-full max-h-[50vh] bottom-0 left-0 right-0 mx-auto'
          : 'w-96 max-h-96')
      }
      style={{
        left: typeof window !== 'undefined' && window.innerWidth < 640 ? undefined : `${position.x}px`,
        top: typeof window !== 'undefined' && window.innerWidth < 640 ? undefined : `${position.y}px`,
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      <CardHeader
        className="pb-2 cursor-move border-b"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? "grabbing" : "move" }}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Move className="h-4 w-4" />
            Math Keyboard
          </CardTitle>
          <Button onClick={onClose} size="sm" variant="ghost" className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-6 gap-1">
          {mathSymbols.map((item, index) => (
            <Button
              key={index}
              onClick={() => onInsert(item.symbol)}
              className={`h-10 text-sm font-medium ${getButtonColor(index)}`}
              title={item.label}
            >
              {item.symbol}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
