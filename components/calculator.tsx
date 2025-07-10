"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Move, Smartphone } from "lucide-react"

interface CalculatorProps {
  onClose: () => void
  onFocusChange?: (hasFocus: boolean) => void
}

export function Calculator({ onClose, onFocusChange }: CalculatorProps) {
  const [display, setDisplay] = useState("0")
  const [inputExpression, setInputExpression] = useState("")
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [memory, setMemory] = useState(0)
  const [highlightedButton, setHighlightedButton] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isActive, setIsActive] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events if calculator is active
      if (!isActive) return

      // Prevent default behavior for calculator keys
      if (e.key.match(/[0-9+\-*/.=EnterBackspaceDelete]/)) {
        e.preventDefault()
      }

      // Number keys (0-9)
      if (e.key.match(/[0-9]/)) {
        inputNumber(e.key)
      }
      // Decimal point
      else if (e.key === ".") {
        if (!display.includes(".")) {
          inputNumber(".")
        }
      }
      // Operators
      else if (e.key === "+") {
        setHighlightedButton("+")
        inputOperation("+")
        setTimeout(() => setHighlightedButton(null), 150)
      } else if (e.key === "-") {
        setHighlightedButton("-")
        inputOperation("-")
        setTimeout(() => setHighlightedButton(null), 150)
      } else if (e.key === "*") {
        setHighlightedButton("×")
        inputOperation("×")
        setTimeout(() => setHighlightedButton(null), 150)
      } else if (e.key === "/") {
        setHighlightedButton("÷")
        inputOperation("÷")
        setTimeout(() => setHighlightedButton(null), 150)
      }
      // Equals and Enter
      else if (e.key === "=" || e.key === "Enter") {
        setHighlightedButton("=")
        performCalculation()
        setTimeout(() => setHighlightedButton(null), 150)
      }
      // Clear (Escape)
      else if (e.key === "Escape") {
        setHighlightedButton("C")
        clear()
        setTimeout(() => setHighlightedButton(null), 150)
      }
      // Backspace
      else if (e.key === "Backspace") {
        if (display.length > 1) {
          setDisplay(display.slice(0, -1))
        } else {
          setDisplay("0")
        }
      }
      // Delete
      else if (e.key === "Delete") {
        setHighlightedButton("CE")
        clearEntry()
        setTimeout(() => setHighlightedButton(null), 150)
      }
    }

    // Add event listener
    document.addEventListener("keydown", handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [display, waitingForOperand, previousValue, operation, isActive])

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num)
      setWaitingForOperand(false)
      setInputExpression(inputExpression + num)
    } else {
      setDisplay(display === "0" ? num : display + num)
      setInputExpression(inputExpression === "0" ? num : inputExpression + num)
    }
  }

  const inputOperation = (nextOperation: string) => {
    const inputValue = Number.parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)

      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
    setInputExpression(inputExpression + " " + nextOperation + " ")
  }

  const calculate = (firstValue: number, secondValue: number, op: string) => {
    switch (op) {
      case "+":
        return firstValue + secondValue
      case "-":
        return firstValue - secondValue
      case "×":
        return firstValue * secondValue
      case "÷":
        return firstValue / secondValue
      case "=":
        return secondValue
      default:
        return secondValue
    }
  }

  const performCalculation = () => {
    const inputValue = Number.parseFloat(display)

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation)
      setDisplay(String(newValue))
      setPreviousValue(null)
      setOperation(null)
      setWaitingForOperand(true)
      setInputExpression("")
    }
  }

  const clear = () => {
    setDisplay("0")
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
    setInputExpression("")
  }

  const clearEntry = () => {
    setDisplay("0")
    setWaitingForOperand(false)
    // Remove last entry from inputExpression
    setInputExpression((prev) => prev.replace(/\s*\S+$/, ""))
  }

  const inputFunction = (func: string) => {
    const inputValue = Number.parseFloat(display)
    let result: number

    try {
      switch (func) {
        case "sin":
          result = Math.sin((inputValue * Math.PI) / 180)
          break
        case "cos":
          result = Math.cos((inputValue * Math.PI) / 180)
          break
        case "tan":
          result = Math.tan((inputValue * Math.PI) / 180)
          break
        case "asin":
          result = Math.asin(inputValue) * (180 / Math.PI)
          break
        case "acos":
          result = Math.acos(inputValue) * (180 / Math.PI)
          break
        case "atan":
          result = Math.atan(inputValue) * (180 / Math.PI)
          break
        case "log":
          result = Math.log10(inputValue)
          break
        case "ln":
          result = Math.log(inputValue)
          break
        case "√":
          result = Math.sqrt(inputValue)
          break
        case "x²":
          result = inputValue * inputValue
          break
        case "1/x":
          result = 1 / inputValue
          break
        case "π":
          result = Math.PI
          break
        case "e":
          result = Math.E
          break
        default:
          return
      }
      setDisplay(String(Number.isNaN(result) ? "Error" : result))
    } catch {
      setDisplay("Error")
    }
    setWaitingForOperand(true)
  }

  const memoryStore = () => setMemory(Number.parseFloat(display))
  const memoryRecall = () => {
    setDisplay(String(memory))
    setWaitingForOperand(false)
  }
  const memoryClear = () => setMemory(0)
  const memoryAdd = () => setMemory(memory + Number.parseFloat(display))
  const memorySubtract = () => setMemory(memory - Number.parseFloat(display))

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsActive(false)
        onFocusChange?.(false)
      }
    }

    // Add click outside listener
    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onFocusChange])

  // Focus management - notify parent when calculator is interacted with
  const handleCalculatorInteraction = () => {
    setIsActive(true)
    onFocusChange?.(true)
  }

  const handleClose = () => {
    setIsActive(false)
    onFocusChange?.(false)
    onClose()
  }

  // Simplified button layout for mobile
  const mobileButtons = [
    [
      { text: "C", action: clear, color: "bg-red-600 hover:bg-red-700 text-white shadow-md" },
      { text: "CE", action: clearEntry, color: "bg-red-600 hover:bg-red-700 text-white shadow-md" },
      { text: "√", action: () => inputFunction("√"), color: "bg-lime-600 hover:bg-lime-700 text-white shadow-md" },
      { text: "x²", action: () => inputFunction("x²"), color: "bg-green-600 hover:bg-green-700 text-white shadow-md" },
      { text: "π", action: () => inputFunction("π"), color: "bg-orange-600 hover:bg-orange-700 text-white shadow-md" },
    ],
    [
      { text: "7", action: () => inputNumber("7"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "8", action: () => inputNumber("8"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "9", action: () => inputNumber("9"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "÷", action: () => inputOperation("÷"), color: "bg-amber-600 hover:bg-amber-700 text-white shadow-md" },
      { text: "×", action: () => inputOperation("×"), color: "bg-amber-600 hover:bg-amber-700 text-white shadow-md" },
    ],
    [
      { text: "4", action: () => inputNumber("4"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "5", action: () => inputNumber("5"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "6", action: () => inputNumber("6"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "-", action: () => inputOperation("-"), color: "bg-amber-600 hover:bg-amber-700 text-white shadow-md" },
      { text: "+", action: () => inputOperation("+"), color: "bg-amber-600 hover:bg-amber-700 text-white shadow-md" },
    ],
    [
      { text: "1", action: () => inputNumber("1"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "2", action: () => inputNumber("2"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "3", action: () => inputNumber("3"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "0", action: () => inputNumber("0"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "=", action: performCalculation, color: "bg-blue-600 hover:bg-blue-700 text-white shadow-md" },
    ],
  ]

  // Always show all scientific buttons on mobile and desktop
  const buttons = [
    [
      { text: "MC", action: memoryClear, color: "bg-purple-600 hover:bg-purple-700 text-white shadow-md" },
      { text: "MR", action: memoryRecall, color: "bg-purple-600 hover:bg-purple-700 text-white shadow-md" },
      { text: "M+", action: memoryAdd, color: "bg-purple-600 hover:bg-purple-700 text-white shadow-md" },
      { text: "M-", action: memorySubtract, color: "bg-purple-600 hover:bg-purple-700 text-white shadow-md" },
      { text: "MS", action: memoryStore, color: "bg-purple-600 hover:bg-purple-700 text-white shadow-md" },
    ],
    [
      { text: "sin", action: () => inputFunction("sin"), color: "bg-blue-600 hover:bg-blue-700 text-white shadow-md" },
      { text: "cos", action: () => inputFunction("cos"), color: "bg-blue-600 hover:bg-blue-700 text-white shadow-md" },
      { text: "tan", action: () => inputFunction("tan"), color: "bg-blue-600 hover:bg-blue-700 text-white shadow-md" },
      { text: "C", action: clear, color: "bg-red-600 hover:bg-red-700 text-white shadow-md" },
      { text: "CE", action: clearEntry, color: "bg-red-600 hover:bg-red-700 text-white shadow-md" },
    ],
    [
      { text: "asin", action: () => inputFunction("asin"), color: "bg-teal-600 hover:bg-teal-700 text-white shadow-md" },
      { text: "acos", action: () => inputFunction("acos"), color: "bg-teal-600 hover:bg-teal-700 text-white shadow-md" },
      { text: "atan", action: () => inputFunction("atan"), color: "bg-teal-600 hover:bg-teal-700 text-white shadow-md" },
      { text: "log", action: () => inputFunction("log"), color: "bg-cyan-600 hover:bg-cyan-700 text-white shadow-md" },
      { text: "ln", action: () => inputFunction("ln"), color: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" },
    ],
    [
      { text: "x²", action: () => inputFunction("x²"), color: "bg-green-600 hover:bg-green-700 text-white shadow-md" },
      { text: "√", action: () => inputFunction("√"), color: "bg-lime-600 hover:bg-lime-700 text-white shadow-md" },
      { text: "1/x", action: () => inputFunction("1/x"), color: "bg-green-600 hover:bg-green-700 text-white shadow-md" },
      { text: "π", action: () => inputFunction("π"), color: "bg-orange-600 hover:bg-orange-700 text-white shadow-md" },
      { text: "e", action: () => inputFunction("e"), color: "bg-orange-600 hover:bg-orange-700 text-white shadow-md" },
    ],
    [
      { text: "7", action: () => inputNumber("7"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "8", action: () => inputNumber("8"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "9", action: () => inputNumber("9"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "÷", action: () => inputOperation("÷"), color: "bg-amber-600 hover:bg-amber-700 text-white shadow-md" },
      { text: "×", action: () => inputOperation("×"), color: "bg-amber-600 hover:bg-amber-700 text-white shadow-md" },
    ],
    [
      { text: "4", action: () => inputNumber("4"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "5", action: () => inputNumber("5"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "6", action: () => inputNumber("6"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "-", action: () => inputOperation("-"), color: "bg-amber-600 hover:bg-amber-700 text-white shadow-md" },
      { text: "+", action: () => inputOperation("+"), color: "bg-amber-600 hover:bg-amber-700 text-white shadow-md" },
    ],
    [
      { text: "1", action: () => inputNumber("1"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "2", action: () => inputNumber("2"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "3", action: () => inputNumber("3"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "0", action: () => inputNumber("0"), color: "bg-slate-700 hover:bg-slate-800 text-white shadow-md" },
      { text: "=", action: performCalculation, color: "bg-blue-600 hover:bg-blue-700 text-white shadow-md" },
    ],
  ]

  // Mobile centered modal
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-background w-full max-w-sm max-h-[85vh] rounded-lg flex flex-col shadow-lg p-2">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <h2 className="text-base font-semibold">Calculator</h2>
            </div>
            <Button onClick={handleClose} size="sm" variant="ghost" className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Display */}
          <div className="p-2">
            <div 
              className="p-2 bg-slate-800 text-white rounded text-xs font-mono border overflow-x-auto cursor-text min-h-[18px]"
              onClick={handleCalculatorInteraction}
            >
              {inputExpression}
            </div>
            <div 
              className="p-2 bg-slate-900 text-white rounded text-base font-mono border overflow-x-auto cursor-text min-h-[28px] mt-1"
              onClick={handleCalculatorInteraction}
            >
              {display}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex-1 p-2 overflow-y-auto">
            <div className="space-y-1">
              {buttons.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-5 gap-1">
                  {row.map((button, buttonIndex) => (
                    <Button
                      key={buttonIndex}
                      onClick={button.action}
                      className={`h-10 text-xs font-medium ${button.color} ${
                        highlightedButton === button.text 
                          ? 'ring-2 ring-white ring-opacity-75 scale-95' 
                          : ''
                      }`}
                    >
                      {button.text}
                    </Button>
                  ))}
                </div>
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
      className="fixed z-50 shadow-lg border-2 w-80"
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
            Scientific Calculator
          </CardTitle>
          <Button onClick={handleClose} size="sm" variant="ghost" className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div 
          className="mb-3 p-3 bg-slate-800 text-white rounded text-right text-lg font-mono border overflow-x-auto cursor-text"
          onClick={handleCalculatorInteraction}
        >
          {display}
        </div>
        <div className="space-y-1">
          {buttons.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-1">
              {row.map((button, buttonIndex) => (
                <Button
                  key={buttonIndex}
                  onClick={button.action}
                  className={`h-10 text-sm font-medium ${button.color} ${
                    highlightedButton === button.text 
                      ? 'ring-2 ring-white ring-opacity-75 scale-95' 
                      : ''
                  }`}
                >
                  {button.text}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
