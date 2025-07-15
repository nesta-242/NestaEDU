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
          const parsedProfile = JSON.parse(profile)
          setUserProfile(parsedProfile)
        }
      } catch (error) {
        console.error("Failed to load user profile from localStorage", error)
      }
    }

    loadUserData()

    // Listen for profile updates
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      console.log('Profile update event received in header:', customEvent.detail)
      
      // Force a state update to trigger re-render
      setUserProfile(null)
      setTimeout(() => {
        setUserProfile(customEvent.detail)
      }, 10)
    }

    window.addEventListener("profileUpdated", handleProfileUpdate)

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate)
    }
  }, [])

  // Debug effect to monitor userProfile changes
  useEffect(() => {
    console.log('Header userProfile state changed:', userProfile)
    console.log('Header avatar in userProfile:', userProfile?.avatar)
    console.log('Header avatar type:', typeof userProfile?.avatar)
    console.log('Header avatar length:', userProfile?.avatar?.length)
  }, [userProfile])

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
            <Avatar className="h-8 w-8" key={`header-avatar-${userProfile?.avatar ? userProfile.avatar.substring(0, 50) : 'no-avatar'}`}>
              <AvatarImage
                src={userProfile?.avatar}
                alt={getUserName()}
                onError={(e) => {
                  console.log('Header avatar image failed to load:', userProfile?.avatar)
                  e.currentTarget.style.display = 'none'
                }}
                onLoad={() => {
                  console.log('Header avatar image loaded successfully')
                }}
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
