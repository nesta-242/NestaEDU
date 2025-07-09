import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with error handling
let prisma: PrismaClient

try {
  prisma = globalForPrisma.prisma ?? new PrismaClient()
  
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
} catch (error) {
  console.warn('Prisma client initialization failed:', error)
  // Create a mock client for development
  prisma = {} as PrismaClient
}

export { prisma } 