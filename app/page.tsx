import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { GraduationCap, PenTool } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container px-4 py-8 mx-auto max-w-4xl">
        {/* ---------- HERO ---------- */}
        <header className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-2 flex items-center justify-center">
            <PenTool className="w-10 h-10 text-primary mx-auto" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-handwriting sm:text-5xl md:text-6xl mb-4">
            Nesta Education
          </h1>
          <div className="mb-4 flex items-center gap-2 text-lg text-muted-foreground font-code">
            <span>✏️ learn through discovery</span>
            <span>•</span>
            <span>practice with precision 📐</span>
          </div>

          <p className="text-base text-muted-foreground font-notebook max-w-2xl">
            An AI-powered education platform aligned to BJC&nbsp;&amp;&nbsp;BGCSE Math and Science curriculum.
          </p>
        </header>

        {/* ---------- ROLE CARD ---------- */}
        <main className="max-w-md mx-auto mt-8">
          <div className="sketch-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-handwriting">Begin Your Journey</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-6">
              {/* Student Portal Only */}
              <Link href="/login" className="w-full">
                <div className="sketch-button w-full h-auto p-6 flex items-start gap-4 hover:bg-accent/80 transition-colors">
                  <GraduationCap className="w-6 h-6 text-primary" />
                  <div>
                    <span className="text-lg font-semibold font-handwriting">Student Portal</span>
                    <p className="text-sm text-muted-foreground font-notebook">
                      Guided AI tutoring with Socratic questioning
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground font-notebook leading-3">
                  Powered by OpenAI GPT-4o.
                </p>
              </div>
            </CardFooter>
          </div>
        </main>

        {/* ---------- FOOTER ---------- */}
        <footer className="mt-12 text-center">
          <div className="inline-block sketch-border p-4">
            <p className="text-sm font-code text-muted-foreground">© 2025 Nesta Technologies</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
