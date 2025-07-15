"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MobileNav } from "@/components/mobile-nav"
import { ExamSafeLink } from "@/components/exam-safe-link"
import { getAvatarUrl, getAvatarKey, forceAvatarRefresh } from "@/lib/utils"

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
          const parsedProfile = JSON.parse(profile)
          setUserProfile(parsedProfile)
        }
      } catch (error) {
        console.error("Failed to load user profile from localStorage", error)
      }
    }

    loadUserData()

    // Force refresh avatar images after loading profile
    forceAvatarRefresh()

    // Listen for storage changes to update avatar in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userProfile") {
        loadUserData()
      }
    }

    // Also listen for custom events when localStorage is updated from the same tab
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      console.log('Profile update event received in header:', customEvent.detail)
      setUserProfile(customEvent.detail)
      // Force avatar refresh to ensure immediate visual update
      forceAvatarRefresh()
    }

    // Listen for avatar refresh events
    const handleAvatarRefresh = (e: Event) => {
      console.log('Avatar refresh event received in header, forcing re-render')
      // Force a re-render by updating the state with a new object
      setUserProfile((prev: any) => {
        const newProfile = { ...prev }
        // Add a timestamp to force React to see it as a new object
        newProfile._lastUpdate = Date.now()
        return newProfile
      })
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("profileUpdated", handleProfileUpdate)
    window.addEventListener("avatarRefresh", handleAvatarRefresh)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("profileUpdated", handleProfileUpdate)
      window.removeEventListener("avatarRefresh", handleAvatarRefresh)
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
            <Avatar 
              className="h-8 w-8" 
              key={`header-avatar-${userProfile?.avatar?.substring(0, 50) || 'no-avatar'}-${userProfile?._lastUpdate || Date.now()}`}
              data-avatar-key={`header-avatar-${userProfile?.avatar?.substring(0, 50) || 'no-avatar'}`}
            >
              <AvatarImage
                src={getAvatarUrl(userProfile?.avatar)}
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
