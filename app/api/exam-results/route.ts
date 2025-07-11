import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Get user ID from request headers (set by middleware)
function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}

// GET - Retrieve exam results for a user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await prisma.examResult.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20, // Limit to 20 most recent results
    })

    // Process results to include question results count
    const processedResults = results.map(result => {
      let questionResultsCount = 0
      if (result.answers && typeof result.answers === 'object') {
        const answersData = result.answers as any
        if (answersData.questionResults && Array.isArray(answersData.questionResults)) {
          questionResultsCount = answersData.questionResults.length
        }
      }
      
      return {
        ...result,
        questionResultsCount
      }
    })

    return NextResponse.json(processedResults)
  } catch (error) {
    console.error('Error fetching exam results:', error)
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('Can\'t reach database server')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: 'Unable to connect to the database. Please check your database configuration.',
          code: 'DB_CONNECTION_ERROR'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Save exam result
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    console.log('Exam results POST - User ID:', userId)
    
    if (!userId) {
      console.error('No user ID found in request headers')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Exam results POST - Request body:', body)
    
    const { subject, score, maxScore, percentage, totalQuestions, timeSpent, answers, feedback } = body

    const result = await prisma.examResult.create({
      data: {
        user_id: userId,
        subject,
        score,
        max_score: maxScore,
        percentage,
        total_questions: totalQuestions,
        time_spent: timeSpent,
        answers,
        feedback,
      },
    })

    console.log('Exam result saved successfully:', result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error saving exam result:', error)
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('Can\'t reach database server')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed',
          details: 'Unable to connect to the database. Please check your database configuration.',
          code: 'DB_CONNECTION_ERROR'
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 