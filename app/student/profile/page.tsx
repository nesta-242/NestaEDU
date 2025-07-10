"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { Camera, X, Sun, Moon, Monitor, User, Mail, Phone, GraduationCap, Loader2 } from "lucide-react"

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  gradeLevel: string
  school: string
  avatar?: string
}

const gradeOptions = [
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gradeLevel: "",
    school: "",
  })
  const [originalProfile, setOriginalProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gradeLevel: "",
    school: "",
  })
  const [originalAvatar, setOriginalAvatar] = useState<string>("")
  const [originalTheme, setOriginalTheme] = useState<string>("system")
  const [hasThemeChanged, setHasThemeChanged] = useState(false)
  const saveSuccessfulRef = useRef(false)
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  // Load profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const user = await res.json()
          
          // Ensure all fields are strings, not null
          const sanitizedUser = {
            ...user,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            gradeLevel: user.gradeLevel || "",
            school: user.school || "",
            avatar: user.avatar || ""
          }
          
          setProfile(sanitizedUser)
          setOriginalProfile(sanitizedUser)
          localStorage.setItem('userProfile', JSON.stringify(sanitizedUser))
          if (sanitizedUser.avatar) {
            setAvatarPreview(sanitizedUser.avatar)
            setOriginalAvatar(sanitizedUser.avatar)
          }
        } else {
          // fallback to localStorage if API fails
          const savedProfile = localStorage.getItem('userProfile')
          if (savedProfile) {
            const parsedProfile = JSON.parse(savedProfile)
            
            // Ensure all fields are strings, not null
            const sanitizedProfile = {
              ...parsedProfile,
              firstName: parsedProfile.firstName || "",
              lastName: parsedProfile.lastName || "",
              email: parsedProfile.email || "",
              phone: parsedProfile.phone || "",
              gradeLevel: parsedProfile.gradeLevel || "",
              school: parsedProfile.school || "",
              avatar: parsedProfile.avatar || ""
            }
            
            setProfile(sanitizedProfile)
            setOriginalProfile(sanitizedProfile)
            if (sanitizedProfile.avatar) {
              setAvatarPreview(sanitizedProfile.avatar)
              setOriginalAvatar(sanitizedProfile.avatar)
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        // fallback to localStorage if fetch fails
        const savedProfile = localStorage.getItem('userProfile')
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile)
          
          // Ensure all fields are strings, not null
          const sanitizedProfile = {
            ...parsedProfile,
            firstName: parsedProfile.firstName || "",
            lastName: parsedProfile.lastName || "",
            email: parsedProfile.email || "",
            phone: parsedProfile.phone || "",
            gradeLevel: parsedProfile.gradeLevel || "",
            school: parsedProfile.school || "",
            avatar: parsedProfile.avatar || ""
          }
          
          setProfile(sanitizedProfile)
          if (sanitizedProfile.avatar) {
            setAvatarPreview(sanitizedProfile.avatar)
          }
        }
      }
    }
    fetchProfile()
  }, [])

  // Initialize theme state when theme is available
  useEffect(() => {
    if (theme && !originalTheme) {
      setOriginalTheme(theme)
    }
  }, [theme, originalTheme])

  // Cleanup effect to revert theme if user navigates away without saving
  useEffect(() => {
    return () => {
      // If there are unsaved theme changes and save wasn't successful, revert to original theme
      if (hasThemeChanged && !saveSuccessfulRef.current) {
        setTheme(originalTheme)
      }
    }
  }, [hasThemeChanged, originalTheme, setTheme, theme])

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    setHasThemeChanged(true)
  }

  // Check if any changes have been made
  const hasChanges = (): boolean => {
    // Check if any profile fields have changed
    const profileChanged = 
      profile.firstName !== originalProfile.firstName ||
      profile.lastName !== originalProfile.lastName ||
      profile.email !== originalProfile.email ||
      profile.phone !== originalProfile.phone ||
      profile.gradeLevel !== originalProfile.gradeLevel ||
      profile.school !== originalProfile.school

    // Check if avatar has changed
    const avatarChanged = avatarPreview !== originalAvatar

    // Check if theme has changed
    const themeChanged = hasThemeChanged

    return profileChanged || avatarChanged || themeChanged
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Set canvas size (max 200x200 for avatar)
        const maxSize = 200
        let { width, height } = img
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8) // 80% quality
        resolve(compressedDataUrl)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, GIF)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setAvatarFile(file)

      try {
        // Compress and create preview
        const compressedDataUrl = await compressImage(file)
        setAvatarPreview(compressedDataUrl)
        
        // Show success message
        toast({
          title: "Image uploaded",
          description: "Your profile picture has been updated. Click 'Save Changes' to keep it.",
        })
      } catch (error) {
        console.error('Error compressing image:', error)
        toast({
          title: "Error",
          description: "Failed to process image. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview("")
    setProfile((prev) => ({
      ...prev,
      avatar: undefined,
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: boolean } = {}
    if (!profile.firstName.trim()) newErrors.firstName = true
    if (!profile.lastName.trim()) newErrors.lastName = true
    if (!profile.email.trim()) newErrors.email = true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (profile.email && !emailRegex.test(profile.email)) newErrors.email = true
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Missing or invalid information",
        description: "Please fill out all required fields correctly before saving.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Include avatar in profile if uploaded
      const profileToSave = {
        ...profile,
        avatar: avatarPreview || profile.avatar,
      }

      // Save to backend
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileToSave),
        credentials: 'include',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('Server error:', errorData)
        throw new Error(`Failed to save profile to server: ${res.status}`)
      }
      
      const updatedProfile = await res.json()

      // Ensure avatar is preserved
      if (avatarPreview && !updatedProfile.avatar) {
        updatedProfile.avatar = avatarPreview
      }

      // Save to localStorage
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile))

      // Update original values to reflect the saved state
      setOriginalProfile(updatedProfile)
      setOriginalAvatar(avatarPreview || updatedProfile.avatar || "")
      setAvatarFile(null) // Clear the file since it's now saved
      
      // Update original theme to reflect the saved state
      if (hasThemeChanged) {
        setOriginalTheme(theme || "system")
        setHasThemeChanged(false)
        saveSuccessfulRef.current = true
      }

      // Dispatch event to notify other components
      window.dispatchEvent(
        new CustomEvent('profileUpdated', {
          detail: updatedProfile,
        }),
      )

      toast({
        title: 'Profile saved',
        description: 'Your profile has been updated successfully. Redirecting to dashboard...',
      })

      // Redirect to dashboard after a short delay to show the toast
      setTimeout(() => {
        router.push('/student/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Error',
        description: `Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getUserInitials = () => {
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    }
    return "YU"
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardContent className="p-8 text-center">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
            Manage your account settings, personal information, and preferences
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || profile.avatar} />
                  <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
                </Avatar>
                {avatarPreview && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={removeAvatar}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="text-center">
                <h3 className="font-semibold">
                  {profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : "Your Name"}
                </h3>
                <p className="text-sm text-muted-foreground">{profile.email || "your.email@example.com"}</p>
                {profile.gradeLevel && (
                  <Badge variant="secondary" className="mt-2">
                    {profile.gradeLevel}
                  </Badge>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter your first name"
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter your last name"
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  className={errors.email ? "border-red-500" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
              <CardDescription>Tell us about your educational background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Select value={profile.gradeLevel} onValueChange={(value) => handleInputChange("gradeLevel", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Input
                    id="school"
                    value={profile.school}
                    onChange={(e) => handleInputChange("school", e.target.value)}
                    placeholder="Enter your school name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the application looks and feels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemeChange("light")}
                    className="justify-start"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemeChange("dark")}
                    className="justify-start"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleThemeChange("system")}
                    className="justify-start"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme. System will use your device's theme setting.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push("/student/dashboard")}
              disabled={isLoading}
              size="lg"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !hasChanges()} 
              size="lg"
              className={!hasChanges() ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
