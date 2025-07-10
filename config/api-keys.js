// API Configuration
// This file contains API keys and configuration for the education platform
// Note: In production, these should be environment variables
// Updated for Vercel deployment

export const API_CONFIG = {
  // OpenAI API Key for AI tutoring functionality
  // Get your API key from: https://platform.openai.com/api-keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  
  // Supabase Configuration
  // Get these from your Supabase project settings
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Development settings
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || ''
}

// Helper function to get API key with fallback
export function getOpenAIKey() {
  const key = process.env.OPENAI_API_KEY
  return key
}

// Helper function to get Supabase service role key
export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}

// Validate environment variables
export function validateEnvironment() {
  const errors = []
  
  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is not set')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is not set')
  }
  
  if (errors.length > 0) {
    console.error('Environment validation failed:', errors)
    return false
  }
  
  return true
}

// Note: Environment variables are read directly from process.env
// No need to set them here as they should be provided by the runtime environment 