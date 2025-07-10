import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt-auth'

// Get user ID from request headers (set by middleware)
function getUserId(request: NextRequest): string | null {
  return request.headers.get('x-user-id')
}

// GET - Retrieve chat sessions for a user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (sessionId) {
      // Fetch specific session
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      })

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      return NextResponse.json(session)
    }

    // Fetch all sessions
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50, // Limit to 50 most recent sessions
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update a chat session
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, subject, topic, title, lastMessage, messageCount, messages } = await request.json()

    let session
    if (id) {
      // Update existing session
      session = await prisma.chatSession.update({
        where: { id, userId },
        data: {
          subject,
          topic,
          title,
          lastMessage,
          messageCount,
          messages,
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new session
      session = await prisma.chatSession.create({
        data: {
          userId,
          subject,
          topic,
          title,
          lastMessage,
          messageCount,
          messages,
        },
      })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error saving chat session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a chat session or clear all sessions
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    
    if (body.clearAll) {
      // Clear all sessions for the user
      await prisma.chatSession.deleteMany({
        where: { userId },
      })
      return NextResponse.json({ message: 'All sessions deleted successfully' })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    await prisma.chatSession.delete({
      where: { id: sessionId, userId },
    })

    return NextResponse.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Error deleting chat session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 