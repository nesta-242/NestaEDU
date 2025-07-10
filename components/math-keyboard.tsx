"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Move, Smartphone } from "lucide-react"

interface MathKeyboardProps {
  onInsert: (symbol: string) => void
  onClose: () => void
  currentText?: string
  onTextChange?: (text: string) => void
}

export function MathKeyboard({ onInsert, onClose, currentText = "", onTextChange }: MathKeyboardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 50, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const [inputText, setInputText] = useState(currentText)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update input text when currentText prop changes
  useEffect(() => {
    setInputText(currentText)
  }, [currentText])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return // Disable dragging on mobile
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
      if (isDragging && cardRef.current && !isMobile) {
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

    if (isDragging && !isMobile) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, dragOffset, isMobile])

  const handleSymbolClick = (symbol: string) => {
    const newText = inputText + symbol
    setInputText(newText)
    onInsert(symbol)
    if (onTextChange) {
      onTextChange(newText)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setInputText(newText)
    if (onTextChange) {
      onTextChange(newText)
    }
  }

  const handleBackspace = () => {
    const newText = inputText.slice(0, -1)
    setInputText(newText)
    if (onTextChange) {
      onTextChange(newText)
    }
  }

  const handleClear = () => {
    setInputText("")
    if (onTextChange) {
      onTextChange("")
    }
  }

  // Most commonly used math symbols for mobile
  const mobileSymbols = [
    { symbol: "+", label: "Plus" },
    { symbol: "−", label: "Minus" },
    { symbol: "×", label: "Multiply" },
    { symbol: "÷", label: "Divide" },
    { symbol: "=", label: "Equals" },
    { symbol: "√", label: "Square root" },
    { symbol: "²", label: "Squared" },
    { symbol: "π", label: "Pi" },
    { symbol: "θ", label: "Theta" },
    { symbol: "α", label: "Alpha" },
    { symbol: "β", label: "Beta" },
    { symbol: "≤", label: "Less than or equal" },
    { symbol: "≥", label: "Greater than or equal" },
    { symbol: "≠", label: "Not equal" },
    { symbol: "≈", label: "Approximately equal" },
    { symbol: "∞", label: "Infinity" },
    { symbol: "∫", label: "Integral" },
    { symbol: "∑", label: "Sum" },
    { symbol: "∏", label: "Product" },
    { symbol: "∂", label: "Partial derivative" },
  ]

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

  // Mobile centered modal with text input
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-background w-full max-w-sm max-h-[60vh] rounded-lg flex flex-col shadow-lg p-2">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <h2 className="text-base font-semibold">Math Keyboard</h2>
            </div>
            <Button onClick={onClose} size="sm" variant="ghost" className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Text Input Area */}
          <div className="p-2 border-b">
            <div className="flex gap-1">
              <textarea
                value={inputText}
                onChange={handleTextChange}
                placeholder="Type or click symbols..."
                className="flex-1 p-1 border rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
              <div className="flex flex-col gap-1">
                <Button
                  onClick={handleBackspace}
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 text-xs"
                >
                  ←
                </Button>
                <Button
                  onClick={handleClear}
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 text-xs"
                >
                  C
                </Button>
              </div>
            </div>
          </div>

          {/* Symbols */}
          <div className="flex-1 p-2 overflow-y-auto">
            <div className="grid grid-cols-5 gap-1">
              {mobileSymbols.map((item, index) => (
                <Button
                  key={index}
                  onClick={() => handleSymbolClick(item.symbol)}
                  className={`h-8 text-xs font-medium ${getButtonColor(index)}`}
                  title={item.label}
                >
                  {item.symbol}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Desktop draggable card
  return (
    <Card
      ref={cardRef}
      className="fixed z-50 overflow-hidden shadow-lg border-2 w-96 max-h-96"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
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
