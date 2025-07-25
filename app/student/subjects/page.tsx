"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Clock, X, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { capitalizeSubject } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  image?: string
}

interface ChatSession {
  id: string
  subject: string
  topic: string
  title: string
  last_message: string
  updated_at: string
  message_count: number
  messages?: Message[]
}

export default function SubjectsPage() {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [activeTab, setActiveTab] = useState("math")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Check if we have cached data first
  useEffect(() => {
    const cachedData = sessionStorage.getItem('chatHistoryCache')
    const cacheTimestamp = sessionStorage.getItem('chatHistoryCacheTimestamp')
    
    if (cachedData && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp)
      // Use cache if it's less than 5 minutes old
      if (cacheAge < 5 * 60 * 1000) {
        try {
          const parsedData = JSON.parse(cachedData)
          setChatHistory(parsedData)
          setIsInitialLoad(false)
        } catch (error) {
          console.error('Error parsing cached data:', error)
        }
      }
    }
    
    loadChatHistory()
    
    // Listen for chat session updates
    const handleChatSessionUpdate = () => {
      loadChatHistory()
    }
    
    window.addEventListener("chatSessionUpdated", handleChatSessionUpdate)
    
    return () => {
      window.removeEventListener("chatSessionUpdated", handleChatSessionUpdate)
    }
  }, [])

  const loadChatHistory = async () => {
    if (isLoading) return // Prevent multiple simultaneous requests
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/chat-sessions')
      if (response.ok) {
        const sessions = await response.json()
        const chatHistory = sessions.map((session: any) => ({
          id: session.id,
          subject: session.subject,
          topic: session.topic || '',
          title: session.title || 'Conversation',
          last_message: session.last_message || '',
          updated_at: session.updated_at,
          message_count: session.message_count || 0,
        }))
        setChatHistory(chatHistory)
        
        // Cache the data
        sessionStorage.setItem('chatHistoryCache', JSON.stringify(chatHistory))
        sessionStorage.setItem('chatHistoryCacheTimestamp', Date.now().toString())
      } else {
        console.error('Failed to fetch chat sessions:', response.status)
        setChatHistory([])
      }
    } catch (error) {
      console.error("Failed to load chat history:", error)
      toast({
        title: "Error loading history",
        description: "Could not load chat history. Please try again.",
        variant: "destructive",
      })
      setChatHistory([])
    } finally {
      setIsLoading(false)
      setIsInitialLoad(false)
    }
  }

  const clearAllHistory = async () => {
    try {
      // Delete all chat sessions for the user
      const response = await fetch('/api/chat-sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clearAll: true }),
      })

      if (response.ok) {
        setChatHistory([])
        toast({
          title: "History cleared",
          description: "All conversation history has been deleted.",
        })
      } else {
        throw new Error('Failed to clear history')
      }
    } catch (error) {
      console.error('Error clearing history:', error)
      toast({
        title: "Error",
        description: "Failed to clear history. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deleteSession = async (sessionId: string, event: React.MouseEvent) => {
    // Prevent the card click event from firing
    event.stopPropagation()

    try {
      const response = await fetch(`/api/chat-sessions?id=${sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const updatedHistory = chatHistory.filter((session) => session.id !== sessionId)
        setChatHistory(updatedHistory)
        toast({
          title: "Conversation deleted",
          description: "The conversation has been removed from your history.",
        })
      } else {
        throw new Error('Failed to delete session')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getSessionsBySubject = (subject: string) => {
    return chatHistory
      .filter((session) => session.subject === subject)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }

  const getTopicsBySubject = (subject: string) => {
    const sessions = getSessionsBySubject(subject)
    const topics = Array.from(new Set(sessions.map((session) => session.topic)))
    return topics
  }

  const getSessionsByTopic = (subject: string, topic: string) => {
    return chatHistory
      .filter((session) => session.subject === subject && session.topic === topic)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }

  const getSessionCountBySubject = (subject: string) => {
    return chatHistory.filter((session) => session.subject === subject).length
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  const getTopicEmoji = (topic: string) => {
    const emojiMap: { [key: string]: string } = {
      // Math topics
      algebra: "🔢",
      geometry: "📐",
      trigonometry: "📊",
      statistics: "📈",
      calculus: "∫",
      arithmetic: "➕",
      "number theory": "🔢",
      probability: "🎲",
      "linear algebra": "📊",
      "differential equations": "∫",
      general: "📚",

      // Science topics
      biology: "🧬",
      chemistry: "⚗️",
      physics: "⚛️",
      "earth science": "🌍",
      "environmental science": "🌱",
      anatomy: "🫀",
      genetics: "🧬",
      ecology: "🌿",
      "organic chemistry": "⚗️",
      "inorganic chemistry": "⚗️",
      mechanics: "⚙️",
      electricity: "⚡",
      magnetism: "🧲",
      thermodynamics: "🌡️",
      astronomy: "🌌",
      geology: "🪨",
      meteorology: "🌤️",
    }

    return (
      <span className="text-lg mr-1" role="img" aria-label={topic}>
        {emojiMap[topic] || "📚"}
      </span>
    )
  }

  const detectTopicFromContent = (messages: Message[], subject: string): string => {
    if (!messages || messages.length === 0) return "general"
    
    // Get all text content from messages
    const allText = messages
      .map(msg => typeof msg.content === 'string' ? msg.content : '')
      .join(' ')
      .toLowerCase()
    
    if (subject === "math") {
      // Math topic detection
      if (allText.includes('algebra') || allText.includes('equation') || allText.includes('variable') || allText.includes('solve for x')) {
        return 'algebra'
      }
      if (allText.includes('geometry') || allText.includes('triangle') || allText.includes('circle') || allText.includes('area') || allText.includes('perimeter')) {
        return 'geometry'
      }
      if (allText.includes('trigonometry') || allText.includes('sin') || allText.includes('cos') || allText.includes('tan') || allText.includes('angle')) {
        return 'trigonometry'
      }
      if (allText.includes('calculus') || allText.includes('derivative') || allText.includes('integral') || allText.includes('limit')) {
        return 'calculus'
      }
      if (allText.includes('statistics') || allText.includes('mean') || allText.includes('median') || allText.includes('probability')) {
        return 'statistics'
      }
      if (allText.includes('arithmetic') || allText.includes('addition') || allText.includes('subtraction') || allText.includes('multiplication') || allText.includes('division')) {
        return 'arithmetic'
      }
      return 'general'
    } else if (subject === "science") {
      // Science topic detection
      if (allText.includes('biology') || allText.includes('cell') || allText.includes('organism') || allText.includes('species') || allText.includes('evolution')) {
        return 'biology'
      }
      if (allText.includes('chemistry') || allText.includes('molecule') || allText.includes('reaction') || allText.includes('element') || allText.includes('compound')) {
        return 'chemistry'
      }
      if (allText.includes('physics') || allText.includes('force') || allText.includes('energy') || allText.includes('motion') || allText.includes('wave')) {
        return 'physics'
      }
      if (allText.includes('earth') || allText.includes('geology') || allText.includes('rock') || allText.includes('mineral') || allText.includes('plate')) {
        return 'earth science'
      }
      if (allText.includes('environment') || allText.includes('ecosystem') || allText.includes('climate') || allText.includes('pollution')) {
        return 'environmental science'
      }
      return 'general'
    }
    
    return 'general'
  }

  const SubjectContent = ({ subject }: { subject: string }) => {
    const topics = getTopicsBySubject(subject)

    // Show loading skeleton if still loading
    if (isInitialLoad) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="space-y-3">
                {[1, 2].map((j) => (
                  <div key={j} className="border rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (topics.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
          <p className="text-muted-foreground mb-4">
            {subject === "general" 
              ? "Start a general conversation with the AI tutor" 
              : `Start your first ${subject} conversation with the AI tutor`
            }
          </p>
          <Link href={`/student/tutor?subject=${subject === "general" ? "" : subject}`}>
            <Button>
              {subject === "general" ? "Start General Conversation" : `Start Learning ${capitalizeSubject(subject)}`}
            </Button>
          </Link>
        </div>
      )
    }

    // For general subject, show all conversations without subtopics
    if (subject === "general") {
      const sessions = getSessionsBySubject(subject)
      return (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow cursor-pointer relative group">
              <div
                onClick={() => {
                  router.push(`/student/tutor?resume=${session.id}`)
                }}
                className="block"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-8">
                      <CardTitle className="text-base font-medium">{session.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {session.last_message.length > 80
                          ? `${session.last_message.substring(0, 80)}...`
                          : session.last_message}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {session.message_count} messages
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(new Date(session.updated_at))}
                    </div>
                  </div>
                </CardContent>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 z-10"
                onClick={(e) => deleteSession(session.id, e)}
                title="Delete conversation"
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )
    }

    // For math and science, show organized by topics
    return (
      <div className="space-y-6">
        {topics.map((topic) => {
          const sessions = getSessionsByTopic(subject, topic)
          return (
            <div key={topic} className="space-y-3">
              <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                {getTopicEmoji(topic)}
                {topic}
              </h3>
              <div className="grid gap-3">
                {sessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow cursor-pointer relative group">
                    <div
                      onClick={() => {
                        router.push(`/student/tutor?subject=${subject}&topic=${topic}&resume=${session.id}`)
                      }}
                      className="block"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-8">
                            <CardTitle className="text-base font-medium">{session.title}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {session.last_message.length > 80
                                ? `${session.last_message.substring(0, 80)}...`
                                : session.last_message}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {session.message_count} messages
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(new Date(session.updated_at))}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 z-10"
                      onClick={(e) => deleteSession(session.id, e)}
                      title="Delete conversation"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Your Learning Journey</h1>
              <p className="text-muted-foreground">Review your past conversations and continue learning</p>
            </div>

            {chatHistory.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All History
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Conversation History?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your conversation history across all
                      subjects and topics.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearAllHistory} className="bg-red-600 hover:bg-red-700">
                      Clear All History
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Subject Selection Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant={activeTab === "math" ? "default" : "outline"}
            onClick={() => setActiveTab("math")}
            className="flex items-center gap-2 px-3 sm:px-4 py-3 text-sm sm:text-base min-h-[48px]"
            disabled={isLoading}
          >
            <span className="text-base sm:text-lg">📐</span>
            <span className="truncate">
              {capitalizeSubject("Mathematics")} ({getSessionCountBySubject("math")})
            </span>
          </Button>
          <Button
            variant={activeTab === "science" ? "default" : "outline"}
            onClick={() => setActiveTab("science")}
            className="flex items-center gap-2 px-3 sm:px-4 py-3 text-sm sm:text-base min-h-[48px]"
            disabled={isLoading}
          >
            <span className="text-base sm:text-lg">🔬</span>
            <span className="truncate">
              Science ({getSessionCountBySubject("science")})
            </span>
          </Button>
          <Button
            variant={activeTab === "general" ? "default" : "outline"}
            onClick={() => setActiveTab("general")}
            className="flex items-center gap-2 px-3 sm:px-4 py-3 text-sm sm:text-base min-h-[48px]"
            disabled={isLoading}
          >
            <span className="text-base sm:text-lg">📚</span>
            <span className="truncate">
              General ({getSessionCountBySubject("general")})
            </span>
          </Button>
        </div>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            <span className="text-sm text-muted-foreground">Refreshing conversations...</span>
          </div>
        )}

        {/* Content based on active tab */}
        <div className="mt-6">
          {activeTab === "math" && <SubjectContent subject="math" />}
          {activeTab === "science" && <SubjectContent subject="science" />}
          {activeTab === "general" && <SubjectContent subject="general" />}
        </div>
      </div>

      {/* Quick Start Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Start a New Conversation</CardTitle>
          <CardDescription>Begin learning with our AI tutor in any subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/student/tutor?subject=math&topic=algebra">
              <Button variant="outline" size="sm">
                Algebra
              </Button>
            </Link>
            <Link href="/student/tutor?subject=math&topic=geometry">
              <Button variant="outline" size="sm">
                Geometry
              </Button>
            </Link>
            <Link href="/student/tutor?subject=math&topic=trigonometry">
              <Button variant="outline" size="sm">
                Trigonometry
              </Button>
            </Link>
            <Link href="/student/tutor?subject=science&topic=biology">
              <Button variant="outline" size="sm">
                {capitalizeSubject("Biology")}
              </Button>
            </Link>
            <Link href="/student/tutor?subject=science&topic=chemistry">
              <Button variant="outline" size="sm">
                {capitalizeSubject("Chemistry")}
              </Button>
            </Link>
            <Link href="/student/tutor?subject=science&topic=physics">
              <Button variant="outline" size="sm">
                {capitalizeSubject("Physics")}
              </Button>
            </Link>
            <Link href="/student/tutor">
              <Button variant="outline" size="sm">
                General
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
