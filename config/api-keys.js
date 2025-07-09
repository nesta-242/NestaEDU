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
  APP_URL: process.env.APP_URL || 'http://localhost:3000'
}

// Helper function to get API key with fallback
export function getOpenAIKey() {
  const key = process.env.OPENAI_API_KEY
  console.log('OpenAI API Key check:', {
    hasKey: !!key,
    keyLength: key?.length || 0,
    keyPrefix: key?.substring(0, 10) + '...' || 'none'
  })
  return key
}

// Helper function to get Supabase service role key
export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}

// Set the environment variables
if (typeof process !== 'undefined') {
  process.env.OPENAI_API_KEY = getOpenAIKey()
  process.env.SUPABASE_SERVICE_ROLE_KEY = getSupabaseServiceRoleKey()
} 