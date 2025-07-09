"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, ImageIcon, CalculatorIcon, Sigma, Bot, Loader2, X, BookOpen, FlaskConical, ArrowRight } from "lucide-react"
import { MathKeyboard } from "@/components/math-keyboard"
import { Calculator } from "@/components/calculator"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

export default function AITutorPage() {
  const [showMathKeyboard, setShowMathKeyboard] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string>("general")
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const { messages, input, setInput, handleSubmit, isLoading, append, setMessages } = useChat({
    api: "/api/chat",
    body: {
      subject: selectedSubject,
    },
    onError: (error) => {
      console.error("Chat error:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Load user profile on component mount and listen for updates
  useEffect(() => {
    const loadUserProfile = () => {
      try {
        const profile = localStorage.getItem("userProfile")
        if (profile) {
          setUserProfile(JSON.parse(profile))
        }
      } catch (error) {
        console.error("Error loading user profile:", error)
      }
    }

    loadUserProfile()

    // Listen for profile updates
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      setUserProfile(customEvent.detail)
    }

    window.addEventListener("profileUpdated", handleProfileUpdate)

    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate)
    }
  }, [])

  // Load historical session if `resume` param is provided
  useEffect(() => {
    const resumeId = searchParams.get("resume")
    if (resumeId) {
      setIsLoadingSession(true)
      try {
        const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]")
        const session = chatHistory.find((s: any) => s.id === resumeId)

        if (session) {
          setSelectedSubject(session.subject)
          setMessages(session.messages || [])
          setCurrentSessionId(resumeId)
          toast({
            title: "Session Resumed",
            description: `Continuing conversation: ${session.title}`,
          })
        } else {
          toast({
            title: "Session Not Found",
            description: "The requested conversation could not be found.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error loading session:", error)
        toast({
          title: "Error",
          description: "Failed to load the conversation.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingSession(false)
      }
    }
  }, [searchParams, setMessages, toast])

  // Handle subject parameter from URL
  useEffect(() => {
    const subjectParam = searchParams.get("subject")
    if (subjectParam && ["math", "science", "general"].includes(subjectParam)) {
      setSelectedSubject(subjectParam)
    }
  }, [searchParams])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && !isLoading) {
      setTimeout(() => {
        const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]")
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      }, 100)
    }
  }, [messages, isLoading])

  // Save/Update chat session to localStorage
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      try {
        const existingSessions = JSON.parse(localStorage.getItem("chatHistory") || "[]")
        let sessionToSave

        if (currentSessionId) {
          // Update existing session
          const sessionIndex = existingSessions.findIndex((s: any) => s.id === currentSessionId)
          if (sessionIndex !== -1) {
            sessionToSave = {
              ...existingSessions[sessionIndex],
              lastMessage: messages[messages.length - 1]?.content
                ? typeof messages[messages.length - 1].content === "string"
                  ? messages[messages.length - 1].content.slice(0, 100)
                  : "Image analysis in progress..."
                : "...",
              timestamp: new Date().toISOString(),
              messageCount: messages.length,
              messages: messages,
              topic: detectTopicFromContent(messages, selectedSubject),
            }
            existingSessions[sessionIndex] = sessionToSave
          }
        } else {
          // Create new session
          const newSessionId = `session_${Date.now()}`
          setCurrentSessionId(newSessionId)

          const firstUserMessage = messages.find((m) => m.role === "user")?.content
          let title = "New Conversation"
          if (typeof firstUserMessage === "string") {
            title = firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? "..." : "")
          } else if (Array.isArray(firstUserMessage)) {
            title = generateImageConversationTitle(messages, selectedSubject)
          }

          sessionToSave = {
            id: newSessionId,
            subject: selectedSubject,
            topic: detectTopicFromContent(messages, selectedSubject),
            title: title,
            lastMessage: messages[messages.length - 1]?.content
              ? typeof messages[messages.length - 1].content === "string"
                ? messages[messages.length - 1].content.slice(0, 100)
                : "Image analysis in progress..."
              : "...",
            timestamp: new Date().toISOString(),
            messageCount: messages.length,
            messages: messages,
          }
          existingSessions.unshift(sessionToSave)
        }

        localStorage.setItem("chatHistory", JSON.stringify(existingSessions.slice(0, 50)))
        window.dispatchEvent(new CustomEvent("chatSessionUpdated"))
      } catch (error) {
        console.error("Failed to save chat session:", error)
      }
    }
  }, [messages, isLoading, currentSessionId, selectedSubject])

  // Topic detection function
  const detectTopicFromContent = (messages: any[], subject: string): string => {
    if (!messages || messages.length === 0) return "general"
    
    // Get all text content from messages
    const allText = messages
      .map(msg => {
        if (typeof msg.content === 'string') return msg.content
        if (Array.isArray(msg.content)) {
          return msg.content
            .map((content: any) => content.type === 'text' ? content.text : '')
            .join(' ')
        }
        return ''
      })
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

  // Generate descriptive title for image conversations
  const generateImageConversationTitle = (messages: any[], subject: string): string => {
    if (!messages || messages.length === 0) return "Image Analysis"
    
    // Get all text content from messages
    const allText = messages
      .map(msg => {
        if (typeof msg.content === 'string') return msg.content
        if (Array.isArray(msg.content)) {
          return msg.content
            .map((content: any) => content.type === 'text' ? content.text : '')
            .join(' ')
        }
        return ''
      })
      .join(' ')
      .toLowerCase()
    
    // Look for specific keywords to generate descriptive titles
    if (subject === "math") {
      if (allText.includes('equation') || allText.includes('solve') || allText.includes('variable')) {
        return "Math Problem Analysis"
      }
      if (allText.includes('geometry') || allText.includes('triangle') || allText.includes('circle') || allText.includes('area')) {
        return "Geometry Problem"
      }
      if (allText.includes('graph') || allText.includes('plot') || allText.includes('chart')) {
        return "Graph Analysis"
      }
      if (allText.includes('formula') || allText.includes('equation')) {
        return "Formula Analysis"
      }
      return "Math Image Analysis"
    } else if (subject === "science") {
      if (allText.includes('cell') || allText.includes('organism') || allText.includes('microscope')) {
        return "Cell Biology Analysis"
      }
      if (allText.includes('molecule') || allText.includes('chemical') || allText.includes('reaction')) {
        return "Chemistry Analysis"
      }
      if (allText.includes('force') || allText.includes('motion') || allText.includes('energy')) {
        return "Physics Analysis"
      }
      if (allText.includes('diagram') || allText.includes('structure')) {
        return "Scientific Diagram"
      }
      if (allText.includes('experiment') || allText.includes('lab')) {
        return "Lab Experiment"
      }
      return "Science Image Analysis"
    } else {
      // General subject
      if (allText.includes('problem') || allText.includes('question')) {
        return "Problem Analysis"
      }
      if (allText.includes('diagram') || allText.includes('chart')) {
        return "Diagram Analysis"
      }
      if (allText.includes('text') || allText.includes('document')) {
        return "Document Analysis"
      }
      return "Image Analysis"
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setUploadedImage(result)
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
      setIsUploading(false)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (uploadedImage) {
        const currentInput = input
        const currentImage = uploadedImage
        setInput("")
        setUploadedImage(null)

        const messageContent = [
          ...(currentInput ? [{ type: "text" as const, text: currentInput }] : []),
          { type: "image" as const, image: currentImage },
        ]

        await append({ role: "user", content: messageContent as any })
      } else if (input.trim()) {
        await handleSubmit(e)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMathSymbolInsert = (symbol: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const newValue = input.substring(0, start) + symbol + input.substring(end)
      setInput(newValue)

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(start + symbol.length, start + symbol.length)
        }
      }, 0)
    }
  }

  const removeUploadedImage = () => {
    setUploadedImage(null)
  }

  const renderMessageContent = (content: any) => {
    if (typeof content === "string") {
      return <div className="whitespace-pre-wrap font-code">{content}</div>
    }

    if (Array.isArray(content)) {
      return (
        <div className="space-y-2">
          {content.map((item, index) => {
            if (item.type === "text") {
              return (
                <div key={index} className="whitespace-pre-wrap font-code">
                  {item.text}
                </div>
              )
            }
            if (item.type === "image") {
              return (
                <div key={index} className="mt-2">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt="Uploaded content"
                    className="max-w-sm rounded-lg border"
                  />
                </div>
              )
            }
            return null
          })}
        </div>
      )
    }
    return <div className="whitespace-pre-wrap font-code">{String(content)}</div>
  }

  const userInitials =
    userProfile.firstName && userProfile.lastName
      ? `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase()
      : "ST"

  const getSubjectIcon = () => {
    switch (selectedSubject) {
      case "math":
        return <BookOpen className="h-5 w-5" />
      case "science":
        return <FlaskConical className="h-5 w-5" />
      default:
        return <Bot className="h-5 w-5" />
    }
  }

  const getSubjectColor = () => {
    switch (selectedSubject) {
      case "math":
        return "bg-blue-100 text-blue-600"
      case "science":
        return "bg-green-100 text-green-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const getSubjectTitle = () => {
    switch (selectedSubject) {
      case "math":
        return "Mathematics Tutor"
      case "science":
        return "Science Tutor"
      default:
        return "General AI Tutor"
    }
  }

  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className={getSubjectColor()}>{getSubjectIcon()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{getSubjectTitle()}</CardTitle>
                <p className="text-sm text-muted-foreground">Your personal learning assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="math">Math</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Online
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-0">
          <ScrollArea ref={scrollAreaRef} className="h-full p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div
                    className={`h-12 w-12 mx-auto mb-4 rounded-full flex items-center justify-center ${getSubjectColor()}`}
                  >
                    {getSubjectIcon()}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Welcome to your {getSubjectTitle()}!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Ask me questions, upload images of problems, or start a conversation about what you're studying.
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className={getSubjectColor()}>{getSubjectIcon()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-blue-50 dark:bg-blue-950/30 text-foreground border border-blue-200 dark:border-blue-800"}`}
                  >
                    {renderMessageContent(message.content)}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={userProfile?.avatar || ""} />
                      <AvatarFallback className="bg-green-100 text-green-600">{userInitials}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className={getSubjectColor()}>{getSubjectIcon()}</AvatarFallback>
                  </Avatar>
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 flex items-center gap-2 border border-blue-200 dark:border-blue-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-foreground">{getSubjectTitle()} is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>

        <Separator />

        <div className="p-4 space-y-3">
          {uploadedImage && (
            <div className="relative inline-block">
              <img src={uploadedImage || "/placeholder.svg"} alt="Uploaded" className="max-w-xs rounded-lg border" />
              <Button
                onClick={removeUploadedImage}
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your studies..."
                className="min-h-[80px] pr-12 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleFormSubmit(e)
                  }
                }}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute top-1/2 right-2 transform -translate-y-1/2 h-8 px-3 text-xs font-medium"
                disabled={isLoading || (!input.trim() && !uploadedImage)}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                Upload Image
              </Button>
              <Button
                type="button"
                variant={showMathKeyboard ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowMathKeyboard(!showMathKeyboard)
                  setShowCalculator(false)
                }}
                className="flex items-center gap-2"
              >
                <Sigma className="h-4 w-4" />
                Math Keyboard
              </Button>
              <Button
                type="button"
                variant={showCalculator ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowCalculator(!showCalculator)
                  setShowMathKeyboard(false)
                }}
                className="flex items-center gap-2"
              >
                <CalculatorIcon className="h-4 w-4" />
                Calculator
              </Button>
              <span className="text-xs text-muted-foreground ml-2">Press Enter to send, Shift+Enter for new line</span>
            </div>
          </form>
        </div>
      </Card>

      {showMathKeyboard && (
        <MathKeyboard onInsert={handleMathSymbolInsert} onClose={() => setShowMathKeyboard(false)} />
      )}
      {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}
    </div>
  )
}