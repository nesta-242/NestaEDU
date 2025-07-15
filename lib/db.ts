import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with error handling
let prisma: PrismaClient

try {
  console.log('Initializing Prisma client...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
  
  // Modify DATABASE_URL for serverless environments to avoid prepared statement conflicts
  let databaseUrl = process.env.DATABASE_URL
  if (process.env.NODE_ENV === 'production' && databaseUrl) {
    // Add connection parameters to disable prepared statements and optimize for serverless
    const separator = databaseUrl.includes('?') ? '&' : '?'
    databaseUrl = `${databaseUrl}${separator}connection_limit=1&pool_timeout=0&prepared_statements=false&sslmode=require`
  }
  
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })
  
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  
  // Test the connection with retry logic
  const testConnection = async () => {
    try {
      await prisma.$connect()
      console.log('✅ Database connection successful')
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      console.error('Please check your DATABASE_URL in .env file')
      
      // In production, try to disconnect and reconnect
      if (process.env.NODE_ENV === 'production') {
        try {
          await prisma.$disconnect()
          console.log('Disconnected from database, will reconnect on next request')
        } catch (disconnectError) {
          console.error('Error disconnecting:', disconnectError)
        }
      }
    }
  }
  
  testConnection()
} catch (error) {
  console.error('❌ Prisma client initialization failed:', error)
  // Create a mock client for development
  prisma = {} as PrismaClient
}

// Helper function to execute database operations with retry logic
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error)
      
      // If it's a prepared statement error, try to reconnect
      if (error instanceof Error && error.message.includes('prepared statement') && attempt < maxRetries) {
        try {
          await prisma.$disconnect()
          await prisma.$connect()
          console.log(`Reconnected to database after attempt ${attempt}`)
        } catch (reconnectError) {
          console.error('Failed to reconnect:', reconnectError)
        }
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 100 // 200ms, 400ms, 800ms
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError || new Error('Database operation failed after all retries')
}

export { prisma } 