import { NextRequest, NextResponse } from 'next/server'
import { prisma, createPrismaClient } from '@/lib/db'
import { verifyToken } from '@/lib/jwt-auth'

export const dynamic = 'force-dynamic';

// Get user ID from request headers (set by middleware)
function getUserId(request: NextRequest): string | null {
  const userId = request.headers.get('x-user-id')
  console.log('Chat sessions - User ID from headers:', userId)
  return userId
}

// GET - Retrieve chat sessions for a user
export async function GET(request: NextRequest) {
  console.log('Chat sessions GET - Starting request')
  
  // Create a new Prisma client for this request in production
  const client = process.env.NODE_ENV === 'production' ? createPrismaClient() : prisma
  
  try {
    const userId = getUserId(request)
    if (!userId) {
      console.error('Chat sessions GET - No user ID found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Chat sessions GET - Fetching sessions for user:', userId)

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (sessionId) {
      // Fetch specific session
      console.log('Chat sessions GET - Fetching specific session:', sessionId)
      const session = await client.chatSession.findFirst({
        where: { id: sessionId, user_id: userId },
      })

      if (!session) {
        console.log('Chat sessions GET - Session not found')
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      console.log('Chat sessions GET - Returning specific session')
      return NextResponse.json(session)
    }

    // Fetch all sessions
    console.log('Chat sessions GET - Fetching all sessions')
    const sessions = await client.chatSession.findMany({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
      take: 50, // Limit to 50 most recent sessions
    })

    console.log('Chat sessions GET - Found', sessions.length, 'sessions')
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Chat sessions GET - Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
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
  } finally {
    // Clean up the client in production
    if (process.env.NODE_ENV === 'production') {
      try {
        await client.$disconnect()
      } catch (error) {
        console.error('Error disconnecting client:', error)
      }
    }
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