import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a new Prisma client instance for each request in production
export function createPrismaClient(): PrismaClient {
  console.log('Creating new Prisma client instance...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
  
  // Modify DATABASE_URL for serverless environments to avoid prepared statement conflicts
  let databaseUrl = process.env.DATABASE_URL
  if (process.env.NODE_ENV === 'production' && databaseUrl) {
    // Add parameters to disable prepared statements and force new connections
    const separator = databaseUrl.includes('?') ? '&' : '?'
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    databaseUrl = `${databaseUrl}${separator}connection_limit=1&pool_timeout=0&application_name=prisma_${timestamp}_${randomId}&options=-c%20plan_cache_mode=force_generic_plan&sslmode=require`
  }
  
  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })
}

// For development, use a singleton instance
let prisma: PrismaClient

try {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Initializing Prisma client for development...')
    prisma = globalForPrisma.prisma ?? createPrismaClient()
    
    if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma
    
    // Test the connection
    prisma.$connect()
      .then(() => {
        console.log('✅ Database connection successful')
      })
      .catch((error) => {
        console.error('❌ Database connection failed:', error)
        console.error('Please check your DATABASE_URL in .env file')
      })
  } else {
    // In production, create a dummy instance (will be replaced per request)
    prisma = {} as PrismaClient
  }
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