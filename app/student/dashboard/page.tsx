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
  MessageSquare,
  FlaskConical
} from "lucide-react"
import Link from "next/link"
import { capitalizeSubject } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { getAvatarUrl, getAvatarKey, forceAvatarRefresh } from "@/lib/utils"

interface ChatSession {
  id: string
  subject: string
  topic: string
  title: string
  last_message: string
  updated_at: string
  message_count: number
}

interface ExamResult {
  id: string
  subject: string
  score: number
  max_score: number
  total_questions: number
  percentage: number
  created_at: string
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
  const [userProfileLoaded, setUserProfileLoaded] = useState(false)
  const [dashboardDataLoaded, setDashboardDataLoaded] = useState(false)
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
    // Always fetch user profile from API on load
    const fetchUserProfile = async () => {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const user = await res.json()
          console.log('Dashboard fetched user from API:', user)
          console.log('Dashboard avatar from API:', user?.avatar)
          
          // Check if localStorage has more recent data (from profile updates)
          const localProfile = localStorage.getItem('userProfile')
          if (localProfile) {
            const parsedLocalProfile = JSON.parse(localProfile)
            console.log('Dashboard localStorage avatar:', parsedLocalProfile.avatar ? 'exists' : 'null')
            console.log('Dashboard API avatar:', user.avatar ? 'exists' : 'null')
            
            // If localStorage avatar is different from API avatar (including null vs non-null), use localStorage
            if (parsedLocalProfile.avatar !== user.avatar) {
              console.log('Dashboard using localStorage avatar (different from API):', parsedLocalProfile.avatar ? 'exists' : 'null')
              setUserProfile(parsedLocalProfile)
              return
            }
          }
          
          setUserProfile(user)
          localStorage.setItem('userProfile', JSON.stringify(user))
        } else {
          // fallback to localStorage if API fails
          const profile = localStorage.getItem('userProfile')
          if (profile) {
            const parsedProfile = JSON.parse(profile)
            console.log('Dashboard fallback to localStorage:', parsedProfile)
            console.log('Dashboard avatar from localStorage:', parsedProfile?.avatar)
            setUserProfile(parsedProfile)
          }
        }
      } catch (error) {
        // fallback to localStorage on error
        const profile = localStorage.getItem('userProfile')
        if (profile) {
          const parsedProfile = JSON.parse(profile)
          console.log('Dashboard error fallback to localStorage:', parsedProfile)
          console.log('Dashboard avatar from error fallback:', parsedProfile?.avatar)
          setUserProfile(parsedProfile)
        }
      }
      setUserProfileLoaded(true)
    }
    fetchUserProfile()
  }, [])

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      console.log('Dashboard received profile update:', customEvent.detail)
      console.log('Dashboard avatar from update:', customEvent.detail?.avatar ? 'exists' : 'null')
      console.log('Dashboard avatar length from update:', customEvent.detail?.avatar?.length)
      
      // Force a state update to trigger re-render
      setUserProfile(null)
      setTimeout(() => {
        setUserProfile(customEvent.detail)
        localStorage.setItem('userProfile', JSON.stringify(customEvent.detail))
        console.log('Dashboard updated userProfile state with:', customEvent.detail?.avatar ? 'exists' : 'null')
      }, 10)
    }
    window.addEventListener("profileUpdated", handleProfileUpdate)
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate)
  }, [])



  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data...')
        
        // Fetch chat sessions from database
        const chatRes = await fetch('/api/chat-sessions')
        console.log('Chat sessions response status:', chatRes.status)
        let chatHistory: ChatSession[] = []
        if (chatRes.ok) {
          const sessions = await chatRes.json()
          console.log('Chat sessions data:', sessions)
          chatHistory = sessions.map((session: any) => ({
            id: session.id,
            subject: session.subject,
            topic: session.topic || '',
            title: session.title || 'Conversation',
            last_message: session.last_message || '',
            updated_at: session.updated_at,
            message_count: session.message_count || 0,
          }))
          
          // Cache the sessions data for faster loading on subjects page
          sessionStorage.setItem('chatHistoryCache', JSON.stringify(chatHistory))
          sessionStorage.setItem('chatHistoryCacheTimestamp', Date.now().toString())
        } else {
          console.error('Chat sessions fetch failed:', chatRes.status, chatRes.statusText)
        }

        // Fetch exam results from database
        const examRes = await fetch('/api/exam-results')
        console.log('Exam results response status:', examRes.status)
        let examResults: ExamResult[] = []
        if (examRes.ok) {
          const results = await examRes.json()
          console.log('Exam results data:', results)
          examResults = results.map((result: any) => ({
            id: result.id,
            subject: getSubjectDisplayName(result.subject), // Convert route parameter to display name
            score: result.score,
            max_score: result.max_score,
            percentage: result.percentage,
            total_questions: result.total_questions,
            time_spent: result.time_spent || 0,
            created_at: result.created_at,
          }))
        } else {
          console.error('Exam results fetch failed:', examRes.status, examRes.statusText)
        }

        console.log('Processed chat history length:', chatHistory.length)
        console.log('Processed exam results length:', examResults.length)

        const learningSessions = chatHistory.length
        const recentSessions = chatHistory
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5)
        const practiceExams = examResults.length
        
        // Calculate average score
        let totalPercentage = 0
        let validExams = 0
        
        examResults.forEach((exam) => {
          const percentage = Number(exam.percentage)
          if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
            totalPercentage += percentage
            validExams++
          }
        })
        
        const averageScore = validExams > 0 ? Math.round(totalPercentage / validExams) : 0

        // Calculate weekly activity for current week (Sunday to Saturday)
        const weeklyChatActivity = Array(7).fill(0)
        const weeklyExamActivity = Array(7).fill(0)
        const { startOfWeek, endOfWeek } = getCurrentWeekRange()

        // Process chat sessions for current week
        chatHistory.forEach((session) => {
          try {
            const sessionDate = new Date(session.updated_at)
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
            const examDate = new Date(exam.created_at)
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
            const d = new Date(session.updated_at)
            activityDates.add(d.toISOString().slice(0, 10))
          } catch (e) {}
        })
        examResults.forEach((exam) => {
          try {
            const d = new Date(exam.created_at)
            activityDates.add(d.toISOString().slice(0, 10))
          } catch (e) {}
        })
        
        let currentStreak = 0
        let lastSessionDate = null
        const sortedDates = Array.from(activityDates).sort().reverse()
        
        // If there's any activity, start with at least 1 day streak
        if (sortedDates.length > 0) {
          currentStreak = 1
          lastSessionDate = sortedDates[0]
          
          // Check for consecutive days starting from the second most recent day
          for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i])
            const expectedDate = new Date()
            expectedDate.setDate(expectedDate.getDate() - i)
            expectedDate.setHours(0, 0, 0, 0)
            
            if (currentDate.toISOString().slice(0, 10) === expectedDate.toISOString().slice(0, 10)) {
              currentStreak++
            } else {
              break
            }
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
                return new Date(session.updated_at) >= twoWeeksAgo
              } catch (e) {
                return false
              }
            }).length
            const previousSessions = chatHistory.filter(session => {
              try {
                const sessionDate = new Date(session.updated_at)
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
            const d = new Date(exam.created_at)
            return isDateInCurrentWeek(d)
          } catch {
            return false
          }
        }).length
        
        // Calculate number of chat sessions this week
        const sessionsThisWeek = chatHistory.filter(session => {
          try {
            const d = new Date(session.updated_at)
            return isDateInCurrentWeek(d)
          } catch {
            return false
          }
        }).length
        
        const finalStats = {
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
        }
        
        console.log('Final stats object:', finalStats)
        setStats(finalStats)
        setDashboardDataLoaded(true)
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
        // Still set dashboard data as loaded even on error to prevent infinite loading
        setDashboardDataLoaded(true)
      }
    }

    // Initial data fetch
    fetchDashboardData()

    // Listen for chat session updates
    const handleChatSessionUpdate = () => {
      fetchDashboardData()
    }

    window.addEventListener("chatSessionUpdated", handleChatSessionUpdate)

    return () => {
      window.removeEventListener("chatSessionUpdated", handleChatSessionUpdate)
    }
  }, [router])

  // Effect to set loading to false when both profile and data are loaded
  useEffect(() => {
    console.log('Loading state check:', { userProfileLoaded, dashboardDataLoaded, isLoading })
    if (userProfileLoaded && dashboardDataLoaded) {
      console.log('Both profile and dashboard data loaded - setting loading to false')
      setIsLoading(false)
    }
  }, [userProfileLoaded, dashboardDataLoaded])

  // Effect to set loading to false when user profile is loaded (even if dashboard data fails)
  useEffect(() => {
    if (userProfileLoaded && isLoading) {
      // If we have the user profile but dashboard data is taking too long, show the dashboard anyway
      const timeout = setTimeout(() => {
        if (isLoading && !dashboardDataLoaded) {
          console.log('User profile loaded but dashboard data taking too long - showing dashboard anyway')
          setIsLoading(false)
          setDashboardDataLoaded(true)
        }
      }, 3000) // 3 seconds instead of 10

      return () => clearTimeout(timeout)
    }
  }, [userProfileLoaded, isLoading, dashboardDataLoaded])

  // Fallback timeout to prevent infinite loading (5 seconds)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('Dashboard loading timeout - forcing loading to false')
        setIsLoading(false)
        setDashboardDataLoaded(true)
      }
    }, 5000) // 5 seconds instead of 10

    return () => clearTimeout(timeout)
  }, [isLoading])

  // Debug effect to monitor userProfile changes
  useEffect(() => {
    console.log('userProfile state changed:', userProfile)
    console.log('Avatar in userProfile:', userProfile?.avatar)
    console.log('Avatar type:', typeof userProfile?.avatar)
    console.log('Avatar length:', userProfile?.avatar?.length)
  }, [userProfile])

  useEffect(() => {
    // Mobile viewport fix - ensure proper zoom on mobile
    const fixMobileViewport = () => {
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        // Force proper viewport on mobile
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
        }
        
        // Prevent zoom on input focus
        const inputs = document.querySelectorAll('input, textarea, select')
        inputs.forEach(input => {
          input.addEventListener('focus', () => {
            if (window.innerWidth <= 768) {
              setTimeout(() => {
                window.scrollTo(0, 0)
              }, 100)
            }
          })
        })
      }
    }

    // Run viewport fix on mount
    fixMobileViewport()

    // Also run on window resize
    window.addEventListener('resize', fixMobileViewport)
    
    return () => {
      window.removeEventListener('resize', fixMobileViewport)
    }
  }, [])

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
    if (stats.currentStreak === 1) return "Let's get started!"
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

  // Helper function to format relative time
  const formatRelativeTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInMs = now.getTime() - date.getTime()
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      if (diffInHours < 24) return `${diffInHours}h ago`
      if (diffInDays < 7) return `${diffInDays}d ago`
      return date.toLocaleDateString()
    } catch (error) {
      console.error('Error formatting timestamp:', error)
      return 'Unknown'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Header with Text */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-muted rounded-full animate-pulse"></div>
                <div>
                  <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0">
                <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
                <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading Message */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Loading your learning dashboard...</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Fetching your progress, recent activity, and performance data
          </p>
        </div>

        {/* Loading Metrics */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 bg-muted rounded animate-pulse mb-2"></div>
                <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Charts */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>

        {/* Loading Recent Activity */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-muted rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2"></div>
                    <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 dashboard-page dashboard-container dashboard-scroll">
      {/* Welcome Header with Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12" key={`dashboard-avatar-${userProfile?.avatar ? userProfile.avatar.substring(0, 50) : 'no-avatar'}`}>
                <AvatarImage
                  src={userProfile?.avatar}
                  alt="User Avatar"
                  className="object-cover"
                  onError={(e) => {
                    console.log('Dashboard avatar image failed to load:', userProfile?.avatar)
                    e.currentTarget.style.display = 'none'
                  }}
                  onLoad={() => {
                    console.log('Dashboard avatar image loaded successfully')
                  }}
                />
                <AvatarFallback className="text-xl font-bold">
                  {getUserInitials()}
                </AvatarFallback>
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
              {stats.currentStreak === 0 ? "Start today!" : stats.currentStreak === 1 ? "day in a row" : "days in a row"}
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
                          <span className="text-xs text-muted-foreground">{session.message_count} messages</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(session.updated_at)}</span>
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
                <p className="text-xs text-muted-foreground mb-4">Try these example questions to get started!</p>
                
                <div className="space-y-3">
                  {/* Mathematics Example */}
                  <Link href="/student/tutor?subject=math&question=Solve%20for%20x%20in%20x%5E2%2B3%3D19">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-left h-auto p-3"
                    >
                      <div className="flex items-start gap-3">
                        <FlaskConical className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Mathematics</p>
                          <p className="text-xs text-muted-foreground">Solve for x in x²+3=19</p>
                        </div>
                      </div>
                    </Button>
                  </Link>

                  {/* Science Example */}
                  <Link href="/student/tutor?subject=science&question=How%20many%20carbons%20are%20in%20Glucose%3F">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-left h-auto p-3"
                    >
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Science</p>
                          <p className="text-xs text-muted-foreground">How many carbons are in Glucose?</p>
                        </div>
                      </div>
                    </Button>
                  </Link>
                </div>

                <div className="mt-4">
                  <Link href="/student/tutor">
                    <Button variant="outline" size="sm">
                      Start Learning
                    </Button>
                  </Link>
                </div>
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
                  <Link 
                    key={exam.id} 
                    href={`/student/practice-exam?examId=${exam.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group active:bg-muted active:scale-98">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getScoreIcon(exam.percentage)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">{capitalizeSubject(exam.subject)}</p>
                          <p className="text-xs text-muted-foreground">
                            {exam.score}/{exam.max_score} points
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <span className={`font-bold text-sm ${getScoreColor(exam.percentage)}`}>{exam.percentage}%</span>
                        <p className="text-xs text-muted-foreground">{new Date(exam.created_at).toLocaleDateString()}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
                    </div>
                  </Link>
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
