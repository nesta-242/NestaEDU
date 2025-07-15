import { NextRequest, NextResponse } from 'next/server'
import { getPrisma, disconnectPrisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  let prisma = null
  
  try {
    console.log('Chat sessions GET - Starting request')
    
    // Get user ID from headers
    const userId = request.headers.get('x-user-id')
    console.log('Chat sessions - User ID from headers:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 })
    }
    
    console.log('Chat sessions GET - Fetching sessions for user:', userId)
    
    // Get a fresh Prisma client
    prisma = await getPrisma()
    
    console.log('Chat sessions GET - Fetching all sessions')
    
    const sessions = await prisma.chatSession.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        updated_at: 'desc',
      },
    })
    
    console.log('Chat sessions GET - Found', sessions.length, 'sessions')
    
    return NextResponse.json(sessions)
    
  } catch (error) {
    console.error('Chat sessions GET - Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.constructor.name : 'Unknown'
    })
    
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
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
    const { subject, topic, title, lastMessage, messages } = body
    
    // Get user ID from headers
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 })
    }
    
    // Get a fresh Prisma client
    prisma = await getPrisma()
    
    const session = await prisma.chatSession.create({
      data: {
        user_id: userId,
        subject,
        topic,
        title,
        last_message: lastMessage,
        messages,
        message_count: messages ? messages.length : 0,
      },
    })
    
    return NextResponse.json(session)
    
  } catch (error) {
    console.error('Chat sessions POST - Error:', error)
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    )
  } finally {
    // Always disconnect the client
    if (prisma) {
      await disconnectPrisma(prisma)
    }
  }
}

// DELETE - Delete a chat session or clear all sessions
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    
    if (body.clearAll) {
      // Clear all sessions for the user
      let prisma = null
      try {
        prisma = await getPrisma()
        await prisma.chatSession.deleteMany({
          where: { user_id: userId },
        })
        return NextResponse.json({ message: 'All sessions deleted successfully' })
      } catch (error) {
        console.error('Error deleting all sessions:', error)
        return NextResponse.json(
          { error: 'Failed to delete all sessions' },
          { status: 500 }
        )
      } finally {
        if (prisma) {
          await disconnectPrisma(prisma)
        }
      }
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    let prisma = null
    try {
      prisma = await getPrisma()
              await prisma.chatSession.delete({
          where: { id: sessionId, user_id: userId },
        })
      return NextResponse.json({ message: 'Session deleted successfully' })
    } catch (error) {
      console.error('Error deleting chat session:', error)
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      )
    } finally {
      if (prisma) {
        await disconnectPrisma(prisma)
      }
    }
  } catch (error) {
    console.error('Error deleting chat session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 