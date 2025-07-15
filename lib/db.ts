import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with error handling
let prisma: PrismaClient

try {
  console.log('Initializing Prisma client...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
  
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })
  
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  
  // Test the connection
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connection successful')
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error)
      console.error('Please check your DATABASE_URL in .env file')
    })
} catch (error) {
  console.error('❌ Prisma client initialization failed:', error)
  // Create a mock client for development
  prisma = {} as PrismaClient
}

export { prisma } 