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
        where: { id: sessionId, user_id: userId },
      })

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      return NextResponse.json(session)
    }

    // Fetch all sessions
    const sessions = await prisma.chatSession.findMany({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
      take: 50, // Limit to 50 most recent sessions
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    
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

// POST - Create or update a chat session
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    console.log('Chat sessions POST - User ID:', userId)
    
    if (!userId) {
      console.error('No user ID found in request headers')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Chat sessions POST - Request body:', body)
    
    const { id, subject, topic, title, lastMessage, messageCount, messages } = body

    let session
    if (id) {
      // Update existing session
      session = await prisma.chatSession.update({
        where: { id, user_id: userId },
        data: {
          subject,
          topic,
          title,
          last_message: lastMessage,
          message_count: messageCount,
          messages,
          updated_at: new Date(),
        },
      })
    } else {
      // Create new session
      session = await prisma.chatSession.create({
        data: {
          user_id: userId,
          subject,
          topic,
          title,
          last_message: lastMessage,
          message_count: messageCount,
          messages,
        },
      })
    }

    console.log('Chat session saved successfully:', session)
    return NextResponse.json(session)
  } catch (error) {
    console.error('Error saving chat session:', error)
    
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
        where: { user_id: userId },
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
      where: { id: sessionId, user_id: userId },
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