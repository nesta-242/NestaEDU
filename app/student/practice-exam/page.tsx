"use client"

import { useState, useEffect } from "react"
import { capitalizeSubject } from "@/lib/utils"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  TrendingUp,
  Clock,
  Target,
  Calculator,
  Beaker,
  Atom,
  Dna,
  FlaskConical,
  Microscope,
  Stethoscope,
  History,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

interface ExamResult {
  id: string
  subject: string
  score: number
  maxScore: number
  totalQuestions: number
  timeSpent: number
  date: string
  percentage: number
  feedback?: string
  answers?: any
}

interface DetailedExamResult extends ExamResult {
  questionResults?: {
    questionId: number
    userAnswer: string
    isCorrect: boolean
    pointsEarned: number
    maxPoints: number
    feedback: string
    correctAnswer?: string
  }[]
  examData?: {
    questions: {
      id: number
      question: string
      type: string
      options?: string[]
      correctAnswer: string
      points: number
    }[]
  }
}

export default function PracticeExamPage() {
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [selectedExam, setSelectedExam] = useState<DetailedExamResult | null>(null)
  const [isLoadingExam, setIsLoadingExam] = useState(false)
  const [activeTab, setActiveTab] = useState("new-exam")

  // Function to map route parameter subjects to display names
  const getSubjectDisplayName = (subjectRoute: string) => {
    const subjectMap: { [key: string]: string } = {
      'bjc-math': 'BJC Mathematics',
      'bjc-general-science': 'BJC General Science',
      'bjc-health-science': 'BJC Health Science',
      'bgcse-math': 'BGCSE Mathematics',
      'bgcse-chemistry': 'BGCSE Chemistry',
      'bgcse-physics': 'BGCSE Physics',
      'bgcse-biology': 'BGCSE Biology',
      'bgcse-combined-science': 'BGCSE Combined Science'
    }
    return subjectMap[subjectRoute] || subjectRoute
  }

  useEffect(() => {
    const loadExamResults = async () => {
      try {
        // Check cache first
        const cachedData = sessionStorage.getItem('examResultsCache')
        const cacheTimestamp = sessionStorage.getItem('examResultsCacheTimestamp')
        const now = Date.now()
        const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp) : Infinity
        
        // Use cache if it's less than 5 minutes old
        if (cachedData && cacheAge < 5 * 60 * 1000) {
          console.log('Using cached exam results')
          const cachedResults = JSON.parse(cachedData)
          setExamResults(cachedResults)
        }
        
        // Always fetch fresh data in background
        const response = await fetch('/api/exam-results')
        if (response.ok) {
          const results = await response.json()
          const examResults = results.map((result: any) => ({
            id: result.id,
            subject: getSubjectDisplayName(result.subject), // Convert route parameter to display name
            score: result.score,
            maxScore: result.max_score, // Map from snake_case
            percentage: result.percentage,
            totalQuestions: result.total_questions, // Map from snake_case
            timeSpent: result.time_spent || 0, // Map from snake_case
            date: result.created_at, // Map from snake_case
            feedback: result.feedback,
          }))
          
          // Update cache
          sessionStorage.setItem('examResultsCache', JSON.stringify(examResults))
          sessionStorage.setItem('examResultsCacheTimestamp', now.toString())
          
          setExamResults(examResults)
        } else {
          console.error('Failed to fetch exam results:', response.status)
          if (!cachedData) {
            setExamResults([])
          }
        }
      } catch (error) {
        console.error('Error loading exam results:', error)
        if (!sessionStorage.getItem('examResultsCache')) {
          setExamResults([])
        }
      }
    }
    
    loadExamResults()
    
    // Listen for exam updates
    const handleExamUpdate = () => {
      console.log('Exam update event received, refreshing exam results...')
      loadExamResults()
    }
    
    window.addEventListener("examCompleted", handleExamUpdate)
    
    return () => {
      window.removeEventListener("examCompleted", handleExamUpdate)
    }
  }, [])

  const loadDetailedExam = async (examId: string) => {
    console.log('Loading detailed exam for ID:', examId)
    setIsLoadingExam(true)
    try {
      const response = await fetch(`/api/exam-results/${examId}`)
      console.log('API response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Detailed exam result:', result)
        
        // Map the API response to the expected structure
        const mappedResult: DetailedExamResult = {
          id: result.id,
          subject: getSubjectDisplayName(result.subject),
          score: result.score,
          maxScore: result.max_score, // Map from snake_case
          percentage: result.percentage,
          totalQuestions: result.total_questions, // Map from snake_case
          timeSpent: result.time_spent || 0, // Map from snake_case
          date: result.created_at, // Map from snake_case
          feedback: result.feedback,
          questionResults: result.questionResults || [],
          examData: result.examData || null
        }
        
        // Extract exam data from answers field if available
        if (result.answers && typeof result.answers === 'object') {
          const answersData = result.answers as any
          if (answersData.examData) {
            mappedResult.examData = answersData.examData
          }
        }
        
        console.log('Mapped result:', mappedResult)
        setSelectedExam(mappedResult)
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch detailed exam result:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error loading detailed exam result:', error)
    } finally {
      setIsLoadingExam(false)
    }
  }

  const examTypes = [
    {
      id: "bjc-math",
      title: "BJC Mathematics",
      description: "Fundamental mathematics concepts for middle school level",
      questions: 15,
      timeLimit: 30,
      topics: ["Basic Algebra", "Geometry", "Fractions & Decimals", "Statistics"],
      gradient: "from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-950/40",
      border: "border-blue-200 dark:border-blue-800",
      iconBg: "bg-blue-500",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      icon: Calculator,
    },
    {
      id: "bjc-general-science",
      title: "BJC General Science",
      description: "Core general science concepts for middle school level",
      questions: 15,
      timeLimit: 30,
      topics: ["Basic Biology", "Chemistry", "Physics", "Earth Science"],
      gradient: "from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-950/40",
      border: "border-green-200 dark:border-green-800",
      iconBg: "bg-green-500",
      buttonColor: "bg-green-600 hover:bg-green-700",
      icon: Beaker,
    },
    {
      id: "bjc-health-science",
      title: "BJC Health Science",
      description: "Health and medical science concepts for middle school level",
      questions: 15,
      timeLimit: 30,
      topics: ["Human Anatomy", "Health & Nutrition", "Disease Prevention", "Medical Basics"],
      gradient: "from-pink-50 to-pink-100 dark:from-pink-950/20 dark:to-pink-950/40",
      border: "border-pink-200 dark:border-pink-800",
      iconBg: "bg-pink-500",
      buttonColor: "bg-pink-600 hover:bg-pink-700",
      icon: Stethoscope,
    },
    {
      id: "bgcse-math",
      title: "BGCSE Mathematics",
      description: "Advanced mathematics for high school and BGCSE preparation",
      questions: 25,
      timeLimit: 45,
      topics: ["Calculus", "Trigonometry", "Advanced Algebra", "Probability"],
      gradient: "from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-950/40",
      border: "border-purple-200 dark:border-purple-800",
      iconBg: "bg-purple-500",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      icon: Calculator,
    },
    {
      id: "bgcse-chemistry",
      title: "BGCSE Chemistry",
      description: "Advanced chemistry topics for BGCSE preparation",
      questions: 25,
      timeLimit: 45,
      topics: ["Organic Chemistry", "Chemical Bonding", "Thermodynamics", "Electrochemistry"],
      gradient: "from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-950/40",
      border: "border-orange-200 dark:border-orange-800",
      iconBg: "bg-orange-500",
      buttonColor: "bg-orange-600 hover:bg-orange-700",
      icon: FlaskConical,
    },
    {
      id: "bgcse-physics",
      title: "BGCSE Physics",
      description: "Advanced physics concepts for BGCSE preparation",
      questions: 25,
      timeLimit: 45,
      topics: ["Mechanics", "Electricity & Magnetism", "Waves", "Modern Physics"],
      gradient: "from-cyan-50 to-cyan-100 dark:from-cyan-950/20 dark:to-cyan-950/40",
      border: "border-cyan-200 dark:border-cyan-800",
      iconBg: "bg-cyan-500",
      buttonColor: "bg-cyan-600 hover:bg-cyan-700",
      icon: Atom,
    },
    {
      id: "bgcse-biology",
      title: "BGCSE Biology",
      description: "Advanced biology topics for BGCSE preparation",
      questions: 25,
      timeLimit: 45,
      topics: ["Cell Biology", "Genetics", "Ecology", "Human Physiology"],
      gradient: "from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800",
      iconBg: "bg-emerald-500",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700",
      icon: Dna,
    },
    {
      id: "bgcse-combined-science",
      title: "BGCSE Combined Science",
      description: "Integrated science topics covering biology, chemistry, and physics",
      questions: 25,
      timeLimit: 45,
      topics: ["Integrated Biology", "Integrated Chemistry", "Integrated Physics", "Scientific Method"],
      gradient: "from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-950/40",
      border: "border-indigo-200 dark:border-indigo-800",
      iconBg: "bg-indigo-500",
      buttonColor: "bg-indigo-600 hover:bg-indigo-700",
      icon: Microscope,
    },
  ]

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>
    if (percentage >= 60) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Good</Badge>
    return <Badge className="bg-red-100 text-red-800 border-red-200">Needs Improvement</Badge>
  }

  const renderNewExamTab = () => (
    <div className="space-y-8">
      {/* How It Works Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">How Practice Exams Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold">1. Choose Your Subject</h3>
              <p className="text-sm text-muted-foreground">
                Select from BJC (Middle School) or BGCSE (High School) level exams across multiple subjects
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold">2. Take the Exam</h3>
              <p className="text-sm text-muted-foreground">
                Answer AI-generated questions tailored to the official curriculum standards
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold">3. Get Results</h3>
              <p className="text-sm text-muted-foreground">
                Receive detailed feedback and explanations to help you improve
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Options */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {examTypes.map((exam) => {
          const IconComponent = exam.icon
          return (
            <Card
              key={exam.id}
              className={`${exam.gradient} ${exam.border} hover:shadow-lg transition-all duration-200 flex flex-col h-full border-2`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`${exam.iconBg} p-3 rounded-lg shadow-sm`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl">{exam.title}</CardTitle>
                <CardDescription className="text-gray-600">{exam.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{exam.questions}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Questions</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{exam.timeLimit}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Minutes</div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2 dark:text-gray-200">Topics Covered:</h4>
                  <div className="flex flex-wrap gap-2">
                    {exam.topics.map((topic) => (
                      <Badge
                        key={topic}
                        variant="secondary"
                        className="bg-muted/50 text-gray-700 dark:text-gray-300"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/30">
                  <Link href={`/student/practice-exam/${exam.id}`}>
                    <Button size="lg" className={`w-full text-white ${exam.buttonColor}`}>
                      Start Practice Exam
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  const renderPastExamsTab = () => {
    console.log('Rendering past exams tab:', {
      examResultsLength: examResults.length,
      isLoadingExam,
      selectedExam: !!selectedExam
    })
    
    return (
      <div className="space-y-6">
        {examResults.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Past Exams Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't taken any practice exams yet. Start with a new exam to see your results here.
              </p>
              <Button onClick={() => setActiveTab("new-exam")}>
                Take Your First Exam
              </Button>
            </CardContent>
          </Card>
        ) : isLoadingExam ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <p className="text-muted-foreground">Loading exam details...</p>
            </CardContent>
          </Card>
        ) : selectedExam ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => setSelectedExam(null)}
                className="flex items-center gap-2"
              >
                ← Back to Past Exams
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Exam Results: {capitalizeSubject(selectedExam.subject)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-primary">
                    {selectedExam.score}/{selectedExam.maxScore}
                  </div>
                  <div className="text-2xl font-semibold text-green-600">{selectedExam.percentage}%</div>
                  <Badge variant={selectedExam.percentage >= 70 ? "default" : "secondary"} className="mt-2">
                    {selectedExam.percentage >= 90
                      ? "Excellent"
                      : selectedExam.percentage >= 80
                        ? "Good"
                        : selectedExam.percentage >= 70
                          ? "Satisfactory"
                          : "Needs Improvement"}
                  </Badge>
                  <p className="text-muted-foreground mt-4">{selectedExam.feedback}</p>
                </div>
              </CardContent>
            </Card>

            {selectedExam.questionResults && selectedExam.questionResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Question-by-Question Review</CardTitle>
                  <CardDescription>Detailed feedback for each question</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedExam.questionResults.map((result, index) => {
                    // Find the original question
                    const originalQuestion = selectedExam.examData?.questions?.find(q => q.id === result.questionId)
                    
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
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {examResults.map((result) => (
              <Card
                key={result.id}
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => loadDetailedExam(result.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{result.subject}</CardTitle>
                    {getPerformanceBadge(result.percentage)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Score:</span>
                      <span className="font-medium">
                        {result.score}/{result.totalQuestions}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Percentage:</span>
                      <span className="font-medium">{result.percentage}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Time:</span>
                      <span className="font-medium">{result.timeSpent} min</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Date:</span>
                      <span>{new Date(result.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-hidden w-full">
      <div className="flex justify-center gap-4 mt-4 mb-6">
        <Button
          variant={activeTab === "new-exam" ? "default" : "outline"}
          size="lg"
          className="flex items-center gap-2 px-6 py-3"
          onClick={() => setActiveTab("new-exam")}
        >
          <span role="img" aria-label="New Exam">🆕</span> New Exam
        </Button>
        <Button
          variant={activeTab === "past-exams" ? "default" : "outline"}
          size="lg"
          className="flex items-center gap-2 px-6 py-3"
          onClick={() => setActiveTab("past-exams")}
        >
          <span role="img" aria-label="Past Exams">📜</span> Past Exams ({examResults.length})
        </Button>
      </div>
      <div className="mt-6">
        {activeTab === "new-exam" && renderNewExamTab()}
        {activeTab === "past-exams" && renderPastExamsTab()}
      </div>
    </div>
  )
}
