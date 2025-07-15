"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

interface DebugInfo {
  profile: {
    id: string
    firstName: string
    lastName: string
    avatar: string
    fullImage: string
    avatarExists: boolean
    avatarType: string
    avatarLength: number
    avatarStartsWithDataImage: boolean
    fullImageExists: boolean
    fullImageType: string
    fullImageLength: number
  }
}

export default function DebugAvatarPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [localStorageProfile, setLocalStorageProfile] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Load localStorage profile
    const profile = localStorage.getItem('userProfile')
    if (profile) {
      try {
        setLocalStorageProfile(JSON.parse(profile))
      } catch (error) {
        console.error('Error parsing localStorage profile:', error)
      }
    }
  }, [])

  const fetchDebugInfo = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/debug-avatar')
      if (res.ok) {
        const data = await res.json()
        setDebugInfo(data)
        toast({
          title: 'Debug info fetched',
          description: 'Avatar debug information retrieved successfully.',
        })
      } else {
        throw new Error(`Failed to fetch debug info: ${res.status}`)
      }
    } catch (error) {
      console.error('Error fetching debug info:', error)
      toast({
        title: 'Error',
        description: `Failed to fetch debug info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testAvatarUpdate = async () => {
    setIsLoading(true)
    try {
      const testAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      
      const res = await fetch('/api/debug-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar: testAvatar,
          fullImage: testAvatar
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        toast({
          title: 'Test avatar updated',
          description: 'Test avatar has been updated in the database.',
        })
        // Refresh debug info
        await fetchDebugInfo()
      } else {
        throw new Error(`Failed to update test avatar: ${res.status}`)
      }
    } catch (error) {
      console.error('Error updating test avatar:', error)
      toast({
        title: 'Error',
        description: `Failed to update test avatar: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const refreshLocalStorage = () => {
    const profile = localStorage.getItem('userProfile')
    if (profile) {
      try {
        setLocalStorageProfile(JSON.parse(profile))
        toast({
          title: 'LocalStorage refreshed',
          description: 'LocalStorage profile data has been refreshed.',
        })
      } catch (error) {
        console.error('Error parsing localStorage profile:', error)
        toast({
          title: 'Error',
          description: 'Failed to parse localStorage profile.',
          variant: 'destructive',
        })
      }
    } else {
      setLocalStorageProfile(null)
      toast({
        title: 'No localStorage data',
        description: 'No profile data found in localStorage.',
      })
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardContent className="p-8 text-center">
          <h1 className="text-3xl font-bold">Avatar Debug Page</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
            Debug avatar upload and display issues
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Database Info */}
        <Card>
          <CardHeader>
            <CardTitle>Database Avatar Info</CardTitle>
            <CardDescription>Current avatar data from the database</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={debugInfo?.profile.avatar}
                  alt="Database Avatar"
                />
                <AvatarFallback className="text-lg">
                  {debugInfo?.profile.firstName?.[0]}{debugInfo?.profile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{debugInfo?.profile.firstName} {debugInfo?.profile.lastName}</p>
                <p className="text-sm text-muted-foreground">Database Avatar</p>
              </div>
            </div>
            
            {debugInfo && (
              <div className="space-y-2 text-sm">
                <p><strong>Avatar Exists:</strong> {debugInfo.profile.avatarExists ? 'Yes' : 'No'}</p>
                <p><strong>Avatar Type:</strong> {debugInfo.profile.avatarType}</p>
                <p><strong>Avatar Length:</strong> {debugInfo.profile.avatarLength}</p>
                <p><strong>Starts with data:image/:</strong> {debugInfo.profile.avatarStartsWithDataImage ? 'Yes' : 'No'}</p>
                <p><strong>Full Image Exists:</strong> {debugInfo.profile.fullImageExists ? 'Yes' : 'No'}</p>
                <p><strong>Full Image Type:</strong> {debugInfo.profile.fullImageType}</p>
                <p><strong>Full Image Length:</strong> {debugInfo.profile.fullImageLength}</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={fetchDebugInfo} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Fetch Debug Info'}
              </Button>
              <Button onClick={testAvatarUpdate} disabled={isLoading} variant="outline">
                Test Avatar Update
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* LocalStorage Info */}
        <Card>
          <CardHeader>
            <CardTitle>LocalStorage Avatar Info</CardTitle>
            <CardDescription>Current avatar data from localStorage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={localStorageProfile?.avatar}
                  alt="LocalStorage Avatar"
                />
                <AvatarFallback className="text-lg">
                  {localStorageProfile?.firstName?.[0]}{localStorageProfile?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{localStorageProfile?.firstName} {localStorageProfile?.lastName}</p>
                <p className="text-sm text-muted-foreground">LocalStorage Avatar</p>
              </div>
            </div>
            
            {localStorageProfile && (
              <div className="space-y-2 text-sm">
                <p><strong>Avatar Exists:</strong> {!!localStorageProfile.avatar ? 'Yes' : 'No'}</p>
                <p><strong>Avatar Type:</strong> {typeof localStorageProfile.avatar}</p>
                <p><strong>Avatar Length:</strong> {localStorageProfile.avatar?.length || 0}</p>
                <p><strong>Starts with data:image/:</strong> {localStorageProfile.avatar?.startsWith('data:image/') ? 'Yes' : 'No'}</p>
                <p><strong>Full Image Exists:</strong> {!!localStorageProfile.fullImage ? 'Yes' : 'No'}</p>
                <p><strong>Full Image Type:</strong> {typeof localStorageProfile.fullImage}</p>
                <p><strong>Full Image Length:</strong> {localStorageProfile.fullImage?.length || 0}</p>
              </div>
            )}
            
            <Button onClick={refreshLocalStorage} disabled={isLoading}>
              Refresh LocalStorage
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Raw Data Display */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data</CardTitle>
          <CardDescription>Raw avatar data for debugging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Database Avatar (first 100 chars):</h4>
            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
              {debugInfo?.profile.avatar?.substring(0, 100) || 'No avatar data'}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">LocalStorage Avatar (first 100 chars):</h4>
            <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
              {localStorageProfile?.avatar?.substring(0, 100) || 'No avatar data'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 