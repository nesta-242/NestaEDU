import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { GraduationCap, PenTool, Apple } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container px-4 py-8 mx-auto max-w-4xl flex flex-col items-center justify-center">
        {/* ---------- HERO ---------- */}
        <header className="flex flex-col items-center justify-center text-center w-full mb-16">
          <div className="mb-2 flex items-center justify-center">
            <PenTool className="w-10 h-10 text-primary mx-auto" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight font-handwriting sm:text-5xl md:text-6xl mb-4 text-center">
            Nesta Education <span className="text-amber-500">(Beta)</span>
          </h1>
          <div className="text-lg font-code text-center">
            {/* Mobile: stacked, Desktop: inline */}
            <div className="block sm:hidden">
              <div className="font-bold">Discover. Learn. Progress.</div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-bold">Discover. Learn. Progress.</span>
            </div>
          </div>
        </header>

        {/* ---------- ROLE CARD ---------- */}
        <main className="max-w-md mx-auto w-full flex justify-center mb-16">
          <div className="sketch-card w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-handwriting">Begin Your Journey:</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-6">
              {/* Student Portal */}
              <Link href="/login" className="w-full">
                <div className="sketch-button w-full h-auto p-6 flex items-start gap-4 hover:bg-accent/80 transition-colors">
                  <GraduationCap className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <span className="text-lg font-semibold font-handwriting">Student Portal</span>
                    <p className="text-sm text-muted-foreground font-code mt-2">
                      An AI-powered learning platform built on Socratic teaching principles.
                    </p>
                  </div>
                </div>
              </Link>

              {/* Teacher Portal - Coming Soon */}
              <div className="w-full">
                <div className="sketch-button w-full h-auto p-6 flex items-start gap-4 transition-colors opacity-60 cursor-not-allowed">
                  <Apple className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <span className="text-lg font-semibold font-handwriting">Teacher Portal</span>
                    <p className="text-sm text-muted-foreground font-code mt-2">
                      Coming Soon!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <div className="text-center">
                <p className="text-sm font-code leading-3 text-foreground">
                  Powered by OpenAI GPT-4o.
                </p>
              </div>
            </CardFooter>
          </div>
        </main>

        {/* ---------- BETA DISCLAIMER ---------- */}
        <div className="text-center w-full flex justify-center mb-8">
          <div className="inline-block sketch-border p-4 bg-card/80 rounded-lg max-w-2xl">
            <p className="text-sm font-code text-foreground leading-relaxed">
              <span className="font-bold text-foreground">🚧 Beta Version Disclaimer 🚧</span> <br />
              This platform is currently in beta testing. Features, content, and performance are still being actively developed and improved. Users may occasionally encounter incomplete features, inaccuracies, or unexpected behavior.
            </p>
          </div>
        </div>

        {/* ---------- FOOTER ---------- */}
        <footer className="text-center w-full flex justify-center">
          <div className="inline-block sketch-border p-4 bg-card/80 rounded-lg">
            <p className="font-bold text-foreground">© 2025 Nesta Technologies</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
