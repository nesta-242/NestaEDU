"use client"

import { useMemo } from "react"

interface MathRendererProps {
  content: string
}

export function MathRenderer({ content }: MathRendererProps) {
  const processedContent = useMemo(() => {
    if (!content) return ""

    // Simple LaTeX-to-Unicode conversion for common math symbols
    const mathReplacements: Record<string, string> = {
      "\\alpha": "α",
      "\\beta": "β",
      "\\gamma": "γ",
      "\\delta": "δ",
      "\\epsilon": "ε",
      "\\theta": "θ",
      "\\lambda": "λ",
      "\\mu": "μ",
      "\\pi": "π",
      "\\rho": "ρ",
      "\\sigma": "σ",
      "\\tau": "τ",
      "\\phi": "φ",
      "\\chi": "χ",
      "\\psi": "ψ",
      "\\omega": "ω",
      "\\pm": "±",
      "\\infty": "∞",
      "\\leq": "≤",
      "\\geq": "≥",
      "\\neq": "≠",
      "\\approx": "≈",
      "\\sum": "∑",
      "\\prod": "∏",
      "\\int": "∫",
      "\\partial": "∂",
      "\\sqrt": "√",
      "\\sin": "sin",
      "\\cos": "cos",
      "\\tan": "tan",
      "\\log": "log",
      "\\ln": "ln",
      "\\lim": "lim",
      "\\max": "max",
      "\\min": "min",
    }

    let processed = content

    // Replace LaTeX symbols with Unicode equivalents
    Object.entries(mathReplacements).forEach(([latex, unicode]) => {
      const regex = new RegExp(latex.replace("\\", "\\\\"), "g")
      processed = processed.replace(regex, unicode)
    })

    // Handle simple superscripts (x^2 -> x²)
    processed = processed.replace(/\^2/g, "²")
    processed = processed.replace(/\^3/g, "³")
    processed = processed.replace(/\^1/g, "¹")

    // Handle simple subscripts (H_2O -> H₂O)
    processed = processed.replace(/_(\d)/g, (match, digit) => {
      const subscripts = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"]
      return subscripts[Number.parseInt(digit)] || match
    })

    // Handle fractions in a simple way (1/2 -> ½)
    processed = processed.replace(/1\/2/g, "½")
    processed = processed.replace(/1\/3/g, "⅓")
    processed = processed.replace(/2\/3/g, "⅔")
    processed = processed.replace(/1\/4/g, "¼")
    processed = processed.replace(/3\/4/g, "¾")

    return processed
  }, [content])

  return <div className="text-sm whitespace-pre-wrap font-mono">{processedContent}</div>
}
