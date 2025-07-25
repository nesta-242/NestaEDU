"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"

// Type declarations for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Send, ImageIcon, CalculatorIcon, Sigma, Bot, Loader2, X, BookOpen, FlaskConical, ArrowRight, Mic, MicOff } from "lucide-react"
import { MathKeyboard } from "@/components/math-keyboard"
import { capitalizeSubject } from "@/lib/utils"
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
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [waveformHeights, setWaveformHeights] = useState([4, 4, 4, 4, 4])
  const [audioLevel, setAudioLevel] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const questionPrefilledRef = useRef(false)
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
          const parsedProfile = JSON.parse(profile)
          setUserProfile(parsedProfile)
        }
      } catch (error) {
        console.error("Failed to load user profile from localStorage", error)
      }
    }

    loadUserProfile()

    // Listen for profile updates
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      console.log('Profile update event received in tutor:', customEvent.detail)
      setUserProfile(customEvent.detail)
    }

    window.addEventListener("profileUpdated", handleProfileUpdate)
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate)
  }, [])

  // Load historical session if `resume` param is provided
  useEffect(() => {
    const resumeId = searchParams.get("resume")
    if (resumeId) {
      setIsLoadingSession(true)
      try {
        // Fetch the specific session from database
        fetch(`/api/chat-sessions?id=${resumeId}`)
          .then(response => response.json())
          .then(session => {
            console.log('Resuming session:', session)
            if (session && !session.error) {
              console.log('Session messages:', session.messages)
              setSelectedSubject(session.subject)
              setCurrentSessionId(resumeId)
              
              // Set the messages directly
              setMessages(session.messages || [])
              
              toast({
                title: "Session Resumed",
                description: `Continuing conversation: ${session.title}`,
              })
            } else {
              console.error('Session not found or error:', session)
              toast({
                title: "Session Not Found",
                description: "The requested conversation could not be found.",
                variant: "destructive",
              })
            }
          })
          .catch(error => {
            console.error("Error loading session:", error)
            toast({
              title: "Error",
              description: "Failed to load the conversation.",
              variant: "destructive",
            })
          })
          .finally(() => {
            setIsLoadingSession(false)
          })
      } catch (error) {
        console.error("Error loading session:", error)
        toast({
          title: "Error",
          description: "Failed to load the conversation.",
          variant: "destructive",
        })
        setIsLoadingSession(false)
      }
    }
  }, [searchParams, toast])

  // Handle subject and question parameters from URL
  useEffect(() => {
    const subjectParam = searchParams.get("subject")
    const questionParam = searchParams.get("question")
    
    if (subjectParam && ["math", "science", "general"].includes(subjectParam)) {
      setSelectedSubject(subjectParam)
    }
    
    // Pre-fill input with question if provided (only once)
    if (questionParam && !questionPrefilledRef.current) {
      const decodedQuestion = decodeURIComponent(questionParam)
      setInput(decodedQuestion)
      questionPrefilledRef.current = true
      
      // Focus the textarea after a short delay to ensure it's rendered
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
        }
      }, 100)
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

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'
      
      recognitionInstance.onstart = () => {
        setIsRecording(true)
        toast({
          title: "Recording Started",
          description: "Speak now to dictate your message...",
        })
      }
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          const processedTranscript = addSmartPunctuation(finalTranscript)
          setInput(prev => {
            // Add space before new text if previous text doesn't end with space or is empty
            const needsSpace = prev.trim() && !prev.endsWith(' ')
            return prev + (needsSpace ? ' ' : '') + processedTranscript
          })
        }
      }
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        toast({
          title: "Recording Error",
          description: "Failed to record audio. Please try again.",
          variant: "destructive",
        })
      }
      
      recognitionInstance.onend = () => {
        setIsRecording(false)
        stopAudioAnalysis()
        toast({
          title: "Recording Stopped",
          description: "Voice recording has ended.",
        })
      }
      
      setRecognition(recognitionInstance)
    }

    // Cleanup function to stop recording when component unmounts
    return () => {
      if (recognition) {
        recognition.stop()
      }
      stopAudioAnalysis()
    }
  }, [toast])

  // Update waveform based on real-time audio level
  useEffect(() => {
    if (!isRecording) {
      setWaveformHeights([4, 4, 4, 4, 4])
      return
    }

    const baseHeight = 4
    const maxHeight = 20
    
    if (isVoiceActive && audioLevel > 0.010) { // Only animate if above noise threshold
      // Create heights based on audio level with immediate response
      const levelMultiplier = Math.max(audioLevel * 45, 3) // Slightly less aggressive scaling
      
      setWaveformHeights([
        Math.min(maxHeight, baseHeight + levelMultiplier + Math.random() * 1.5),
        Math.min(maxHeight, baseHeight + levelMultiplier * 0.8 + Math.random() * 2),
        Math.min(maxHeight, baseHeight + levelMultiplier * 1.2 + Math.random() * 1),
        Math.min(maxHeight, baseHeight + levelMultiplier * 0.9 + Math.random() * 1.8),
        Math.min(maxHeight, baseHeight + levelMultiplier * 0.7 + Math.random() * 1.3),
      ])
    } else {
      // Smoothly return to baseline - but only if significantly above baseline
      setWaveformHeights(prev => 
        prev.map(height => height > baseHeight + 1 ? Math.max(baseHeight, height * 0.8) : baseHeight)
      )
    }
  }, [audioLevel, isVoiceActive, isRecording])

  // Save/Update chat session to database
  useEffect(() => {
    console.log('Messages changed:', messages.length, 'messages, isLoading:', isLoading)
    if (messages.length > 0 && !isLoading) {
      try {
        const sessionToSave = {
          id: currentSessionId,
          subject: selectedSubject,
          topic: detectTopicFromContent(messages, selectedSubject),
          title: currentSessionId ? undefined : (() => {
            const firstUserMessage = messages.find((m) => m.role === "user")?.content
            if (typeof firstUserMessage === "string") {
              return firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? "..." : "")
            } else if (Array.isArray(firstUserMessage)) {
              return generateImageConversationTitle(messages, selectedSubject)
            }
            return "New Conversation"
          })(),
          lastMessage: messages[messages.length - 1]?.content
            ? typeof messages[messages.length - 1].content === "string"
              ? messages[messages.length - 1].content.slice(0, 100)
              : "Image analysis in progress..."
            : "...",
          messageCount: messages.length,
          messages: messages,
        }

        // Only save if we have a meaningful conversation (more than just the initial message)
        if (messages.length > 1) {
          fetch('/api/chat-sessions', {
            method: currentSessionId ? 'PUT' : 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionToSave),
          })
          .then(response => response.json())
          .then(data => {
            if (!currentSessionId && data.id) {
              setCurrentSessionId(data.id)
            }
            // Dispatch event to update other components
            window.dispatchEvent(new CustomEvent("chatSessionUpdated"))
          })
          .catch(error => {
            console.error("Failed to save chat session:", error)
          })
        }
      } catch (error) {
        console.error("Failed to save chat session:", error)
      }
    }
  }, [messages.length, isLoading, currentSessionId, selectedSubject]) // Changed dependency to messages.length instead of messages

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

    // Stop recording if active
    if (isRecording && recognition) {
      recognition.stop()
      stopAudioAnalysis()
    }

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

  const handleCalculatorFocusChange = (hasFocus: boolean) => {
    if (!hasFocus && textareaRef.current) {
      // When calculator is closed or loses focus, focus the textarea
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }

  const addSmartPunctuation = (text: string): string => {
    if (!text.trim()) return text
    
    let processedText = text.trim()
    
    // Convert mathematical expressions first
    processedText = convertMathExpressions(processedText)
    
    // Capitalize first letter
    processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1)
    
    // Remove any existing punctuation at the end
    processedText = processedText.replace(/[.!?]+$/, '')
    
    // Question patterns - words/phrases that typically start questions
    const questionStarters = [
      'what', 'when', 'where', 'why', 'who', 'how', 'which', 'whose',
      'can', 'could', 'would', 'should', 'will', 'do', 'does', 'did',
      'is', 'are', 'was', 'were', 'have', 'has', 'had',
      'may', 'might', 'shall', 'am', 'isn\'t', 'aren\'t', 'wasn\'t',
      'weren\'t', 'haven\'t', 'hasn\'t', 'hadn\'t', 'don\'t', 'doesn\'t',
      'didn\'t', 'won\'t', 'wouldn\'t', 'shouldn\'t', 'couldn\'t',
      'can\'t', 'may I', 'could you', 'would you', 'can you'
    ]
    
    // Question patterns that can appear anywhere
    const questionPhrases = [
      'or not', 'right?', 'correct?', 'true?', 'false?', 'agree?',
      'think so', 'you know', 'make sense', 'understand'
    ]
    
    const lowerText = processedText.toLowerCase()
    
    // Check if it starts with a question word/phrase
    const startsWithQuestion = questionStarters.some(starter => 
      lowerText.startsWith(starter.toLowerCase() + ' ') || 
      lowerText === starter.toLowerCase()
    )
    
    // Check if it contains question phrases
    const containsQuestionPhrase = questionPhrases.some(phrase => 
      lowerText.includes(phrase.toLowerCase())
    )
    
    // Educational context patterns - common in tutoring
    const educationalQuestions = [
      'explain', 'help me', 'show me', 'teach me', 'solve',
      'calculate', 'find', 'determine', 'derive', 'prove'
    ]
    
    const isEducationalQuestion = educationalQuestions.some(pattern => 
      lowerText.includes(pattern.toLowerCase())
    )
    
    // Add appropriate punctuation
    if (startsWithQuestion || containsQuestionPhrase || 
        (isEducationalQuestion && (lowerText.includes('how') || lowerText.includes('what')))) {
      return processedText + '?'
    } else {
      return processedText + '.'
    }
  }

  const convertMathExpressions = (text: string): string => {
    let converted = text
    
    // Number word to digit conversion
    const numberWords = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
      'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
      'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
      'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19', 'twenty': '20'
    }
    
    // Convert number words to digits
    Object.entries(numberWords).forEach(([word, digit]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      converted = converted.replace(regex, digit)
    })
    
    // Mathematical operations and symbols
    const mathReplacements = [
      // Basic operations
      { pattern: /\bplus\b/gi, replacement: '+' },
      { pattern: /\bminus\b/gi, replacement: '-' },
      { pattern: /\btimes\b/gi, replacement: '×' },
      { pattern: /\bmultiplied by\b/gi, replacement: '×' },
      { pattern: /\bdivided by\b/gi, replacement: '÷' },
      { pattern: /\bequals\b/gi, replacement: '=' },
      { pattern: /\bis equal to\b/gi, replacement: '=' },
      
      // Comparison operators
      { pattern: /\bgreater than\b/gi, replacement: '>' },
      { pattern: /\bless than\b/gi, replacement: '<' },
      { pattern: /\bgreater than or equal to\b/gi, replacement: '≥' },
      { pattern: /\bless than or equal to\b/gi, replacement: '≤' },
      { pattern: /\bnot equal to\b/gi, replacement: '≠' },
      
      // Fractions
      { pattern: /\bone half\b/gi, replacement: '1/2' },
      { pattern: /\bone third\b/gi, replacement: '1/3' },
      { pattern: /\btwo thirds\b/gi, replacement: '2/3' },
      { pattern: /\bone quarter\b/gi, replacement: '1/4' },
      { pattern: /\bthree quarters\b/gi, replacement: '3/4' },
      
      // Common math terms
      { pattern: /\bpi\b/gi, replacement: 'π' },
      { pattern: /\btheta\b/gi, replacement: 'θ' },
      { pattern: /\balpha\b/gi, replacement: 'α' },
      { pattern: /\bbeta\b/gi, replacement: 'β' },
      { pattern: /\bgamma\b/gi, replacement: 'γ' },
      { pattern: /\bdelta\b/gi, replacement: 'Δ' },
      { pattern: /\binfinity\b/gi, replacement: '∞' },
      { pattern: /\bsquare root of\b/gi, replacement: '√' },
      { pattern: /\bsum of\b/gi, replacement: 'Σ' },
      
      // Parentheses
      { pattern: /\bopen parenthesis\b/gi, replacement: '(' },
      { pattern: /\bclose parenthesis\b/gi, replacement: ')' },
      { pattern: /\bleft parenthesis\b/gi, replacement: '(' },
      { pattern: /\bright parenthesis\b/gi, replacement: ')' }
    ]
    
    // Apply all mathematical replacements
    mathReplacements.forEach(({ pattern, replacement }) => {
      converted = converted.replace(pattern, replacement)
    })
    
    // Handle exponents/powers with superscript
    // "x squared" -> "x²", "x cubed" -> "x³", "x to the power of 4" -> "x⁴"
    converted = converted.replace(/\b([a-zA-Z])\s*squared\b/gi, '$1²')
    converted = converted.replace(/\b([a-zA-Z])\s*cubed\b/gi, '$1³')
    
    // Handle "to the power of" or "to the nth power"
    const superscriptMap: { [key: string]: string } = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵',
      '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    }
    
    // "x to the power of 4" -> "x⁴"
    converted = converted.replace(/\b([a-zA-Z])\s*to the power of\s*(\d+)\b/gi, (match, base, exp) => {
      const superscript = exp.split('').map((digit: string) => superscriptMap[digit] || digit).join('')
      return base + superscript
    })
    
    // "x to the 4th power" -> "x⁴"
    converted = converted.replace(/\b([a-zA-Z])\s*to the\s*(\d+)(?:st|nd|rd|th)\s*power\b/gi, (match, base, exp) => {
      const superscript = exp.split('').map((digit: string) => superscriptMap[digit] || digit).join('')
      return base + superscript
    })
    
    // Handle simple expressions like "x squared equals 19 minus 6"
    // This will already be converted by the above rules to "x² = 19 - 6"
    
    return converted
  }

  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Create audio context and analyser
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      
      analyserRef.current.fftSize = 128 // Smaller FFT for faster processing
      analyserRef.current.smoothingTimeConstant = 0.3 // Less smoothing for more responsive detection
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      const analyzeAudio = () => {
        if (!analyserRef.current) return
        
        // Use time domain data for more immediate response
        analyserRef.current.getByteTimeDomainData(dataArray)
        
        // Calculate RMS (Root Mean Square) for more accurate volume detection
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          const sample = (dataArray[i] - 128) / 128 // Convert to -1 to 1 range
          sum += sample * sample
        }
        const rms = Math.sqrt(sum / bufferLength)
        
        // Use a higher threshold to filter out white noise but still be responsive
        const threshold = 0.010
        setAudioLevel(rms)
        setIsVoiceActive(rms > threshold)
        
        // Continue animation loop
        animationFrameRef.current = requestAnimationFrame(analyzeAudio)
      }
      
      // Start the animation loop
      analyzeAudio()
    } catch (error) {
      console.error('Error setting up audio analysis:', error)
    }
  }

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    analyserRef.current = null
    setAudioLevel(0)
    setIsVoiceActive(false)
  }

  const handleVoiceRecording = () => {
    if (!recognition) {
      toast({
        title: "Voice Recording Not Supported",
        description: "Your browser doesn't support voice recording. Please use a modern browser like Chrome, Edge, or Safari.",
        variant: "destructive",
      })
      return
    }

    if (isRecording) {
      recognition.stop()
      stopAudioAnalysis()
    } else {
      // Request microphone permission and start recording
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(async () => {
          recognition.start()
          await startAudioAnalysis()
        })
        .catch((error) => {
          console.error('Microphone permission denied:', error)
          toast({
            title: "Microphone Access Required",
            description: "Please allow microphone access to use voice dictation.",
            variant: "destructive",
          })
        })
    }
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
        // Use CalculatorIcon for math
        return <CalculatorIcon className="h-5 w-5" />
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
    <div className="flex flex-col min-h-0 max-w-4xl mx-auto">
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className={getSubjectColor()}>{getSubjectIcon()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{getSubjectTitle()}</CardTitle>
                <p className="text-sm text-muted-foreground">Your personal learning assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-28 sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="math">{capitalizeSubject("Math")}</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Online
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 p-0">
          <ScrollArea ref={scrollAreaRef} className="h-[60vh] md:h-full p-4">
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

        <div className="p-4 space-y-3 pb-6 md:pb-4">
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
                placeholder={!isRecording ? "Ask me anything about your studies..." : ""}
                className="min-h-[80px] md:min-h-[80px] pr-16 resize-none text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleFormSubmit(e)
                  }
                  // Voice recording shortcut: Ctrl/Cmd + Shift + M
                  if (e.key === "M" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
                    e.preventDefault()
                    handleVoiceRecording()
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

            {isRecording && (
              <div className="flex items-center gap-3 py-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-red-600 font-medium">Listening...Speak your question or answer aloud.</span>
                <div className="flex items-end gap-1 ml-2">
                  {waveformHeights.map((height, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-500 rounded-full transition-all duration-50 ease-out"
                      style={{
                        height: isVoiceActive ? `${height}px` : '4px',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 items-center md:flex-row md:gap-2 md:justify-start w-full">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <div className="w-full flex md:hidden">
                <div className="grid grid-cols-4 gap-2 w-full">
                  <Button
                    type="button"
                    variant={isRecording ? "default" : "outline"}
                    size="sm"
                    onClick={handleVoiceRecording}
                    disabled={!recognition}
                    className="flex flex-col items-center justify-center h-10"
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    <span className="text-xs">{isRecording ? "Stop" : "Dictate"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex flex-col items-center justify-center h-10"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    <span className="text-xs">Upload</span>
                  </Button>
                                  <Button
                  type="button"
                  variant={showMathKeyboard ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowMathKeyboard(!showMathKeyboard)
                    setShowCalculator(false)
                  }}
                  className="flex flex-col items-center justify-center h-10"
                >
                  <Sigma className="h-4 w-4" />
                  <span className="text-xs">Math Keyboard</span>
                </Button>
                <Button
                  type="button"
                  variant={showCalculator ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowCalculator(!showCalculator)
                    setShowMathKeyboard(false)
                  }}
                  className="flex flex-col items-center justify-center h-10"
                >
                  <CalculatorIcon className="h-4 w-4" />
                  <span className="text-xs">Calculator</span>
                </Button>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Button
                  type="button"
                  variant={isRecording ? "default" : "outline"}
                  size="sm"
                  onClick={handleVoiceRecording}
                  disabled={!recognition}
                  className="flex items-center gap-2 h-9 md:h-8"
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  <span>{isRecording ? "Stop Recording" : "Dictate"}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 h-9 md:h-8"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  <span>Upload Image</span>
                </Button>
                <Button
                  type="button"
                  variant={showMathKeyboard ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowMathKeyboard(!showMathKeyboard)
                    setShowCalculator(false)
                  }}
                  className="flex items-center gap-2 h-9 md:h-8"
                >
                  <Sigma className="h-4 w-4" />
                  <span>Math Keyboard</span>
                </Button>
                <Button
                  type="button"
                  variant={showCalculator ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowCalculator(!showCalculator)
                    setShowMathKeyboard(false)
                  }}
                  className="flex items-center gap-2 h-9 md:h-8"
                >
                  <CalculatorIcon className="h-4 w-4" />
                  <span>Calculator</span>
                </Button>
                              </div>
              </div>
              <div className="text-xs text-muted-foreground ml-2 hidden md:block">
                <ul className="list-disc list-inside space-y-1">
                  <li>Press Enter to send</li>
                  <li>Shift+Enter for new line</li>
                  <li>Ctrl+Shift+M for voice</li>
                </ul>
              </div>
          </form>
        </div>
      </Card>

      {showMathKeyboard && (
        <MathKeyboard onInsert={handleMathSymbolInsert} onClose={() => setShowMathKeyboard(false)} />
      )}
      {showCalculator && <Calculator onClose={() => setShowCalculator(false)} onFocusChange={handleCalculatorFocusChange} />}
    </div>
  )
}