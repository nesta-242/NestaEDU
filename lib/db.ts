import { PrismaClient } from '@prisma/client'

// For serverless environments, create a completely new client for each request
// to avoid prepared statement conflicts
export async function getPrisma(): Promise<PrismaClient> {
  console.log('Creating new Prisma client for request...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
  
  // Add serverless-specific connection parameters to prevent prepared statement conflicts
  const databaseUrl = process.env.DATABASE_URL
  const connectionString = databaseUrl ? 
    `${databaseUrl}?pgbouncer=true&connection_limit=1&pool_timeout=0&connect_timeout=10&prepared_statements=false&statement_timeout=30000` : 
    process.env.DATABASE_URL
  
  const client = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: connectionString,
      },
    },
  })
  
  try {
    // Test connection
    await client.$connect()
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    await client.$disconnect()
    throw error
  }
  
  return client
}

// Cleanup function for serverless environments
export async function disconnectPrisma(client: PrismaClient): Promise<void> {
  try {
    await client.$disconnect()
    console.log('✅ Prisma client disconnected')
  } catch (error) {
    console.error('❌ Error disconnecting Prisma client:', error)
  }
}

// Legacy export for development (not recommended for serverless)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

if (process.env.NODE_ENV !== 'production') {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })
  }
}

// Export the legacy client for development only
export const prisma = globalForPrisma.prisma 