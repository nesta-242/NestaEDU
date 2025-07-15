import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
    
    // Test basic database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('Database query result:', result)
    
    // Test if we can access the tables
    const chatSessionsCount = await prisma.chatSession.count()
    const examResultsCount = await prisma.examResult.count()
    
    return NextResponse.json({
      status: 'success',
      databaseConnected: true,
      chatSessionsCount,
      examResultsCount,
      environment: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    })
  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      status: 'error',
      databaseConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    }, { status: 500 })
  }
} 