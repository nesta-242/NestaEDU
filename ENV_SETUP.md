# Environment Variables Setup

## 🚨 CRITICAL: Create .env file

The app is failing because the `.env` file is missing. You need to create it with your API keys.

## 📝 Create .env file

Create a file named `.env` in the root directory with this content:

```bash
# Environment Variables for Education Platform

# OpenAI API Key (Required for AI tutor and exam generation)
# Get your API key from: https://platform.openai.com/api-keys
# The key should start with 'sk-'
OPENAI_API_KEY=your-openai-api-key-here

# Supabase Configuration (Required for database and authentication)
# Get these from your Supabase project settings: https://supabase.com/dashboard
# 1. Go to your Supabase project dashboard
# 2. Go to Settings > API
# 3. Copy the Project URL and anon key
# 4. For service role key, copy the "service_role" key (keep this secret!)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Secret (Required for authentication)
# Generate a secure random string for JWT token signing
# You can use: openssl rand -base64 32
JWT_SECRET=your-jwt-secret-here

# Development settings
NODE_ENV=development
APP_URL=http://localhost:3000
```

## 🔑 How to get your API keys

### 1. OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)
4. Replace `your-openai-api-key-here` with your actual key

### 2. Supabase Configuration
1. Go to your Supabase project: https://supabase.com/dashboard
2. Go to Settings > API
3. Copy these values:
   - **Project URL**: Replace `your-supabase-project-url`
   - **anon public**: Replace `your-supabase-anon-key`
   - **service_role secret**: Replace `your-supabase-service-role-key`

### 3. JWT Secret
Generate a secure random string:
```bash
openssl rand -base64 32
```
Replace `your-jwt-secret-here` with the generated string.

## ✅ After creating .env

1. Save the `.env` file
2. Restart the development server:
   ```bash
   npm run dev
   ```
3. The app should now work with proper styling and login functionality

## 🚨 Current Issues Fixed

- ✅ Missing environment variables
- ✅ Database connection errors
- ✅ Plain text styling (CSS not loading)
- ✅ Login failures

The app will work once you provide valid API keys in the `.env` file. 