import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Get user ID from request headers (set by middleware)
function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}

// GET - Retrieve detailed exam result by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserId(request)
    console.log('API: Fetching exam result for user:', userId, 'exam ID:', params.id)
    
    if (!userId) {
      console.log('API: No user ID found in headers')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const examId = params.id

    const result = await prisma.examResult.findFirst({
      where: { 
        id: examId,
        user_id: userId 
      },
    })

    console.log('API: Database query result:', result ? 'Found' : 'Not found')

    if (!result) {
      return NextResponse.json({ error: 'Exam result not found' }, { status: 404 })
    }

    // Extract question results from the answers field if it exists
    let questionResults = []
    if (result.answers && typeof result.answers === 'object') {
      const answersData = result.answers as any
      if (answersData.questionResults) {
        questionResults = answersData.questionResults
      }
    }

    console.log('API: Extracted question results count:', questionResults.length)

    // Return the result with extracted question results
    return NextResponse.json({
      ...result,
      questionResults
    })
  } catch (error) {
    console.error('API: Error fetching exam result:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 