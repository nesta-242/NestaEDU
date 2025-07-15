"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Menu, Home, BookOpen, MessageSquare, User, FileText, Settings, LogOut, PenTool } from "lucide-react"
import { ExamSafeLink } from "@/components/exam-safe-link"

// Preload function for chat sessions
const preloadChatSessions = () => {
  // Only preload if we don't have recent cache
  const cacheTimestamp = sessionStorage.getItem('chatHistoryCacheTimestamp')
  if (!cacheTimestamp || Date.now() - parseInt(cacheTimestamp) > 5 * 60 * 1000) {
    fetch('/api/chat-sessions')
      .then(response => response.json())
      .then(sessions => {
        const chatHistory = sessions.map((session: any) => ({
          id: session.id,
          subject: session.subject,
          topic: session.topic || '',
          title: session.title || 'Conversation',
          lastMessage: session.last_message || '',
          timestamp: new Date(session.updated_at),
          messageCount: session.message_count || 0,
        }))
        sessionStorage.setItem('chatHistoryCache', JSON.stringify(chatHistory))
        sessionStorage.setItem('chatHistoryCacheTimestamp', Date.now().toString())
      })
      .catch(error => {
        console.error('Preload failed:', error)
      })
  }
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    {
      name: "Dashboard",
      href: "/student/dashboard",
      icon: Home,
      current: pathname === "/student/dashboard",
    },
    {
      name: "Personalized AI Tutor",
      href: "/student/tutor",
      icon: MessageSquare,
      current: pathname === "/student/tutor",
    },
    {
      name: "Past Sessions",
      href: "/student/subjects",
      icon: BookOpen,
      current: pathname === "/student/subjects",
    },
    {
      name: "Practice Exam",
      href: "/student/practice-exam",
      icon: FileText,
      current: pathname.startsWith("/student/practice-exam"),
    },
    {
      name: "Profile",
      href: "/student/profile",
      icon: User,
      current: pathname === "/student/profile",
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 px-2 py-4">
            <ExamSafeLink href="/student/dashboard" className="flex items-center gap-2">
              <PenTool className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Nesta Education</span>
            </ExamSafeLink>
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <ExamSafeLink key={item.name} href={item.href} onClick={() => setOpen(false)}>
                    <Button 
                      variant={item.current ? "secondary" : "ghost"} 
                      className="w-full justify-start gap-3 h-10"
                      onMouseEnter={() => {
                        // Preload chat sessions when hovering over Past Sessions
                        if (item.href === "/student/subjects") {
                          preloadChatSessions()
                        }
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </ExamSafeLink>
                )
              })}
            </div>
          </nav>

          <Separator />

          {/* Footer */}
          <div className="p-4 space-y-2">
            <ExamSafeLink href="/student/profile" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-10">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </ExamSafeLink>
            <ExamSafeLink href="/login" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-3 h-10 text-red-600 hover:text-red-600">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </ExamSafeLink>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
