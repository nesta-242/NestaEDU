# Vercel Environment Variables Setup

This guide will help you set up the required environment variables on Vercel to make the AI tutor and practice exam generation work.

## Required Environment Variables

You need to set the following environment variables in your Vercel project:

### 1. OpenAI API Key
- **Name**: `OPENAI_API_KEY`
- **Value**: Your OpenAI API key (starts with `sk-`)
- **Environment**: Production, Preview, Development
- **Get it from**: [OpenAI Platform](https://platform.openai.com/api-keys)

### 2. Supabase Configuration
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: Your Supabase project URL
- **Environment**: Production, Preview, Development
- **Get it from**: Supabase Dashboard → Settings → API → Project URL

- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anon/public key
- **Environment**: Production, Preview, Development
- **Get it from**: Supabase Dashboard → Settings → API → Project API keys → anon public

- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Your Supabase service role key
- **Environment**: Production, Preview, Development
- **Get it from**: Supabase Dashboard → Settings → API → Project API keys → service_role

### 3. JWT Secret
- **Name**: `JWT_SECRET`
- **Value**: A random string for JWT token signing
- **Environment**: Production, Preview, Development
- **Generate it**: Run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 4. Database URL (if using Prisma)
- **Name**: `DATABASE_URL`
- **Value**: Your Supabase database connection string
- **Environment**: Production, Preview, Development
- **Get it from**: Supabase Dashboard → Settings → Database → Connection string

## How to Set Environment Variables on Vercel

### Method 1: Vercel Dashboard
1. Go to your Vercel project dashboard
2. Click on **Settings** tab
3. Click on **Environment Variables** in the left sidebar
4. Click **Add New** for each environment variable
5. Fill in the Name, Value, and select Environment (Production, Preview, Development)
6. Click **Save**

### Method 2: Vercel CLI
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Add environment variables:
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add JWT_SECRET
   vercel env add DATABASE_URL
   ```

### Method 3: .env.local (for local development)
Create a `.env.local` file in your project root:
```env
OPENAI_API_KEY=your-openai-api-key-here
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=your-database-url-here
```

## Verification Steps

### 1. Check Environment Variables
After setting the environment variables, redeploy your app and check the logs. You should see:
```
Environment validation passed
OpenAI API Key check: { hasKey: true, keyLength: 164, keyPrefix: 'sk-proj-xD...', environment: 'production' }
```

### 2. Test AI Tutor
1. Go to your deployed app
2. Navigate to the AI Tutor page
3. Try asking a question
4. Check the browser console and Vercel logs for any errors

### 3. Test Practice Exam
1. Go to Practice Exam page
2. Select a subject
3. Try generating an exam
4. Check the browser console and Vercel logs for any errors

## Troubleshooting

### Common Issues

1. **"Configuration error" message**
   - Check that all environment variables are set correctly
   - Verify the values are not empty
   - Make sure you selected the correct environment (Production, Preview, Development)

2. **"OpenAI API key not found"**
   - Verify your OpenAI API key is valid and active
   - Check that the key starts with `sk-`
   - Ensure you have sufficient credits in your OpenAI account

3. **"Supabase connection error"**
   - Verify your Supabase project is active
   - Check that the URL and keys are correct
   - Ensure your Supabase project has the required tables

4. **"JWT secret not configured"**
   - Generate a new JWT secret
   - Make sure it's at least 32 characters long
   - Verify it's set in all environments

### Debug Information

The app now includes debug information in error responses. When you see an error, check the `debug` object in the response for details about which environment variables are missing or incorrect.

### Getting Help

If you're still having issues:
1. Check the Vercel function logs in your project dashboard
2. Look at the browser console for client-side errors
3. Verify all environment variables are set correctly
4. Test the API endpoints locally first

## Security Notes

- Never commit environment variables to your repository
- Use different API keys for development and production
- Regularly rotate your JWT secret
- Monitor your OpenAI API usage to control costs 