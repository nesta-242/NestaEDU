"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen, Home, MessageSquare, LogOut, Menu, PenTool, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { ExamSafeLink } from "@/components/exam-safe-link"

interface DesktopNavProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function DesktopNav({ isCollapsed, onToggle }: DesktopNavProps) {
  const pathname = usePathname()

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("userRole")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userProfile")
    localStorage.removeItem("userName")
    localStorage.removeItem("userAvatar")
    
    // Clear user-specific data (these are now stored in database, but clear any cached data)
    localStorage.removeItem("chatHistory")
    localStorage.removeItem("examResults")
    localStorage.removeItem("sidebarCollapsed")

    // Redirect to home page
    window.location.href = "/"
  }

  const studentLinks = [
    { href: "/student/dashboard", label: "Dashboard", icon: Home },
    { href: "/student/tutor", label: "Personalized AI Tutor", icon: MessageSquare },
    { href: "/student/subjects", label: "Past Sessions", icon: BookOpen },
    { href: "/student/practice-exam", label: "Practice Exams", icon: FileText },
  ]

  return (
    <div
      className={cn(
        "hidden md:flex h-screen flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("p-6 border-b", isCollapsed && "p-4")}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <ExamSafeLink href="/student/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <PenTool className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Nesta Education</h2>
            </ExamSafeLink>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8" title="Collapse sidebar">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <ExamSafeLink href="/student/dashboard" className="block hover:opacity-80 transition-opacity">
              <PenTool className="w-8 h-8 text-primary" />
            </ExamSafeLink>
            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8" title="Expand sidebar">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-4">
        <ul className="grid gap-1">
          {studentLinks.map((link) => {
            const Icon = link.icon
            // Use startsWith for broader matching, but exact match for dashboard
            const isActive =
              link.href === "/student/dashboard" ? pathname === link.href : pathname.startsWith(link.href)

            return (
              <li key={link.href}>
                <ExamSafeLink href={link.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full nav-item",
                      isActive && "active",
                      isCollapsed ? "justify-center px-2" : "justify-start",
                    )}
                    title={isCollapsed ? link.label : undefined}
                  >
                    <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                    {!isCollapsed && link.label}
                  </Button>
                </ExamSafeLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20",
            isCollapsed ? "justify-center px-2" : "justify-start",
          )}
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  )
}
