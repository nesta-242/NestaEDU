"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
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
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [showMathKeyboard, setShowMathKeyboard] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [activeTextArea, setActiveTextArea] = useState<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    generateExam()
  }, [subject])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (examStarted && timeRemaining > 0 && !showResults) {
      timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000)
    } else if (timeRemaining === 0 && examStarted && !showResults) {
      handleSubmitExam()
    }
    return () => clearTimeout(timer)
  }, [timeRemaining, examStarted, showResults])

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

  // Reset exam state when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      // Reset exam state when leaving the exam page
      setExamStarted(false)
      setShowResults(false)
    }
  }, [setExamStarted, setShowResults])



  const getExamInfo = () => {
    switch (subject) {
      case "bjc-math":
        return {
          title: "BJC Mathematics",
          level: "BJC",
          subject: "Mathematics",
          timeLimit: 30,
          description: "Middle School level mathematics covering basic algebra, geometry, and arithmetic",
        }
      case "bjc-general-science":
        return {
          title: "BJC General Science",
          level: "BJC",
          subject: "General Science",
          timeLimit: 30,
          description: "Middle School level general science covering biology, chemistry, physics, and earth science",
        }
      case "bjc-health-science":
        return {
          title: "BJC Health Science",
          level: "BJC",
          subject: "Health Science",
          timeLimit: 30,
          description: "Middle School level health science covering anatomy, nutrition, and health education",
        }
      case "bgcse-math":
        return {
          title: "BGCSE Mathematics",
          level: "BGCSE",
          subject: "Mathematics",
          timeLimit: 45,
          description: "High School level mathematics including calculus, trigonometry, and advanced algebra",
        }
      case "bgcse-chemistry":
        return {
          title: "BGCSE Chemistry",
          level: "BGCSE",
          subject: "Chemistry",
          timeLimit: 45,
          description: "High School level chemistry covering organic chemistry, chemical bonding, and thermodynamics",
        }
      case "bgcse-physics":
        return {
          title: "BGCSE Physics",
          level: "BGCSE",
          subject: "Physics",
          timeLimit: 45,
          description: "High School level physics covering mechanics, electricity, magnetism, and modern physics",
        }
      case "bgcse-biology":
        return {
          title: "BGCSE Biology",
          level: "BGCSE",
          subject: "Biology",
          timeLimit: 45,
          description: "High School level biology covering cell biology, genetics, ecology, and human physiology",
        }
      case "bgcse-combined-science":
        return {
          title: "BGCSE Combined Science",
          level: "BGCSE",
          subject: "Combined Science",
          timeLimit: 45,
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

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) return prev // Stop at 90% until actual completion
        return prev + Math.random() * 15 + 5 // Increment by 5-20%
      })
    }, 300)

    try {
      console.log("Generating exam for subject:", subject)

      const response = await fetch("/api/generate-exam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subject,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Exam data received:", data)

      if (data.error) {
        throw new Error(data.error)
      }

      // Complete the progress bar
      setLoadingProgress(100)
      
      // Small delay to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 200))

      setExamData(data)
      const examInfo = getExamInfo()
      setTimeRemaining(examInfo.timeLimit * 60) // Convert minutes to seconds

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
      toast({
        title: "Error",
        description: "Failed to generate exam. Please try again.",
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setIsLoading(false)
      setLoadingProgress(0)
    }
  }

  const handleAnswerChange = (questionId: number, answer: string) => {
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

  const handleSubmitExam = async () => {
    if (!examData) return

    const unansweredQuestions = examData.questions.filter((q) => !answers[q.id] || answers[q.id].trim() === "")

    if (unansweredQuestions.length > 0) {
      toast({
        title: "Incomplete Exam",
        description: `Please answer all questions before submitting. ${unansweredQuestions.length} questions remaining.`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log("Submitting exam for grading...")

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const results = await response.json()
      console.log("Grading results received:", results)

      if (results.error) {
        throw new Error(results.error)
      }

      setExamResults(results)
      setShowResults(true)

      if (results.isMock) {
        toast({
          title: "Mock Grading Complete",
          description: results.mockMessage || "Using automated grading - OpenAI unavailable",
          variant: "destructive",
          duration: 5000,
        })
      } else {
        toast({
          title: "Exam Graded",
          description: `Score: ${results.totalScore}/${results.maxScore} (${results.percentage}%)`,
          duration: 5000,
        })
      }

      // Save results to localStorage for dashboard
      const examResult = {
        id: `exam_${Date.now()}`,
        subject: getExamInfo().title,
        score: results.totalScore,
        maxScore: results.maxScore,
        percentage: results.percentage,
        totalQuestions: examData.questions.length,
        timeSpent: Math.round((getExamInfo().timeLimit * 60 - timeRemaining) / 60),
        date: new Date().toISOString(),
      }

      const savedResults = JSON.parse(localStorage.getItem("examResults") || "[]")
      savedResults.unshift(examResult) // Add to beginning for most recent first
      localStorage.setItem("examResults", JSON.stringify(savedResults.slice(0, 20))) // Keep only last 20 results

      console.log("Saved exam result to localStorage:", examResult)
    } catch (error) {
      console.error("Error grading exam:", error)
      toast({
        title: "Error",
        description: "Failed to grade exam. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const startExam = () => {
    setExamStarted(true)
    toast({
      title: "Exam Started",
      description: `You have ${getExamInfo().timeLimit} minutes to complete the exam. Good luck!`,
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

  const formatTime = (seconds: number) => {
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
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                    <div 
                      className="absolute top-0 left-0 w-16 h-16 border-4 border-primary rounded-full"
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + (loadingProgress / 100) * 50}% 0%, ${50 + (loadingProgress / 100) * 50}% ${50 - (loadingProgress / 100) * 50}%, 50% 50%)`
                      }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-medium">{Math.round(loadingProgress)}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-medium">Generating your {examInfo.title} practice exam...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Creating personalized questions using AI - this may take a moment
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(loadingProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {loadingProgress < 30 && "Analyzing subject requirements..."}
                  {loadingProgress >= 30 && loadingProgress < 60 && "Generating questions..."}
                  {loadingProgress >= 60 && loadingProgress < 90 && "Creating answer options..."}
                  {loadingProgress >= 90 && loadingProgress < 100 && "Finalizing exam..."}
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
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Exam Results</h1>
            <p className="text-muted-foreground">{examInfo.title} Practice Exam Results</p>
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
              <p className="text-muted-foreground mt-4">{examResults.feedback}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question-by-Question Review</CardTitle>
            <CardDescription>Detailed feedback for each question</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {examResults.questionResults.map((result, index) => (
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
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Question {result.questionId}</h4>
                      <Badge variant="outline">
                        {result.pointsEarned}/{result.maxPoints} points
                      </Badge>
                    </div>
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
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={generateExam} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Take Another {examInfo.title} Exam
          </Button>
          <Button onClick={() => router.push("/student/practice-exam")}>Choose Different Exam</Button>
          <Button onClick={() => router.push("/student/dashboard")}>Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  const currentQ = examData.questions[currentQuestion]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{examInfo.title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestion + 1} of {examData.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-lg font-mono">
            <Clock className="h-5 w-5" />
            <span className={timeRemaining < 300 ? "text-red-600" : ""}>{formatTime(timeRemaining)}</span>
          </div>
          <Button onClick={generateExam} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            New Questions
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>
            {getAnsweredCount()}/{examData.questions.length} answered
          </span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
      </div>

      {/* Current question */}
      {currentQ && (
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
                    >
                      <Sigma className="h-4 w-4" />
                      Math Keyboard
                    </Button>
                    <Button
                      onClick={() => setShowCalculator(!showCalculator)}
                      variant={showCalculator ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-2"
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
                />

                {/* Math Tools for Short Answer */}
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowMathKeyboard(!showMathKeyboard)}
                      variant={showMathKeyboard ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Sigma className="h-4 w-4" />
                      Math Keyboard
                    </Button>
                    <Button
                      onClick={() => setShowCalculator(!showCalculator)}
                      variant={showCalculator ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-2"
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
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.min(examData.questions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === examData.questions.length - 1}
          >
            Next
          </Button>
        </div>

        <Button
          onClick={handleSubmitExam}
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

      {/* Question navigation grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Question Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
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
                className="h-10"
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Math Tools - positioned at bottom */}
      {showMathKeyboard && (
        <MathKeyboard onInsert={handleMathSymbolInsert} onClose={() => setShowMathKeyboard(false)} />
      )}

      {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}
    </div>
  )
}
