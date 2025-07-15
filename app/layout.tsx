import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ExamProvider } from "@/contexts/exam-context"

export const metadata: Metadata = {
  title: "Nesta Education - AI-Powered Learning Platform",
  description: "AI-powered education platform aligned to BJC & BGCSE Math and Science curriculum",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ExamProvider>
            {children}
          </ExamProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
