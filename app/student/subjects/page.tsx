"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  lastMessage: string
  timestamp: Date
  messageCount: number
  messages?: Message[]
}

export default function SubjectsPage() {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [activeTab, setActiveTab] = useState("math")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
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

  const loadChatHistory = () => {
    try {
      const stored = localStorage.getItem("chatHistory")
      if (stored) {
        const parsed = JSON.parse(stored)
        const sessions = parsed.map((session: any) => ({
          ...session,
          timestamp: new Date(session.timestamp),
        }))
        setChatHistory(sessions)
      } else {
        // Create some sample data for demonstration with original questions as titles
        const sampleSessions: ChatSession[] = [
          {
            id: "1",
            subject: "math",
            topic: "algebra",
            title: "Solve for x: 2x + 5 = 13",
            lastMessage: "Great! You've mastered the concept of isolating variables.",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            messageCount: 12,
          },
          {
            id: "2",
            subject: "math",
            topic: "geometry",
            title: "Find the area of a triangle with base 8cm and height 6cm",
            lastMessage: "Let's explore what happens when we have an isosceles triangle...",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            messageCount: 8,
          },
          {
            id: "3",
            subject: "science",
            topic: "biology",
            title: "What is the difference between plant and animal cells?",
            lastMessage: "Can you tell me the difference between plant and animal cells?",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            messageCount: 15,
          },
          {
            id: "4",
            subject: "math",
            topic: "trigonometry",
            title: "Calculate sin(30°) and cos(45°)",
            lastMessage: "Remember, sine is opposite over hypotenuse...",
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            messageCount: 6,
          },
        ]
        setChatHistory(sampleSessions)
        localStorage.setItem("chatHistory", JSON.stringify(sampleSessions))
      }
    } catch (error) {
      console.error("Failed to load or parse chat history:", error)
      toast({
        title: "Error loading history",
        description: "Could not load chat history. It might be corrupted.",
        variant: "destructive",
      })
      localStorage.removeItem("chatHistory") // Clear corrupted data
    }
  }

  const clearAllHistory = () => {
    setChatHistory([])
    localStorage.removeItem("chatHistory")
    toast({
      title: "History cleared",
      description: "All conversation history has been deleted.",
    })
  }

  const deleteSession = (sessionId: string, event: React.MouseEvent) => {
    // Prevent the card click event from firing
    event.stopPropagation()

    const updatedHistory = chatHistory.filter((session) => session.id !== sessionId)
    setChatHistory(updatedHistory)
    localStorage.setItem("chatHistory", JSON.stringify(updatedHistory))

    toast({
      title: "Conversation deleted",
      description: "The conversation has been removed from your history.",
    })
  }

  const getSessionsBySubject = (subject: string) => {
    return chatHistory
      .filter((session) => session.subject === subject)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  const getTopicsBySubject = (subject: string) => {
    const sessions = getSessionsBySubject(subject)
    const topics = Array.from(new Set(sessions.map((session) => session.topic)))
    return topics
  }

  const getSessionsByTopic = (subject: string, topic: string) => {
    return chatHistory
      .filter((session) => session.subject === subject && session.topic === topic)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
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
              {subject === "general" ? "Start General Conversation" : `Start Learning ${subject.charAt(0).toUpperCase() + subject.slice(1)}`}
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
                        {session.lastMessage.length > 80
                          ? `${session.lastMessage.substring(0, 80)}...`
                          : session.lastMessage}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {session.messageCount} messages
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(session.timestamp)}
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
                              {session.lastMessage.length > 80
                                ? `${session.lastMessage.substring(0, 80)}...`
                                : session.lastMessage}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {session.messageCount} messages
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(session.timestamp)}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="math" className="flex items-center gap-2">
            📐 Mathematics
          </TabsTrigger>
          <TabsTrigger value="science" className="flex items-center gap-2">
            🔬 Science
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            📚 General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="math" className="mt-6">
          <SubjectContent subject="math" />
        </TabsContent>

        <TabsContent value="science" className="mt-6">
          <SubjectContent subject="science" />
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <SubjectContent subject="general" />
        </TabsContent>
      </Tabs>

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
                Biology
              </Button>
            </Link>
            <Link href="/student/tutor?subject=science&topic=chemistry">
              <Button variant="outline" size="sm">
                Chemistry
              </Button>
            </Link>
            <Link href="/student/tutor?subject=science&topic=physics">
              <Button variant="outline" size="sm">
                Physics
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
