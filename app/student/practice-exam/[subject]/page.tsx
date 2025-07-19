"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useExamContext } from "@/contexts/exam-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  AlertCircle,
  FileText,
  Send,
  RefreshCw,
  ArrowLeft,
  Clock,
  CalculatorIcon,
  Sigma,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { MathKeyboard } from "@/components/math-keyboard"
import { Calculator } from "@/components/calculator"

interface Question {
  id: number
  type: "multiple-choice" | "short-answer"
  question: string
  options?: string[]
  correctAnswer?: string
  points: number
}

interface ExamData {
  title: string
  duration: number
  totalPoints: number
  questions: Question[]
}

interface ExamResults {
  totalScore: number
  maxScore: number
  percentage: number
  feedback: string
  questionResults: {
    questionId: number
    userAnswer: string
    isCorrect: boolean
    pointsEarned: number
    maxPoints: number
    feedback: string
    correctAnswer?: string
  }[]
}

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const subject = params.subject as string

  const { examStarted, showResults, setExamStarted, setShowResults } = useExamContext()
  const [examData, setExamData] = useState<ExamData | null>(null)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [examResults, setExamResults] = useState<ExamResults | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [showMathKeyboard, setShowMathKeyboard] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [activeTextArea, setActiveTextArea] = useState<HTMLTextAreaElement | null>(null)
  // Add state for user first name
  const [firstName, setFirstName] = useState<string>("Student")
  // Add state to track time expiration submission
  const [isTimeExpired, setIsTimeExpired] = useState(false)
  // Add ref to store the progress toast for time expiration
  const timeExpiredToastRef = useRef<any>(null)
  // Add state for grading progress
  const [gradingProgress, setGradingProgress] = useState(0)
  const [isGrading, setIsGrading] = useState(false)
  
  // Add flag to prevent state restoration conflicts
  const [hasInitialized, setHasInitialized] = useState(false)

  // Persist exam state to prevent timer resets on re-renders
  useEffect(() => {
    if (hasInitialized) return // Don't restore if already initialized
    
    const savedState = localStorage.getItem(`exam-state-${subject}`)
    if (savedState) {
      try {
        const state = JSON.parse(savedState)
        if (state.examStarted && !state.showResults && state.timeRemaining > 0) {
          console.log("Restoring exam state from localStorage:", state)
          setExamStarted(state.examStarted)
          setTimeRemaining(state.timeRemaining)
          setCurrentQuestion(state.currentQuestion || 0)
          setAnswers(state.answers || {})
          setIsTimeExpired(state.isTimeExpired || false)
        }
      } catch (error) {
        console.error("Error parsing saved exam state:", error)
        localStorage.removeItem(`exam-state-${subject}`)
      }
    }
    setHasInitialized(true)
  }, [subject, hasInitialized]) // Add hasInitialized to dependencies

  // Save exam state to localStorage
  useEffect(() => {
    if (examStarted) {
      const stateToSave = {
        examStarted,
        timeRemaining,
        currentQuestion,
        answers,
        isTimeExpired,
        showResults
      }
      localStorage.setItem(`exam-state-${subject}`, JSON.stringify(stateToSave))
    } else {
      localStorage.removeItem(`exam-state-${subject}`)
    }
  }, [examStarted, timeRemaining, currentQuestion, answers, isTimeExpired, showResults, subject])

  // Debug logging for timer state changes
  useEffect(() => {
    console.log("Timer state changed:", {
      examStarted,
      timeRemaining,
      showResults,
      isTimeExpired,
      subject
    })
  }, [examStarted, timeRemaining, showResults, isTimeExpired, subject])

  // Load user first name from API or localStorage
  useEffect(() => {
    const fetchFirstName = async () => {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const user = await res.json()
          if (user.firstName) {
            setFirstName(user.firstName)
            localStorage.setItem('userFirstName', user.firstName)
            return
          }
        }
        // fallback to localStorage if API fails
        const saved = localStorage.getItem('userFirstName')
        if (saved) setFirstName(saved)
      } catch {
        const saved = localStorage.getItem('userFirstName')
        if (saved) setFirstName(saved)
      }
    }
    fetchFirstName()
  }, [])

  useEffect(() => {
    generateExam()
  }, [subject])

  useEffect(() => {
    let timer: NodeJS.Timeout
    
    console.log("Timer effect - examStarted:", examStarted, "timeRemaining:", timeRemaining, "showResults:", showResults, "isTimeExpired:", isTimeExpired)
    
    // Only start timer if exam is started, timeRemaining is not null, greater than 0, and not showing results
    if (examStarted && timeRemaining !== null && timeRemaining > 0 && !showResults && !isTimeExpired) {
      console.log("Starting timer countdown from:", timeRemaining)
      timer = setTimeout(() => {
        // Prevent setting to null or negative values
        const newTime = Math.max(0, timeRemaining - 1)
        console.log("Timer tick - setting timeRemaining to:", newTime)
        setTimeRemaining(newTime)
      }, 1000)
    } 
    // Only trigger expiration if exam is started, timeRemaining is exactly 0, not showing results, and not already expired
    else if (examStarted && timeRemaining === 0 && !showResults && !isTimeExpired) {
      console.log("Timer expired! Setting isTimeExpired to true")
      setIsTimeExpired(true)
      
      // Start grading progress immediately
      setIsGrading(true)
      setGradingProgress(0)
      
      // Small delay to ensure toast appears before submission
      setTimeout(() => {
        console.log("Calling handleSubmitExam with timeExpired=true")
        handleSubmitExam(true)
      }, 100)
    }
    
    return () => {
      if (timer) {
        console.log("Clearing timer")
        clearTimeout(timer)
      }
    }
  }, [timeRemaining, examStarted, showResults, isTimeExpired])

  // Handle browser navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examStarted && !showResults) {
        e.preventDefault()
        e.returnValue = "If you leave this page, your exam progress will be lost. Are you sure you want to exit?"
        return "If you leave this page, your exam progress will be lost. Are you sure you want to exit?"
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [examStarted, showResults])

  // Reset exam state only when component unmounts (not on re-renders)
  useEffect(() => {
    return () => {
      // Only reset exam state when actually leaving the exam page
      // This prevents resetting during re-renders
      console.log("Component unmounting - resetting exam state")
      setExamStarted(false)
      setShowResults(false)
      // Clear localStorage when component unmounts
      localStorage.removeItem(`exam-state-${subject}`)
    }
  }, []) // Empty dependency array - only run on actual unmount



  const getExamInfo = () => {
    switch (subject) {
      case "bjc-math":
        return {
          title: "BJC Mathematics",
          level: "BJC",
          subject: "Mathematics",
          timeLimit: 15,
          description: "Middle School level mathematics covering basic algebra, geometry, and arithmetic",
        }
      case "bjc-general-science":
        return {
          title: "BJC General Science",
          level: "BJC",
          subject: "General Science",
          timeLimit: 15,
          description: "Middle School level general science covering biology, chemistry, physics, and earth science",
        }
      case "bjc-health-science":
        return {
          title: "BJC Health Science",
          level: "BJC",
          subject: "Health Science",
          timeLimit: 15,
          description: "Middle School level health science covering anatomy, nutrition, and health education",
        }
      case "bgcse-math":
        return {
          title: "BGCSE Mathematics",
          level: "BGCSE",
          subject: "Mathematics",
          timeLimit: 25,
          description: "High School level mathematics including calculus, trigonometry, and advanced algebra",
        }
      case "bgcse-chemistry":
        return {
          title: "BGCSE Chemistry",
          level: "BGCSE",
          subject: "Chemistry",
          timeLimit: 25,
          description: "High School level chemistry covering organic chemistry, chemical bonding, and thermodynamics",
        }
      case "bgcse-physics":
        return {
          title: "BGCSE Physics",
          level: "BGCSE",
          subject: "Physics",
          timeLimit: 25,
          description: "High School level physics covering mechanics, electricity, magnetism, and modern physics",
        }
      case "bgcse-biology":
        return {
          title: "BGCSE Biology",
          level: "BGCSE",
          subject: "Biology",
          timeLimit: 25,
          description: "High School level biology covering cell biology, genetics, ecology, and human physiology",
        }
      case "bgcse-combined-science":
        return {
          title: "BGCSE Combined Science",
          level: "BGCSE",
          subject: "Combined Science",
          timeLimit: 25,
          description: "Integrated science covering biology, chemistry, and physics concepts",
        }
      default:
        return {
          title: "Practice Exam",
          level: "Unknown",
          subject: "Unknown",
          timeLimit: 30,
          description: "Practice examination",
        }
    }
  }

  const generateExam = async () => {
    setIsLoading(true)
    setLoadingProgress(0)
    setAnswers({})
    setCurrentQuestion(0)
    setExamResults(null)
    setShowResults(false)
    setExamStarted(false)
    setIsTimeExpired(false)
    setHasInitialized(false) // Reset initialization flag for new exam
    
    // Clear any existing exam state from localStorage
    localStorage.removeItem(`exam-state-${subject}`)

    const startTime = Date.now()
    const estimatedDuration = 6000 // Reduced to 6 seconds for more realistic timing

    // Start with initial progress
    setLoadingProgress(10)

    let progressInterval: NodeJS.Timeout | null = null

    try {
      // Create a progress interval that estimates real progress based on time elapsed
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const estimatedProgress = Math.min((elapsed / estimatedDuration) * 80, 80) // Go up to 80%
        setLoadingProgress(Math.max(10, estimatedProgress))
      }, 150) // Faster updates for smoother progress

      const response = await fetch("/api/generate-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subject,
        }),
      })

      // Clear the progress interval since we're done
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Smooth transition to completion
      setLoadingProgress(90)
      await new Promise(resolve => setTimeout(resolve, 100))
      setLoadingProgress(100)
      
      // Brief delay to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 200))

      setExamData(data)
      const examInfo = getExamInfo()
      // Don't set timer here - it will be set when exam starts
      setTimeRemaining(null) // Initialize to null until exam starts

      if (data.isMock) {
        toast({
          title: "Mock Exam Generated",
          description: data.mockMessage || "Using sample questions - OpenAI unavailable",
          variant: "destructive",
          duration: 5000,
        })
      } else {
        toast({
          title: "Exam Generated",
          description: `New ${examInfo.title} exam ready with ${data.questions?.length || 0} questions`,
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error generating exam:", error)
      // Clear any existing progress interval
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      toast({
        title: "Error",
        description: "Failed to generate exam. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Ensure loading state is properly reset
      setIsLoading(false)
      // Don't reset progress to 0 immediately to avoid glitch
      setTimeout(() => setLoadingProgress(0), 100)
    }
  }

  const handleAnswerChange = (questionId: number, answer: string) => {
    if (isTimeExpired || isSubmitting) {
      console.log("Answer change blocked - exam is locked")
      return
    }
    console.log("Answer change allowed - setting answer for question", questionId)
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleMathSymbolInsert = (symbol: string) => {
    if (activeTextArea) {
      const start = activeTextArea.selectionStart
      const end = activeTextArea.selectionEnd
      const currentValue = activeTextArea.value
      const newValue = currentValue.substring(0, start) + symbol + currentValue.substring(end)

      // Find the question ID for this textarea
      const questionId = Number.parseInt(activeTextArea.dataset.questionId || "0")
      if (questionId) {
        handleAnswerChange(questionId, newValue)

        // Set cursor position after inserted symbol
        setTimeout(() => {
          activeTextArea.focus()
          activeTextArea.setSelectionRange(start + symbol.length, start + symbol.length)
        }, 0)
      }
    }
  }

  const handleTextAreaFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setActiveTextArea(event.target)
  }

  const handleCalculatorFocusChange = (hasFocus: boolean) => {
    if (!hasFocus && activeTextArea) {
      // When calculator is closed or loses focus, focus the last active textarea
      setTimeout(() => {
        activeTextArea?.focus()
      }, 100)
    }
  }

  const handleSubmitExam = useCallback(async (isTimeExpired = false) => {
    if (!examData) return

    const unansweredQuestions = examData.questions.filter((q) => !answers[q.id] || answers[q.id].trim() === "")

    if (unansweredQuestions.length > 0 && !isTimeExpired) {
      toast({
        title: "Incomplete Exam",
        description: `Please answer all questions before submitting. ${unansweredQuestions.length} questions remaining.`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Start grading progress if not already started
    if (!isGrading) {
      setIsGrading(true)
      setGradingProgress(0)
    }
    
    const totalQuestions = examData.questions.length
    let currentProgress = 0

    // Simulate progress updates during grading
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5 // Increment by 5-20%
      if (currentProgress < 90) {
        setGradingProgress(currentProgress)
      }
    }, 800)

    try {
      const response = await fetch("/api/grade-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examData,
          answers,
        }),
      })

      // Clear the progress interval
      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const results = await response.json()

      if (results.error) {
        throw new Error(results.error)
      }

      // Complete grading progress
      setGradingProgress(100)
      setIsGrading(false)

      setExamResults(results)
      setShowResults(true)
      
      // Clear localStorage when exam is completed
      localStorage.removeItem(`exam-state-${subject}`)

      // Save results to database
      const examResult = {
        subject: subject, // Use the route parameter instead of the full title
        score: results.totalScore,
        maxScore: results.maxScore,
        percentage: results.percentage,
        totalQuestions: examData.questions.length,
        timeSpent: Math.round((getExamInfo().timeLimit * 60 - (timeRemaining || 0)) / 60),
        answers: {
          userAnswers: answers,
          questionResults: results.questionResults,
          examData: examData
        },
        feedback: results.feedback,
      }

      const saveResponse = await fetch('/api/exam-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(examResult),
      })

      if (saveResponse.ok) {
        console.log("Saved exam result to database")
        // Dispatch event to update dashboard and other listeners
        window.dispatchEvent(new Event("chatSessionUpdated"))
        // Dispatch event to update exam results count
        window.dispatchEvent(new Event("examCompleted"))
      } else {
        console.error("Failed to save exam result to database")
      }
    } catch (error) {
      console.error("Error grading exam:", error)
      
      // Clear the progress interval if it exists
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      
      // Show error toast and stop grading
      toast({
        title: "Grading Failed",
        description: "Failed to grade exam. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
      
      // Stop grading progress
      setIsGrading(false)
    } finally {
      setIsSubmitting(false)
    }
  }, [examData, answers, subject, timeRemaining, toast, setIsGrading, setGradingProgress, setExamResults, setShowResults])

  const startExam = () => {
    console.log("Starting exam - setting examStarted to true")
    setExamStarted(true)
    setHasInitialized(true) // Mark as initialized to prevent state restoration conflicts
    const examInfo = getExamInfo()
    // Set proper exam duration in seconds
    const examTimeInSeconds = examInfo.timeLimit * 60
    console.log("Setting timeRemaining to:", examTimeInSeconds, "seconds (", examInfo.timeLimit, "minutes)")
    setTimeRemaining(examTimeInSeconds)
    toast({
      title: "Exam Started",
      description: `You have ${examInfo.timeLimit} minutes to complete the exam. Good luck!`,
      duration: 3000,
    })
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).filter((key) => answers[Number.parseInt(key)]?.trim()).length
  }

  const getProgressPercentage = () => {
    if (!examData) return 0
    return (getAnsweredCount() / examData.questions.length) * 100
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const examInfo = getExamInfo()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                {/* Removed circular percentage indicator */}
                <div>
                  <p className="text-lg font-medium">Generating your {examInfo.title} practice exam...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Creating personalized questions using AI - this may take a moment
                  </p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Progress</span>
                  <span className="font-semibold text-primary">{Math.round(loadingProgress)}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ 
                      width: `${loadingProgress}%`,
                      background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    {/* Animated shimmer effect */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                        transform: 'translateX(-100%)',
                        animation: 'shimmer 1.5s infinite'
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {loadingProgress < 20 && "Initializing exam generation..."}
                  {loadingProgress >= 20 && loadingProgress < 40 && "Analyzing subject requirements..."}
                  {loadingProgress >= 40 && loadingProgress < 60 && "Generating personalized questions..."}
                  {loadingProgress >= 60 && loadingProgress < 80 && "Creating answer options and explanations..."}
                  {loadingProgress >= 80 && loadingProgress < 95 && "Finalizing exam structure..."}
                  {loadingProgress >= 95 && loadingProgress < 100 && "Preparing your exam..."}
                  {loadingProgress === 100 && "Exam ready!"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Failed to Load Exam
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We couldn't generate your practice exam. This might be due to a temporary issue.
            </p>
            <div className="flex gap-2">
              <Button onClick={generateExam} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Link href="/student/practice-exam">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Practice Exams
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!examStarted && examData.questions.length > 0) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-4">
            <Button 
              variant="outline" 
              onClick={() => router.push("/student/practice-exam")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Practice Exams
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{examInfo.title}</CardTitle>
            <CardDescription>{examInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{examData.questions.length}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{examInfo.timeLimit}</div>
                <div className="text-sm text-muted-foreground">Minutes</div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Instructions:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Answer all questions to the best of your ability</li>
                <li>You have {examInfo.timeLimit} minutes to complete the exam</li>
                <li>
                  Multiple choice questions are worth{" "}
                  {examData.questions.find((q) => q.type === "multiple-choice")?.points || 6} points each
                </li>
                <li>
                  Short answer questions are worth{" "}
                  {examData.questions.find((q) => q.type === "short-answer")?.points || 8} points each
                </li>
                <li>You can navigate between questions using the navigation buttons</li>
                <li>Use the math keyboard and calculator tools for mathematical expressions</li>
                <li>Submit your exam when finished or when time runs out</li>
              </ul>
            </div>

            <Button onClick={startExam} size="lg" className="w-full">
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showResults && examResults) {
    // Personalize the feedback by addressing the student directly
    // Replace generic feedback with a message to the student
    let personalizedFeedback = examResults.feedback
    if (personalizedFeedback) {
      // Enhanced personalization to speak directly to the student
      personalizedFeedback = personalizedFeedback
        // Replace template variables with actual first name
        .replace(/\$\{firstName\}/g, firstName)
        .replace(/\$\[firstName\]/g, firstName)
        // Replace third-person references with direct address
        .replace(/\bThe student\b/gi, firstName)
        .replace(/\bthe student\b/gi, firstName)
        .replace(/\bStudent\b/gi, firstName)
        .replace(/\bstudent\b/gi, firstName)
        .replace(/\bTheir\b/gi, "Your")
        .replace(/\btheir\b/gi, "your")
        .replace(/\bThey\b/gi, "You")
        .replace(/\bthey\b/gi, "you")
        .replace(/\bHis\b/gi, "Your")
        .replace(/\bhis\b/gi, "your")
        .replace(/\bHer\b/gi, "Your")
        .replace(/\bher\b/gi, "your")
        .replace(/\bHe\b/gi, "You")
        .replace(/\bhe\b/gi, "you")
        .replace(/\bShe\b/gi, "You")
        .replace(/\bshe\b/gi, "you")
        // Improve overall feedback structure
        .replace(/\bOverall,\b/gi, `${firstName},`)
        .replace(/\bOverall\b/gi, `${firstName}`)
        .replace(/\bYour performance\b/gi, `${firstName}, your performance`)
        .replace(/^You /, `${firstName}, you `)
        // Add direct address patterns
        .replace(/\bperformed well\b/gi, "did well")
        .replace(/\bdemonstrated\b/gi, "you demonstrated")
        .replace(/\bshowed\b/gi, "you showed")
        .replace(/\bneeds improvement\b/gi, "you can improve")
        .replace(/\bneeds to work on\b/gi, "you should work on")
        .replace(/\bshould focus on\b/gi, "you should focus on")
        .replace(/\battention to detail is needed\b/gi, "you need to pay more attention to detail")
        .replace(/\bunderstanding of\b/gi, "your understanding of")
        .replace(/\bknowledge of\b/gi, "your knowledge of")
        .replace(/\bconcepts\b/gi, "concepts")
        .replace(/\bareas\b/gi, "areas")
        .replace(/\bparticularly in\b/gi, "especially in")
        .replace(/\bHowever,\b/gi, "However, ${firstName},")
        .replace(/\bBut\b/gi, "But ${firstName},")
        .replace(/\bIn conclusion,\b/gi, `${firstName},`)
        .replace(/\bTo summarize,\b/gi, `${firstName},`)
    }
    
    // Personalize individual question feedback
    const personalizedQuestionResults = examResults.questionResults.map(result => ({
      ...result,
      feedback: result.feedback
        .replace(/\bThe student\b/gi, "You")
        .replace(/\bthe student\b/gi, "you")
        .replace(/\bStudent\b/gi, "You")
        .replace(/\bstudent\b/gi, "you")
        .replace(/\bTheir\b/gi, "Your")
        .replace(/\btheir\b/gi, "your")
        .replace(/\bThey\b/gi, "You")
        .replace(/\bthey\b/gi, "you")
        .replace(/\bHis\b/gi, "Your")
        .replace(/\bhis\b/gi, "your")
        .replace(/\bHer\b/gi, "Your")
        .replace(/\bher\b/gi, "your")
        .replace(/\bHe\b/gi, "You")
        .replace(/\bhe\b/gi, "you")
        .replace(/\bShe\b/gi, "You")
        .replace(/\bshe\b/gi, "you")
        .replace(/\bcorrectly applied\b/gi, "you correctly applied")
        .replace(/\bproperly used\b/gi, "you properly used")
        .replace(/\bunderstood\b/gi, "you understood")
        .replace(/\bcalculated\b/gi, "you calculated")
        .replace(/\bsolved\b/gi, "you solved")
        .replace(/\bidentified\b/gi, "you identified")
        .replace(/\bexplained\b/gi, "you explained")
        .replace(/\bdescribed\b/gi, "you described")
        .replace(/\bneeds to\b/gi, "you need to")
        .replace(/\bshould\b/gi, "you should")
        .replace(/\bcould\b/gi, "you could")
        .replace(/\bwould\b/gi, "you would")
        .replace(/\bwill\b/gi, "you will")
        .replace(/\bcan\b/gi, "you can")
        .replace(/\bmay\b/gi, "you may")
        .replace(/\bmight\b/gi, "you might")
        .replace(/\bCorrect\.\b/gi, "Correct! ")
        .replace(/\bIncorrect\.\b/gi, "Incorrect. ")
        .replace(/\bGood work!\b/gi, "Great job! ")
        .replace(/\bExcellent!\b/gi, "Excellent work! ")
        .replace(/\bWell done!\b/gi, "Well done! ")
    }))
    
    return (
      <div className="space-y-6 max-w-4xl mx-auto px-2 pt-6 sm:pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-tight mb-1">Exam Results</h1>
            <p className="text-muted-foreground text-base leading-snug">{examInfo.title} Practice Exam Results</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateExam} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Take New Exam
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push("/student/practice-exam")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Exams
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">
                {examResults.totalScore}/{examResults.maxScore}
              </div>
              <div className="text-2xl font-semibold text-green-600">{examResults.percentage}%</div>
              <Badge variant={examResults.percentage >= 70 ? "default" : "secondary"} className="mt-2">
                {examResults.percentage >= 90
                  ? "Excellent"
                  : examResults.percentage >= 80
                    ? "Good"
                    : examResults.percentage >= 70
                      ? "Satisfactory"
                      : "Needs Improvement"}
              </Badge>
              <p className="text-muted-foreground mt-4">{personalizedFeedback}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question-by-Question Review</CardTitle>
            <CardDescription>Detailed feedback for each question</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {personalizedQuestionResults.map((result, index) => {
              // Find the original question
              const originalQuestion = examData.questions.find(q => q.id === result.questionId)
              return (
                <div key={result.questionId} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-1 rounded-full ${
                        result.isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {result.isCorrect ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Question {result.questionId}</h4>
                        <Badge variant="outline">
                          {result.pointsEarned}/{result.maxPoints} points
                        </Badge>
                      </div>
                      
                      {/* Original Question */}
                      {originalQuestion && (
                        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Original Question:</p>
                          <p className="text-sm">{originalQuestion.question}</p>
                          {originalQuestion.type === "multiple-choice" && originalQuestion.options && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Options:</p>
                              <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                                {originalQuestion.options.map((option, optIndex) => (
                                  <li key={optIndex}>{option}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Your answer:</strong> {result.userAnswer || "No answer provided"}
                      </p>
                      {!result.isCorrect && result.correctAnswer && (
                        <p className="text-sm text-green-600 mb-2">
                          <strong>Correct answer:</strong> {result.correctAnswer}
                        </p>
                      )}
                      <p className="text-sm">{result.feedback}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button onClick={generateExam} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Take Another {examInfo.title} Exam
          </Button>
          <Button onClick={() => router.push("/student/practice-exam")} className="w-full sm:w-auto">Choose Different Exam</Button>
          <Button onClick={() => router.push("/student/dashboard")} className="w-full sm:w-auto">Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  const currentQ = examData.questions[currentQuestion]

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-2 pt-6 sm:pt-10 exam-container">
      {/* Header with progress */}
      <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{examInfo.title}</h1>
                <p className="text-muted-foreground">
                  Question {currentQuestion + 1} of {examData.questions.length}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center justify-center gap-2 text-lg font-mono bg-muted/50 rounded-lg px-3 py-2">
                  <Clock className="h-5 w-5" />
                  <span className={timeRemaining !== null && timeRemaining < 300 ? "text-red-600" : ""}>{formatTime(timeRemaining)}</span>
                </div>
                <Button onClick={generateExam} variant="outline" size="sm" className="w-full sm:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  New Questions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar and Question Navigation */}
      <div className="space-y-2 exam-content">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>
            {getAnsweredCount()}/{examData.questions.length} answered
          </span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
        
        {/* Question Navigation - Desktop */}
        <div className="hidden md:flex gap-1 mt-3 question-nav">
          {examData.questions.map((_, index) => (
            <Button
              key={index}
              variant={
                currentQuestion === index
                  ? "default"
                  : answers[examData.questions[index].id]?.trim()
                    ? "secondary"
                    : "outline"
              }
              size="sm"
              onClick={() => setCurrentQuestion(index)}
              disabled={isTimeExpired || isSubmitting}
              className={`flex-1 h-6 text-xs px-1 min-w-0 ${
                currentQuestion === index
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                  : answers[examData.questions[index].id]?.trim()
                    ? "bg-gray-700 hover:bg-gray-800 text-white border-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 dark:border-gray-600"
                    : ""
              }`}
            >
              {index + 1}
            </Button>
          ))}
        </div>
        
        {/* Question Navigation - Mobile */}
        <div className="md:hidden space-y-2 mt-3 question-nav">
          {/* First row - 12 questions */}
          <div className="flex gap-1">
            {examData.questions.slice(0, 12).map((_, index) => (
              <Button
                key={index}
                variant={
                  currentQuestion === index
                    ? "default"
                    : answers[examData.questions[index].id]?.trim()
                      ? "secondary"
                      : "outline"
                }
                size="sm"
                onClick={() => setCurrentQuestion(index)}
                disabled={isTimeExpired || isSubmitting}
                className={`flex-1 h-6 text-xs px-1 min-w-0 ${
                  currentQuestion === index
                    ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    : answers[examData.questions[index].id]?.trim()
                      ? "bg-gray-700 hover:bg-gray-800 text-white border-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 dark:border-gray-600"
                      : ""
                }`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
          
          {/* Second row - remaining questions (13 for BGCSE, fewer for BJC) */}
          {examData.questions.length > 12 && (
            <div className="flex gap-1">
              {examData.questions.slice(12).map((_, index) => {
                const actualIndex = index + 12
                return (
                  <Button
                    key={actualIndex}
                    variant={
                      currentQuestion === actualIndex
                        ? "default"
                        : answers[examData.questions[actualIndex].id]?.trim()
                          ? "secondary"
                          : "outline"
                    }
                    size="sm"
                    onClick={() => setCurrentQuestion(actualIndex)}
                    disabled={isTimeExpired || isSubmitting}
                    className={`flex-1 h-6 text-xs px-1 min-w-0 ${
                      currentQuestion === actualIndex
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        : answers[examData.questions[actualIndex].id]?.trim()
                          ? "bg-gray-700 hover:bg-gray-800 text-white border-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 dark:border-gray-600"
                          : ""
                    }`}
                  >
                    {actualIndex + 1}
                  </Button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Current question */}
      {currentQ && (
        <div className="exam-content">
        <>

          
          {/* Grading Progress Bar */}
          {isGrading && (
            <div className="bg-red-50/50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/50 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-semibold">Time's Up! Submitting & Grading Your Exam...</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                    <span>Progress</span>
                    <span>{Math.round(gradingProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700">
                                      <div 
                    className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ 
                      width: `${gradingProgress}%`,
                      background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
                      boxShadow: '0 0 6px rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    {/* Animated shimmer effect */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                        transform: 'translateX(-100%)',
                        animation: 'shimmer 1.5s infinite'
                      }}
                    ></div>
                  </div>
                  </div>
                  <div className="text-xs text-red-500 dark:text-red-400">
                    {gradingProgress < 20 && "Analyzing your answers..."}
                    {gradingProgress >= 20 && gradingProgress < 40 && "Processing questions..."}
                    {gradingProgress >= 40 && gradingProgress < 60 && "Evaluating responses..."}
                    {gradingProgress >= 60 && gradingProgress < 80 && "Calculating scores..."}
                    {gradingProgress >= 80 && gradingProgress < 100 && "Finalizing results..."}
                    {gradingProgress >= 100 && "Grading complete!"}
                  </div>
                </div>
              </div>
            </div>
          )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Question {currentQuestion + 1}
              <Badge variant="outline">{currentQ.points} points</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">{currentQ.question}</p>

            {currentQ.type === "multiple-choice" && currentQ.options ? (
              <div className="space-y-4">
                <RadioGroup
                  value={answers[currentQ.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
                  disabled={isTimeExpired || isSubmitting}
                >
                  {currentQ.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {/* Math Tools for Multiple Choice */}
                <div className="flex flex-col gap-3 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowMathKeyboard(!showMathKeyboard)}
                      variant={showMathKeyboard ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={isTimeExpired || isSubmitting}
                    >
                      <Sigma className="h-4 w-4" />
                      Math Keyboard
                    </Button>
                    <Button
                      onClick={() => setShowCalculator(!showCalculator)}
                      variant={showCalculator ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={isTimeExpired || isSubmitting}
                    >
                      <CalculatorIcon className="h-4 w-4" />
                      Calculator
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    💡 Use the calculator for computations and math keyboard for reference
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your answer here... Provide detailed explanations for full credit."
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                  onFocus={handleTextAreaFocus}
                  data-question-id={currentQ.id}
                  className="min-h-[120px]"
                  disabled={isTimeExpired || isSubmitting}
                />

                {/* Math Tools for Short Answer */}
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowMathKeyboard(!showMathKeyboard)}
                      variant={showMathKeyboard ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={isTimeExpired || isSubmitting}
                    >
                      <Sigma className="h-4 w-4" />
                      Math Keyboard
                    </Button>
                    <Button
                      onClick={() => setShowCalculator(!showCalculator)}
                      variant={showCalculator ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={isTimeExpired || isSubmitting}
                    >
                      <CalculatorIcon className="h-4 w-4" />
                      Calculator
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    💡 Use the math keyboard for symbols and the calculator for computations
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </>
        </div>
      )}

      {/* Navigation */}
      <div className="exam-content">
        {/* Mobile: Stacked layout */}
        <div className="md:hidden space-y-3 mobile-nav-buttons">
          {/* Question Navigation */}
          <div className="flex gap-2 justify-center exam-navigation">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0 || isTimeExpired || isSubmitting}
              className="flex-1"
            >
              Previous
            </Button>
            <Button
              // Highlighted: black in light mode, white in dark mode
              className="flex-1 bg-black text-white dark:bg-white dark:text-black border-black dark:border-white border"
              onClick={() => setCurrentQuestion(Math.min(examData.questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === examData.questions.length - 1 || isTimeExpired || isSubmitting}
            >
              Next
            </Button>
          </div>

          {/* Submit Button */}
          <Button
            onClick={() => handleSubmitExam(false)}
            disabled={isSubmitting || getAnsweredCount() < examData.questions.length}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Grading Exam...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Exam ({getAnsweredCount()}/{examData.questions.length})
              </>
            )}
          </Button>


        </div>

        {/* Desktop: Original horizontal layout */}
        <div className="hidden md:flex items-center justify-between exam-navigation">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0 || isTimeExpired || isSubmitting}
            >
              Previous
            </Button>
            <Button
              // Highlighted: black in light mode, white in dark mode
              className="bg-black text-white dark:bg-white dark:text-black border-black dark:border-white border"
              onClick={() => setCurrentQuestion(Math.min(examData.questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === examData.questions.length - 1 || isTimeExpired || isSubmitting}
            >
              Next
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmitExam(false)}
              disabled={isSubmitting || getAnsweredCount() < examData.questions.length}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Grading Exam...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Exam ({getAnsweredCount()}/{examData.questions.length})
                </>
              )}
            </Button>
            

          </div>
        </div>
      </div>



      {/* Math Tools - positioned at bottom */}
      <div className="exam-content">
        {showMathKeyboard && (
          <MathKeyboard onInsert={handleMathSymbolInsert} onClose={() => setShowMathKeyboard(false)} />
        )}

        {showCalculator && <Calculator onClose={() => setShowCalculator(false)} onFocusChange={handleCalculatorFocusChange} />}
      </div>
    </div>
  )
}
