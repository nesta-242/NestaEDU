# Education Platform Deployment Guide

This guide will walk you through deploying your education platform with a database so users can start using it.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available)
- A Vercel account (free tier available)
- Your OpenAI API key

## Step 1: Set Up Database (Supabase)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Wait for the project to be ready (2-3 minutes)

### 1.2 Set Up Database Schema
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL commands:

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  grade_level VARCHAR(50),
  school VARCHAR(200),
  avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(50) NOT NULL,
  topic VARCHAR(100),
  title VARCHAR(255),
  last_message TEXT,
  message_count INTEGER DEFAULT 0,
  messages JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Exam results table
CREATE TABLE exam_results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  total_questions INTEGER NOT NULL,
  time_spent INTEGER,
  answers JSONB,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.3 Get Database Connection String
1. Go to **Settings** > **Database**
2. Copy the **Connection string** (URI format)
3. It will look like: `postgresql://postgres:[password]@[host]:5432/postgres`

## Step 2: Configure Environment Variables

### 2.1 Update .env File
Replace the placeholder values in your `.env` file:

```env
# Database (replace with your Supabase connection string)
DATABASE_URL="postgresql://postgres:your-password@your-project-ref.supabase.co:5432/postgres"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# JWT Secret (generate a random string)
JWT_SECRET="your-super-secret-jwt-key-here"
```

### 2.2 Generate JWT Secret
Run this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Step 3: Set Up Database with Prisma

### 3.1 Generate Prisma Client
```bash
npx prisma generate
```

### 3.2 Push Schema to Database
```bash
npx prisma db push
```

### 3.3 Verify Database Connection
```bash
npx prisma studio
```
This will open a web interface to view your database tables.

## Step 4: Deploy to Vercel

### 4.1 Prepare for Deployment
1. Make sure all your changes are committed to git
2. Push to your GitHub repository

### 4.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Click **New Project**
4. Import your GitHub repository
5. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)

### 4.3 Set Environment Variables in Vercel
1. Go to your project settings in Vercel
2. Navigate to **Environment Variables**
3. Add the following variables:
   - `DATABASE_URL`: Your Supabase connection string
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `JWT_SECRET`: Your JWT secret

### 4.4 Deploy
1. Click **Deploy**
2. Wait for the build to complete (2-5 minutes)
3. Your app will be live at `https://your-project-name.vercel.app`

## Step 5: Test the Deployment

### 5.1 Test User Registration
1. Visit your deployed app
2. Go to the signup page
3. Create a new account
4. Verify the user is created in your Supabase database

### 5.2 Test Login
1. Try logging in with the account you just created
2. Verify you can access the student dashboard

### 5.3 Test AI Tutor
1. Start a conversation with the AI tutor
2. Verify chat sessions are saved to the database
3. Check that sessions appear in "Past Sessions"

### 5.4 Test Practice Exams
1. Take a practice exam
2. Verify exam results are saved to the database
3. Check that results appear on the dashboard

## Step 6: Monitor and Maintain

### 6.1 Monitor Database Usage
- Check Supabase dashboard for database usage
- Monitor API calls and storage usage
- Free tier includes 500MB database and 2GB bandwidth

### 6.2 Monitor Application Performance
- Use Vercel Analytics to monitor performance
- Check for any errors in Vercel logs
- Monitor OpenAI API usage and costs

### 6.3 Backup Strategy
- Supabase provides automatic backups
- Consider setting up additional backups for critical data

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify your DATABASE_URL is correct
   - Check if your Supabase project is active
   - Ensure the database schema was created successfully

2. **Authentication Issues**
   - Verify JWT_SECRET is set correctly
   - Check that cookies are being set properly
   - Ensure middleware is working correctly

3. **Build Errors**
   - Check Vercel build logs for specific errors
   - Ensure all dependencies are installed
   - Verify TypeScript compilation

4. **API Errors**
   - Check Vercel function logs
   - Verify environment variables are set
   - Test API endpoints locally first

### Getting Help

- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [Prisma documentation](https://www.prisma.io/docs)
- Consult [Supabase documentation](https://supabase.com/docs)
- Check [Vercel documentation](https://vercel.com/docs)

## Next Steps

Once deployed and tested:

1. **Custom Domain**: Set up a custom domain in Vercel
2. **SSL Certificate**: Automatically handled by Vercel
3. **Analytics**: Add Google Analytics or Vercel Analytics
4. **Monitoring**: Set up error monitoring with Sentry
5. **Scaling**: Upgrade Supabase plan as needed
6. **Features**: Add more features like email notifications, admin panel, etc.

## Cost Estimation

### Free Tier (Recommended for starting)
- **Vercel**: Free (unlimited deployments, 100GB bandwidth)
- **Supabase**: Free (500MB database, 2GB bandwidth)
- **OpenAI**: Pay per use (~$0.01-0.10 per conversation)

### Monthly Costs (as you scale)
- **Vercel Pro**: $20/month (unlimited bandwidth)
- **Supabase Pro**: $25/month (8GB database, 250GB bandwidth)
- **OpenAI**: Varies based on usage

Your education platform is now ready for users! 🎉 