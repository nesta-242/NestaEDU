"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  BookOpen, 
  Brain, 
  Clock, 
  TrendingUp, 
  Award, 
  Target, 
  CheckCircle, 
  XCircle, 
  Play, 
  Calendar,
  Zap,
  Lightbulb,
  BarChart3,
  ArrowRight,
  Plus,
  MessageSquare
} from "lucide-react"
import Link from "next/link"
import { capitalizeSubject } from "@/lib/utils"

interface ChatSession {
  id: string
  subject: string
  topic: string
  title: string
  lastMessage: string
  timestamp: string
  messageCount: number
}

interface ExamResult {
  id: string
  subject: string
  score: number
  maxScore: number
  totalQuestions: number
  percentage: number
  date: string
}

interface DashboardStats {
  learningSessions: number
  recentSessions: ChatSession[]
  practiceExams: number
  averageScore: number
  weeklyActivity: number[]
  subjectDistribution: { subject: string; count: number }[]
  examResults: ExamResult[]
  currentStreak: number
  lastSessionDate: string | null
  improvementTrend: 'up' | 'down' | 'stable'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats & { examsThisWeek: number; sessionsThisWeek: number; weeklyChatActivity: number[]; weeklyExamActivity: number[] }>(
    {
      learningSessions: 0,
      recentSessions: [],
      practiceExams: 0,
      averageScore: 0,
      weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
      subjectDistribution: [],
      examResults: [],
      currentStreak: 0,
      lastSessionDate: null,
      improvementTrend: 'stable',
      examsThisWeek: 0,
      sessionsThisWeek: 0,
      weeklyChatActivity: [0, 0, 0, 0, 0, 0, 0],
      weeklyExamActivity: [0, 0, 0, 0, 0, 0, 0],
    }
  )
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAllExams, setShowAllExams] = useState(false)
  const router = useRouter()

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


  // Helper function to get the current week's date range (Sunday to Saturday)
  const getCurrentWeekRange = () => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday
    endOfWeek.setHours(23, 59, 59, 999)
    
    return { startOfWeek, endOfWeek }
  }

  // Helper function to format date range for display
  const getWeekRangeDisplay = () => {
    const { startOfWeek, endOfWeek } = getCurrentWeekRange()
    const formatDate = (date: Date) => {
      const month = date.toLocaleDateString('en-US', { month: 'long' })
      const day = date.getDate()
      const suffix = getDaySuffix(day)
      return { month, day, suffix }
    }
    const startDate = formatDate(startOfWeek)
    const endDate = formatDate(endOfWeek)
    return { startDate, endDate }
  }

  // Helper function to get day suffix (1st, 2nd, 3rd, etc.)
  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return 'th'
    switch (day % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  // Helper function to get day of week index (0 = Sunday, 6 = Saturday)
  const getDayOfWeekIndex = (date: Date) => {
    return date.getDay()
  }

  // Helper function to check if a date is within the current week
  const isDateInCurrentWeek = (date: Date) => {
    const { startOfWeek, endOfWeek } = getCurrentWeekRange()
    return date >= startOfWeek && date <= endOfWeek
  }

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/auth/me')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setUserProfile(data.user)
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch chat sessions from database
        const chatRes = await fetch('/api/chat-sessions')
        let chatHistory: ChatSession[] = []
        if (chatRes.ok) {
          const sessions = await chatRes.json()
          chatHistory = sessions.map((session: any) => ({
            id: session.id,
            subject: session.subject,
            topic: session.topic || '',
            title: session.title || 'Conversation',
            lastMessage: session.last_message || '',
            timestamp: session.updated_at,
            messageCount: session.message_count || 0,
          }))
        }

        // Fetch exam results from database
        const examRes = await fetch('/api/exam-results')
        let examResults: ExamResult[] = []
        if (examRes.ok) {
          const results = await examRes.json()
          examResults = results.map((result: any) => ({
            id: result.id,
            subject: getSubjectDisplayName(result.subject), // Convert route parameter to display name
            score: result.score,
            maxScore: result.max_score,
            percentage: result.percentage,
            totalQuestions: result.total_questions,
            timeSpent: result.time_spent || 0,
            date: result.created_at,
          }))
        }

        const learningSessions = chatHistory.length
        const recentSessions = chatHistory
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
        const practiceExams = examResults.length
        const averageScore =
          examResults.length > 0
            ? Math.round(examResults.reduce((sum, exam) => sum + exam.percentage, 0) / examResults.length)
            : 0

        // Calculate weekly activity for current week (Sunday to Saturday)
        const weeklyChatActivity = Array(7).fill(0)
        const weeklyExamActivity = Array(7).fill(0)
        const { startOfWeek, endOfWeek } = getCurrentWeekRange()

        // Process chat sessions for current week
        chatHistory.forEach((session) => {
          try {
            const sessionDate = new Date(session.timestamp)
            if (isDateInCurrentWeek(sessionDate)) {
              const dayIndex = getDayOfWeekIndex(sessionDate)
              weeklyChatActivity[dayIndex]++
            }
          } catch (e) {
            console.error('Error processing chat session date:', e)
          }
        })

        // Process exam results for current week
        examResults.forEach((exam) => {
          try {
            const examDate = new Date(exam.date)
            if (isDateInCurrentWeek(examDate)) {
              const dayIndex = getDayOfWeekIndex(examDate)
              weeklyExamActivity[dayIndex]++
            }
          } catch (e) {
            console.error('Error processing exam date:', e)
          }
        })

        const subjectCount: { [key: string]: number } = {}
        chatHistory.forEach((session) => {
          if (session.subject) {
            subjectCount[session.subject] = (subjectCount[session.subject] || 0) + 1
          }
        })
        const subjectDistribution = Object.entries(subjectCount).map(([subject, count]) => ({
          subject,
          count,
        }))
        
        // Collect all unique days with activity (chat session or exam)
        const activityDates = new Set<string>()
        chatHistory.forEach((session) => {
          try {
            const d = new Date(session.timestamp)
            activityDates.add(d.toISOString().slice(0, 10))
          } catch (e) {}
        })
        examResults.forEach((exam) => {
          try {
            const d = new Date(exam.date)
            activityDates.add(d.toISOString().slice(0, 10))
          } catch (e) {}
        })
        let currentStreak = 0
        let lastSessionDate = null
        const sortedDates = Array.from(activityDates).sort().reverse()
        for (let i = 0; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i])
          const expectedDate = new Date()
          expectedDate.setDate(expectedDate.getDate() - i)
          expectedDate.setHours(0, 0, 0, 0)
          
          if (currentDate.toISOString().slice(0, 10) === expectedDate.toISOString().slice(0, 10)) {
            currentStreak++
            if (i === 0) {
              lastSessionDate = sortedDates[i]
            }
          } else {
            break
          }
        }
        let improvementTrend: 'up' | 'down' | 'stable' = 'stable'
        if (chatHistory.length >= 4) {
          try {
            const now = new Date()
            const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
            const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
            const recentSessions = chatHistory.filter(session => {
              try {
                return new Date(session.timestamp) >= twoWeeksAgo
              } catch (e) {
                return false
              }
            }).length
            const previousSessions = chatHistory.filter(session => {
              try {
                const sessionDate = new Date(session.timestamp)
                return sessionDate >= fourWeeksAgo && sessionDate < twoWeeksAgo
              } catch (e) {
                return false
              }
            }).length
            if (recentSessions > previousSessions) improvementTrend = 'up'
            else if (recentSessions < previousSessions) improvementTrend = 'down'
          } catch (e) {}
        }
        
        // Calculate number of practice exams taken this week
        const examsThisWeek = examResults.filter(exam => {
          try {
            const d = new Date(exam.date)
            return isDateInCurrentWeek(d)
          } catch {
            return false
          }
        }).length
        
        // Calculate number of chat sessions this week
        const sessionsThisWeek = chatHistory.filter(session => {
          try {
            const d = new Date(session.timestamp)
            return isDateInCurrentWeek(d)
          } catch {
            return false
          }
        }).length
        
        setStats({
          learningSessions,
          recentSessions,
          practiceExams,
          averageScore,
          weeklyActivity: weeklyChatActivity,
          weeklyChatActivity,
          weeklyExamActivity,
          subjectDistribution,
          examResults,
          currentStreak,
          lastSessionDate,
          improvementTrend,
          examsThisWeek,
          sessionsThisWeek,
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setStats({
          learningSessions: 0,
          recentSessions: [],
          practiceExams: 0,
          averageScore: 0,
          weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
          subjectDistribution: [],
          examResults: [],
          currentStreak: 0,
          lastSessionDate: null,
          improvementTrend: 'stable',
          examsThisWeek: 0,
          sessionsThisWeek: 0,
          weeklyChatActivity: [0, 0, 0, 0, 0, 0, 0],
          weeklyExamActivity: [0, 0, 0, 0, 0, 0, 0],
        })
      }
    }

    // Initial data fetch
    fetchUser()
    fetchDashboardData().finally(() => setIsLoading(false))

    // Listen for chat session updates
    const handleChatSessionUpdate = () => {
      fetchDashboardData()
    }

    window.addEventListener("chatSessionUpdated", handleChatSessionUpdate)

    return () => {
      window.removeEventListener("chatSessionUpdated", handleChatSessionUpdate)
    }
  }, [router])

  const getUserInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase()
    }
    return "YU"
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  const getStudentName = () => {
    if (userProfile?.firstName) {
      return userProfile.firstName
    }
    return "Student"
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 80) return "text-blue-600"
    if (percentage >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStreakMessage = () => {
    if (stats.currentStreak === 0) return "Start your learning streak today!"
    if (stats.currentStreak === 1) return "Great start! Keep it going!"
    if (stats.currentStreak < 7) return `${stats.currentStreak} day streak! You're building momentum!`
    if (stats.currentStreak < 30) return `${stats.currentStreak} day streak! You're on fire!`
    return `${stats.currentStreak} day streak! You're unstoppable!`
  }

  const getDaysSinceLastSession = () => {
    if (!stats.lastSessionDate) return null
    const lastSession = new Date(stats.lastSessionDate)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header with Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={userProfile?.avatar || ""} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  {getGreeting()}, {userProfile?.firstName ? userProfile.firstName : "Student"}!
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">{getStreakMessage()}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0">
              <Link href="/student/tutor">
                <Button className="flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5">
                  <MessageSquare className="h-4 w-4" />
                  Start Learning
                </Button>
              </Link>
              <Link href="/student/practice-exam">
                <Button variant="outline" className="flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5">
                  <Award className="h-4 w-4" />
                  Take Exam
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics - Focused on Learning Momentum */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow active:scale-95 md:active:scale-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              {stats.currentStreak === 0 ? "Start today!" : "days in a row"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow active:scale-95 md:active:scale-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tutoring Sessions This Week</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sessionsThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              {stats.learningSessions} total tutoring sessions
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow active:scale-95 md:active:scale-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Exams This Week</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.examsThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              {stats.practiceExams} total practice exams
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow active:scale-95 md:active:scale-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.practiceExams} exams taken
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Sessions - Enhanced */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Sessions
                </CardTitle>
                <CardDescription>Click to continue any conversation</CardDescription>
              </div>
              <Link href="/student/tutor">
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentSessions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentSessions.map((session) => (
                  <Link key={session.id} href={`/student/tutor?resume=${session.id}`}>
                    <div className="flex items-center justify-between p-4 md:p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group active:bg-muted active:scale-98">
                      <div className="flex-1">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{session.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {capitalizeSubject(session.subject)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{session.messageCount} messages</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No sessions yet</p>
                <p className="text-xs text-muted-foreground">Start your first conversation!</p>
                <Link href="/student/tutor">
                  <Button variant="outline" size="sm" className="mt-2">
                    Start Learning
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exam Performance - Enhanced */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Exam Performance
                </CardTitle>
                <CardDescription>Your recent practice results</CardDescription>
              </div>
              <Link href="/student/practice-exam">
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.examResults.length > 0 ? (
              <div className="space-y-3">
                {(showAllExams ? stats.examResults : stats.examResults.slice(0, 4)).map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getScoreIcon(exam.percentage)}
                      <div>
                        <p className="font-medium text-sm">{capitalizeSubject(exam.subject)}</p>
                        <p className="text-xs text-muted-foreground">
                          {exam.score}/{exam.maxScore} points
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-sm ${getScoreColor(exam.percentage)}`}>{exam.percentage}%</span>
                      <p className="text-xs text-muted-foreground">{new Date(exam.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {stats.examResults.length > 4 && (
                  <div className="text-center pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAllExams(!showAllExams)}
                    >
                      {showAllExams ? `Show Less` : `View All (${stats.examResults.length})`}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No exams taken yet</p>
                <p className="text-xs text-muted-foreground">Test your knowledge!</p>
                <Link href="/student/practice-exam">
                  <Button variant="outline" size="sm" className="mt-2">
                    Take First Exam
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Activity This Week
          </CardTitle>
          <CardDescription>
            <span className="inline-block w-3 h-3 bg-blue-500 rounded mr-1 align-middle"></span> Learning Sessions
            <span className="inline-block w-3 h-3 bg-purple-500 rounded ml-4 mr-1 align-middle"></span> Practice Exams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-24 w-full">
            {(() => {
              // Get the dates for the current week (Sunday to Saturday)
              const { startOfWeek } = getCurrentWeekRange();
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              return days.map((day, i) => {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                const label = `${day} (${date.getMonth() + 1}/${date.getDate()})`;
                return (
                  <div key={i} className="flex flex-col items-center flex-1 min-w-0">
                    {/* Stacked bar: chat (bottom, blue), exam (top, purple) */}
                    <div className="flex flex-col-reverse h-20 w-full">
                      <div
                        className="bg-blue-500 rounded-t"
                        style={{ height: `${(stats.weeklyChatActivity?.[i] || 0) * 12}px`, minHeight: 2 }}
                        title={`Learning Sessions: ${stats.weeklyChatActivity?.[i] || 0}`}
                      />
                      <div
                        className="bg-purple-500 rounded-b"
                        style={{ height: `${(stats.weeklyExamActivity?.[i] || 0) * 12}px`, minHeight: 2 }}
                        title={`Practice Exams: ${stats.weeklyExamActivity?.[i] || 0}`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 truncate flex flex-col items-center">
                      <span className="block sm:inline">{day}</span>
                      <span className="block sm:inline">{date.getMonth() + 1}/{date.getDate()}</span>
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
