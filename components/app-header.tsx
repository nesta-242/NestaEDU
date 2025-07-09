"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MobileNav } from "@/components/mobile-nav"
import { ExamSafeLink } from "@/components/exam-safe-link"

interface AppHeaderProps {
  title?: string
}

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    // Load user data from localStorage
    const loadUserData = () => {
      try {
        const profile = localStorage.getItem("userProfile")
        if (profile) {
          setUserProfile(JSON.parse(profile))
        }
      } catch (error) {
        console.error("Failed to load user profile from localStorage", error)
      }
    }

    loadUserData()

    // Listen for storage changes to update avatar in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userProfile") {
        loadUserData()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also listen for custom events when localStorage is updated from the same tab
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      setUserProfile(customEvent.detail)
    }

    window.addEventListener("profileUpdated", handleProfileUpdate)

    // Check for updates periodically (fallback)
    const interval = setInterval(loadUserData, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("profileUpdated", handleProfileUpdate)
      clearInterval(interval)
    }
  }, [])



  const getInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase()
    }
    return "S"
  }

  const getUserName = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`
    }
    return "Student"
  }

  return (
    <header className="flex h-16 w-full items-center border-b bg-background px-4">
      <div className="flex items-center gap-2 md:gap-4">
        <MobileNav />
        <h1 className="text-lg font-semibold md:text-xl">{title || "Student Portal"}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ExamSafeLink href="/student/profile">
          <Button variant="ghost" size="icon" className="rounded-full p-1">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={userProfile?.avatar || ""}
                alt={getUserName()}
              />
              <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Profile</span>
          </Button>
        </ExamSafeLink>
      </div>
    </header>
  )
}
