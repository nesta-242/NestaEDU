"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Move } from "lucide-react"

interface CalculatorProps {
  onClose: () => void
}

export function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState("0")
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [memory, setMemory] = useState(0)

  const cardRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: 100 })
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

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === "0" ? num : display + num)
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
    }
  }

  const clear = () => {
    setDisplay("0")
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const clearEntry = () => {
    setDisplay("0")
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
      {
        text: "asin",
        action: () => inputFunction("asin"),
        color: "bg-teal-600 hover:bg-teal-700 text-white shadow-md",
      },
      {
        text: "acos",
        action: () => inputFunction("acos"),
        color: "bg-teal-600 hover:bg-teal-700 text-white shadow-md",
      },
      {
        text: "atan",
        action: () => inputFunction("atan"),
        color: "bg-teal-600 hover:bg-teal-700 text-white shadow-md",
      },
      { text: "log", action: () => inputFunction("log"), color: "bg-cyan-600 hover:bg-cyan-700 text-white shadow-md" },
      {
        text: "ln",
        action: () => inputFunction("ln"),
        color: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md",
      },
    ],
    [
      { text: "x²", action: () => inputFunction("x²"), color: "bg-green-600 hover:bg-green-700 text-white shadow-md" },
      { text: "√", action: () => inputFunction("√"), color: "bg-lime-600 hover:bg-lime-700 text-white shadow-md" },
      {
        text: "1/x",
        action: () => inputFunction("1/x"),
        color: "bg-green-600 hover:bg-green-700 text-white shadow-md",
      },
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

  return (
    <Card
      ref={cardRef}
      className={
        `fixed z-50 shadow-lg border-2 ` +
        (typeof window !== 'undefined' && window.innerWidth < 640
          ? 'w-full max-w-full max-h-[50vh] bottom-0 left-0 right-0 mx-auto'
          : 'w-80')
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
            Scientific Calculator
          </CardTitle>
          <Button onClick={onClose} size="sm" variant="ghost" className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="mb-3 p-3 bg-slate-800 text-white rounded text-right text-lg font-mono border overflow-x-auto">
          {display}
        </div>
        <div className="space-y-1">
          {buttons.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-1">
              {row.map((button, buttonIndex) => (
                <Button
                  key={buttonIndex}
                  onClick={button.action}
                  className={`h-10 text-sm font-medium ${button.color}`}
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
