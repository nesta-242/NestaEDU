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
      where: { userId },
      orderBy: { createdAt: 'desc' },
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Save exam result
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, score, maxScore, percentage, totalQuestions, timeSpent, answers, feedback } = await request.json()

    const result = await prisma.examResult.create({
      data: {
        userId,
        subject,
        score,
        maxScore,
        percentage,
        totalQuestions,
        timeSpent,
        answers,
        feedback,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error saving exam result:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 