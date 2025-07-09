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

interface ChatSession {
  id: string
  subject: string
  topic: string
  title: string
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
  topicsExplored: number
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
  console.log("DashboardPage mounted");
  const [stats, setStats] = useState<DashboardStats & { examsThisWeek: number; sessionsThisWeek: number; weeklyChatActivity: number[]; weeklyExamActivity: number[] }>(
    {
      learningSessions: 0,
      topicsExplored: 0,
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

  useEffect(() => {
    console.log("Dashboard useEffect running");
    const fetchUser = async () => {
      const res = await fetch('/api/auth/me')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setUserProfile(data.user)

      // Load dashboard data (chatHistory, examResults) from localStorage
      try {
        let chatHistory: ChatSession[] = JSON.parse(localStorage.getItem("chatHistory") || "[]")
        let examResults: ExamResult[] = JSON.parse(localStorage.getItem("examResults") || "[]")

        if (!Array.isArray(chatHistory)) chatHistory = []
        if (!Array.isArray(examResults)) examResults = []

        const learningSessions = chatHistory.length
        const uniqueTopics = new Set(chatHistory.map((session) => `${session.subject}-${session.topic}`))
        const topicsExplored = uniqueTopics.size
        const recentSessions = chatHistory
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5)
        const practiceExams = examResults.length
        const averageScore =
          examResults.length > 0
            ? Math.round(examResults.reduce((sum, exam) => sum + exam.percentage, 0) / examResults.length)
            : 0
        // Calculate weekly activity for chat sessions and exams
        const weeklyChatActivity = Array(7).fill(0)
        const weeklyExamActivity = Array(7).fill(0)
        const now = new Date()
        chatHistory.forEach((session) => {
          try {
            const sessionDate = new Date(session.timestamp)
            const daysDiff = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
            if (daysDiff < 7 && daysDiff >= 0) {
              weeklyChatActivity[6 - daysDiff]++
            }
          } catch (e) {}
        })
        examResults.forEach((exam) => {
          try {
            const examDate = new Date(exam.date)
            const daysDiff = Math.floor((now.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24))
            if (daysDiff < 7 && daysDiff >= 0) {
              weeklyExamActivity[6 - daysDiff]++
            }
          } catch (e) {}
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
        if (activityDates.size > 0) {
          // Find the most recent activity date
          const sortedDates = Array.from(activityDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          lastSessionDate = sortedDates[0]
          // Start from today, count back consecutive days with activity, but only if today has activity
          let streakDate = new Date()
          let firstDay = true
          while (true) {
            const dayStr = streakDate.toISOString().slice(0, 10)
            if (activityDates.has(dayStr)) {
              // Only count today if there is activity today
              currentStreak++
              streakDate.setDate(streakDate.getDate() - 1)
              firstDay = false
            } else {
              // If it's the first day (today) and no activity, don't start a streak
              if (firstDay) {
                break
              } else {
                // For previous days, break the streak if no activity
                break
              }
            }
          }
        }
        let improvementTrend: 'up' | 'down' | 'stable' = 'stable'
        if (chatHistory.length >= 4) {
          try {
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
        const startOfWeek = new Date()
        startOfWeek.setHours(0, 0, 0, 0)
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()) // Sunday as start
        const examsThisWeek = examResults.filter(exam => {
          try {
            const d = new Date(exam.date)
            return d >= startOfWeek
          } catch {
            return false
          }
        }).length
        // Calculate number of chat sessions this week
        const sessionsThisWeek = chatHistory.filter(session => {
          try {
            const d = new Date(session.timestamp)
            return d >= startOfWeek
          } catch {
            return false
          }
        }).length
        setStats({
          learningSessions,
          topicsExplored,
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
        setStats({
          learningSessions: 0,
          topicsExplored: 0,
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
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
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
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.currentStreak}</div>
            <p className="text-xs text-muted-foreground">days of learning</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sessionsThisWeek}</div>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Exams</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.examsThisWeek}</div>
            <p className="text-xs text-muted-foreground">taken this week</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exam Average</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.practiceExams > 0 ? `${stats.practiceExams} exams taken` : 'No exams yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Continue Learning
          </CardTitle>
          <CardDescription>
            {getDaysSinceLastSession() === null 
              ? "Start your learning journey with the AI tutor" 
              : getDaysSinceLastSession() === 0 
                ? "You learned today! Keep the momentum going" 
                : `It's been ${getDaysSinceLastSession()} day${getDaysSinceLastSession() === 1 ? '' : 's'} since your last session`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Quick Start Options</h4>
              <div className="space-y-2">
                <Link href="/student/tutor?subject=math">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Math Practice
                  </Button>
                </Link>
                <Link href="/student/tutor?subject=science">
                  <Button variant="outline" className="w-full justify-start">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Science Concepts
                  </Button>
                </Link>
                <Link href="/student/practice-exam">
                  <Button variant="outline" className="w-full justify-start">
                    <Award className="h-4 w-4 mr-2" />
                    Practice Exam
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Learning Insights</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Learning Trend</span>
                  <Badge variant={stats.improvementTrend === 'up' ? 'default' : stats.improvementTrend === 'down' ? 'destructive' : 'secondary'}>
                    {stats.improvementTrend === 'up' ? '↗ Improving' : stats.improvementTrend === 'down' ? '↘ Declining' : '→ Stable'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Most Active Subject</span>
                  <span className="font-medium">
                    {stats.subjectDistribution.length > 0 
                      ? stats.subjectDistribution[0].subject 
                      : 'None yet'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Best Exam Score</span>
                  <span className="font-medium">
                    {stats.examResults.length > 0 
                      ? `${Math.max(...stats.examResults.map(e => e.percentage))}%` 
                      : 'No exams yet'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group">
                      <div className="flex-1">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{session.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {session.subject}
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
                        <p className="font-medium text-sm capitalize">{exam.subject}</p>
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
            Weekly Activity
          </CardTitle>
          <CardDescription>
            <span className="inline-block w-3 h-3 bg-blue-500 rounded mr-1 align-middle"></span> Learning Sessions
            <span className="inline-block w-3 h-3 bg-purple-500 rounded ml-4 mr-1 align-middle"></span> Practice Exams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-24 w-full">
            {Array.from({ length: 7 }).map((_, i) => (
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
                <span className="text-xs text-muted-foreground mt-1 truncate">
                  {(() => {
                    const d = new Date()
                    d.setDate(d.getDate() - (6 - i))
                    return d.toLocaleDateString(undefined, { weekday: 'short' })
                  })()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
