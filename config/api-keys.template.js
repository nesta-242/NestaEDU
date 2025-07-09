// API Configuration Template
// Copy this file to api-keys.js and add your actual API keys

export const API_CONFIG = {
  // OpenAI API Key for AI tutoring functionality
  // Get your API key from: https://platform.openai.com/api-keys
  // Replace 'your-api-key-here' with your actual OpenAI API key
  OPENAI_API_KEY: 'your-api-key-here',
  
  // Supabase Configuration
  // Get these from your Supabase project settings
  // 1. Go to your Supabase project dashboard
  // 2. Go to Settings > API
  // 3. Copy the Project URL and anon key
  // 4. For service role key, copy the "service_role" key (keep this secret!)
  SUPABASE_URL: 'your-supabase-url',
  SUPABASE_ANON_KEY: 'your-supabase-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'your-supabase-service-role-key',
  
  // Development settings
  NODE_ENV: 'development',
  APP_URL: 'http://localhost:3000'
}

// Helper function to get API key with fallback
export function getOpenAIKey() {
  return process.env.OPENAI_API_KEY || API_CONFIG.OPENAI_API_KEY
}

// Helper function to get Supabase service role key
export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_SERVICE_ROLE_KEY
} 