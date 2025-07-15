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
import { Camera, X, Sun, Moon, Monitor, User, Mail, Phone, GraduationCap, Loader2, Crop } from "lucide-react"
import { ImageCropper } from "@/components/image-cropper"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  gradeLevel: string
  school: string
  avatar?: string
  fullImage?: string // Store the full original image for refocusing
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
  const [originalTheme, setOriginalTheme] = useState<string>("")
  const [hasThemeChanged, setHasThemeChanged] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<string>("")
  const saveSuccessfulRef = useRef(false)
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [fullImagePreview, setFullImagePreview] = useState<string>("") // Store full image for refocusing
  const [showCropper, setShowCropper] = useState(false)
  const [tempImageSrc, setTempImageSrc] = useState<string>("")
  const [hasUnsavedAvatarChanges, setHasUnsavedAvatarChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const router = useRouter()

  // Load profile data on component mount
  useEffect(() => {
    console.log('Profile page: Starting initialization...')
    
    // 1. Load from localStorage first
    const savedProfile = localStorage.getItem('userProfile')
    let parsedProfile: UserProfile | null = null;
    if (savedProfile) {
      try {
        parsedProfile = JSON.parse(savedProfile)
        if (parsedProfile) {
          console.log('Profile page: Loaded from localStorage:', {
            avatar: parsedProfile.avatar ? 'exists' : 'null',
            avatarLength: parsedProfile.avatar?.length
          })
          setProfile(parsedProfile)
          setOriginalProfile(parsedProfile)
          setAvatarPreview(parsedProfile.avatar || "")
          setFullImagePreview(parsedProfile.fullImage || "")
        }
      } catch (e) {
        console.error('Profile page: Error parsing localStorage data:', e)
      }
    } else {
      console.log('Profile page: No localStorage data found')
    }
    
    // 2. Only fetch from API if we don't have localStorage data
    const fetchProfile = async () => {
      if (parsedProfile) {
        console.log('Profile page: Using localStorage data, skipping API fetch')
        setIsLoading(false)
        return
      }
      
      setIsLoading(true)
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const user = await res.json()
          console.log('Profile page: Received from API:', {
            avatar: user.avatar ? 'exists' : 'null',
            avatarLength: user.avatar?.length
          })
          const sanitizedUser = {
            ...user,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            gradeLevel: user.gradeLevel || "",
            school: user.school || "",
            avatar: user.avatar || "",
            fullImage: user.fullImage || ""
          }
          
          console.log('Profile page: Using API data (no localStorage)')
          setProfile(sanitizedUser)
          setOriginalProfile(sanitizedUser)
          setAvatarPreview(sanitizedUser.avatar || "")
          setFullImagePreview(sanitizedUser.fullImage || "")
          localStorage.setItem('userProfile', JSON.stringify(sanitizedUser))
        }
      } catch (error) {
        console.error('Profile page: API fetch failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
    
    // 3. Listen for profileUpdated event
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      const updated = customEvent.detail
      setProfile(updated)
      setOriginalProfile(updated)
      setAvatarPreview(updated.avatar || "")
      setFullImagePreview(updated.fullImage || "")
      localStorage.setItem('userProfile', JSON.stringify(updated))
      setHasUnsavedAvatarChanges(false) // Reset unsaved changes flag on profile update
    }
    window.addEventListener("profileUpdated", handleProfileUpdate)
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate)
  }, []) // Remove avatarPreview from dependencies to prevent infinite loops

  // Cleanup effect to save unsaved avatar changes when unmounting
  useEffect(() => {
    return () => {
      // If we have unsaved avatar changes, save them to localStorage
      if (hasUnsavedAvatarChanges) {
        const currentProfile = {
          ...profile,
          avatar: avatarPreview,
          fullImage: fullImagePreview
        }
        localStorage.setItem('userProfile', JSON.stringify(currentProfile))
        console.log('Profile page: Saved unsaved avatar changes to localStorage on unmount')
      }
    }
  }, [hasUnsavedAvatarChanges, profile, avatarPreview, fullImagePreview])

  // Track unsaved avatar changes
  useEffect(() => {
    const hasChanges = avatarPreview !== (originalProfile.avatar || "")
    setHasUnsavedAvatarChanges(hasChanges)
  }, [avatarPreview, originalProfile.avatar])

  // Initialize theme state when theme is available
  useEffect(() => {
    if (theme && !originalTheme) {
      setOriginalTheme(theme)
      setCurrentTheme(theme)
    }
  }, [theme, originalTheme])

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: false }))
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    setCurrentTheme(newTheme)
    setHasThemeChanged(true)
  }

  const hasChanges = (): boolean => {
    // Check if any profile fields have changed
    const profileChanged = Object.keys(profile).some(key => {
      if (key === 'avatar') return false // Handle avatar separately
      return profile[key as keyof UserProfile] !== originalProfile[key as keyof UserProfile]
    })

    // Check if avatar has changed
    const avatarChanged = avatarPreview !== originalProfile.avatar

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
        // Set canvas size for avatar (200x200 is good for avatars)
        const size = 200
        canvas.width = size
        canvas.height = size

        // Calculate scaling to maintain aspect ratio
        const scale = Math.max(size / img.width, size / img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale

        // Center the image
        const x = (size - scaledWidth) / 2
        const y = (size - scaledHeight) / 2

        // Draw the image
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

        // Convert to base64
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve(compressedDataUrl)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const storeFullImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Use the original image dimensions without compression
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        
        // Draw the full image at original resolution
        ctx.drawImage(img, 0, 0)
        const fullImageDataUrl = canvas.toDataURL('image/jpeg', 0.9) // 90% quality for full image
        resolve(fullImageDataUrl)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      })
      return
    }

    try {
      // Create a temporary URL for the cropper
      const tempUrl = URL.createObjectURL(file)
      setTempImageSrc(tempUrl)
      
      // Store the full original image for later refocusing
      const fullImageDataUrl = await storeFullImage(file)
      setFullImagePreview(fullImageDataUrl)
      
      setShowCropper(true)
    } catch (error) {
      console.error('Error processing image:', error)
      toast({
        title: 'Error',
        description: 'Failed to process image. Please try again.',
        variant: 'destructive',
      })
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCropComplete = (croppedImage: string) => {
    console.log('Crop complete - cropped image length:', croppedImage?.length)
    setAvatarPreview(croppedImage)
    setHasUnsavedAvatarChanges(true)
    setShowCropper(false)
    setTempImageSrc("")
    
    // Clean up the temporary URL
    if (tempImageSrc) {
      URL.revokeObjectURL(tempImageSrc)
    }
    
    toast({
      title: "Image focused",
      description: "Your profile picture has been focused. Click 'Save Changes' to keep it.",
    })
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setTempImageSrc("")
    
    // Clean up the temporary URL
    if (tempImageSrc) {
      URL.revokeObjectURL(tempImageSrc)
    }
  }

  const removeAvatar = () => {
    setAvatarPreview("")
    setFullImagePreview("")
    setHasUnsavedAvatarChanges(true)
    // Also update the profile state to clear the avatar
    setProfile(prev => ({
      ...prev,
      avatar: "",
      fullImage: ""
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: boolean } = {}

    if (!profile.firstName.trim()) newErrors.firstName = true
    if (!profile.lastName.trim()) newErrors.lastName = true
    if (!profile.email.trim()) newErrors.email = true

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)

    try {
      const profileToSave = {
        ...profile,
        avatar: avatarPreview,
        fullImage: fullImagePreview
      }

      console.log('Saving profile to backend:', profileToSave)
      console.log('Avatar being saved:', profileToSave.avatar ? 'exists' : 'null')
      console.log('Avatar type:', typeof profileToSave.avatar)
      console.log('Avatar length:', profileToSave.avatar?.length)
      
      // Save to backend
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileToSave),
        credentials: 'include',
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Backend save failed:', res.status, errorText)
        throw new Error(`Failed to save profile: ${res.status} - ${errorText}`)
      }
      
      const updatedProfile = await res.json()
      console.log('Backend save successful:', updatedProfile)

      // Save to localStorage
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile))

      // Update all profile states with the backend response
      setProfile(updatedProfile)
      setOriginalProfile(updatedProfile)
      setAvatarPreview(updatedProfile.avatar || "")
      setFullImagePreview(updatedProfile.fullImage || "")
      setHasUnsavedAvatarChanges(false)
      
      console.log('Profile page state updated after save:')
      console.log('Updated profile.avatar:', updatedProfile.avatar ? 'exists' : 'null')
      console.log('Updated avatarPreview:', updatedProfile.avatar ? 'exists' : 'null')
      
      // Update original theme if changed
      if (hasThemeChanged) {
        setOriginalTheme(theme || "system")
        setHasThemeChanged(false)
        saveSuccessfulRef.current = true
      }

      // Notify other components
      console.log('Profile page dispatching profileUpdated event:', updatedProfile)
      console.log('Profile page avatar in event:', updatedProfile.avatar)
      window.dispatchEvent(
        new CustomEvent('profileUpdated', {
          detail: updatedProfile,
        })
      )

      toast({
        title: 'Profile saved',
        description: 'Your profile has been updated successfully.',
      })

      // Redirect to dashboard
      router.push('/student/dashboard')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        title: 'Error',
        description: `Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
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

      {isLoading || isSaving ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{isSaving ? "Saving Changes..." : "Loading profile..."}</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Overview */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar 
                          key={`profile-avatar-${avatarPreview || profile.avatar ? (avatarPreview || profile.avatar || '').substring(0, 50) : 'no-avatar'}`}
                          className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            console.log('Avatar clicked - Debug info:')
                            console.log('fullImagePreview:', fullImagePreview ? 'exists' : 'not set')
                            console.log('avatarPreview:', avatarPreview ? 'exists' : 'not set')
                            console.log('profile.avatar:', profile.avatar ? 'exists' : 'not set')
                            console.log('profile.fullImage:', profile.fullImage ? 'exists' : 'not set')
                            
                            // If there's a full image available, use it for refocusing
                            if (fullImagePreview) {
                              console.log('Using fullImagePreview for refocusing')
                              setTempImageSrc(fullImagePreview)
                              setShowCropper(true)
                            } else if (profile.fullImage) {
                              console.log('Using profile.fullImage for refocusing')
                              setTempImageSrc(profile.fullImage)
                              setShowCropper(true)
                            } else if (avatarPreview || profile.avatar) {
                              // Fallback to avatar if no full image (for backward compatibility)
                              console.log('Fallback to avatar for refocusing (no full image available)')
                              setTempImageSrc(avatarPreview || profile.avatar || "")
                              setShowCropper(true)
                            } else {
                              // If no avatar, trigger file upload
                              console.log('No avatar found, triggering file upload')
                              fileInputRef.current?.click()
                            }
                          }}
                        >
                          <AvatarImage 
                            src={avatarPreview || profile.avatar} 
                            onError={(e) => {
                              console.log('Avatar image failed to load')
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to {avatarPreview || profile.avatar ? 'adjust' : 'upload'} profile picture</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {avatarPreview || profile.avatar ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeAvatar}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  ) : null}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {avatarPreview || profile.avatar ? 'Change Photo' : 'Upload Photo'}
                </Button>
                <div className="text-center">
                  <p className="text-sm font-medium">{profile.firstName} {profile.lastName}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Select value={profile.gradeLevel} onValueChange={(value) => handleInputChange('gradeLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade level" />
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
                    onChange={(e) => handleInputChange('school', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Button
                  variant={currentTheme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("light")}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant={currentTheme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("dark")}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant={currentTheme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleThemeChange("system")}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card className="md:col-span-3">
            <CardContent className="flex justify-end space-x-4 pt-6">
              <Button
                variant="outline"
                onClick={() => router.push('/student/dashboard')}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges() || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image Cropper Modal */}
      <ImageCropper
        key={tempImageSrc}
        isOpen={showCropper}
        onClose={handleCropCancel}
        onCrop={handleCropComplete}
        imageSrc={tempImageSrc}
      />
    </div>
  )
}
