interface LatexRendererProps {
  content: string
}

export function LatexRenderer({ content }: LatexRendererProps) {
  // Simple renderer that handles basic math notation without LaTeX
  const renderMath = (text: string) => {
    // Replace common math patterns with readable text
    const html = text
      .replace(/\^(\d+)/g, "<sup>$1</sup>") // Superscripts
      .replace(/_(\d+)/g, "<sub>$1</sub>") // Subscripts
      .replace(/sqrt$$([^)]+)$$/g, "√($1)") // Square roots
      .replace(/\*\*/g, "^") // Convert ** to ^
      .replace(/\\\\/g, "<br>") // Line breaks

    return html
  }

  return <div className="math-content" dangerouslySetInnerHTML={{ __html: renderMath(content) }} />
}

export default LatexRenderer
