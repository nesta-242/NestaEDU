"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, BookOpen, MessageSquare, User, FileText } from "lucide-react"
import { ExamSafeLink } from "@/components/exam-safe-link"

export function MobileBottomNav() {
  const pathname = usePathname()

  const navigation = [
    {
      name: "Dashboard",
      href: "/student/dashboard",
      icon: Home,
      current: pathname === "/student/dashboard",
    },
    {
      name: "AI Tutor",
      href: "/student/tutor",
      icon: MessageSquare,
      current: pathname === "/student/tutor",
    },
    {
      name: "Sessions",
      href: "/student/subjects",
      icon: BookOpen,
      current: pathname === "/student/subjects",
    },
    {
      name: "Exams",
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
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-background border-t border-border">
        <div className="flex items-center justify-around px-2 py-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <ExamSafeLink
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1"
              >
                <div
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-12 rounded-lg transition-colors",
                    item.current
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium truncate">{item.name}</span>
                </div>
              </ExamSafeLink>
            )
          })}
        </div>
      </div>
    </div>
  )
} 