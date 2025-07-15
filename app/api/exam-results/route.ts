import { NextRequest, NextResponse } from 'next/server'
import { getPrisma, disconnectPrisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  let prisma = null
  
  try {
    console.log('Exam results GET - Starting request')
    
    // Get user ID from headers
    const userId = request.headers.get('x-user-id')
    console.log('Exam results - User ID from headers:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 })
    }
    
    console.log('Exam results GET - Fetching results for user:', userId)
    
    // Get a fresh Prisma client
    prisma = await getPrisma()
    
    const results = await prisma.examResult.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: 'desc',
      },
    })
    
    console.log('Exam results GET - Found', results.length, 'results')
    
    // Add debugging for average score calculation
    if (results.length > 0) {
      console.log('Exam results GET - Sample results for debugging:')
      results.slice(0, 3).forEach((result, index) => {
        console.log(`  Result ${index + 1}:`, {
          id: result.id,
          percentage: result.percentage,
          percentageType: typeof result.percentage,
          score: result.score,
          max_score: result.max_score
        })
      })
    }
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Exam results GET - Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    return NextResponse.json(
      { error: 'Failed to fetch exam results' },
      { status: 500 }
    )
  } finally {
    // Always disconnect the client to prevent prepared statement conflicts
    if (prisma) {
      await disconnectPrisma(prisma)
    }
  }
}

export async function POST(request: NextRequest) {
  let prisma = null
  
  try {
    const body = await request.json()
    const { subject, score, maxScore, percentage, totalQuestions, timeSpent, answers, feedback } = body
    
    // Get user ID from headers
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 })
    }
    
    // Get a fresh Prisma client
    prisma = await getPrisma()
    
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
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Exam results POST - Error:', error)
    return NextResponse.json(
      { error: 'Failed to create exam result' },
      { status: 500 }
    )
  } finally {
    // Always disconnect the client
    if (prisma) {
      await disconnectPrisma(prisma)
    }
  }
} 