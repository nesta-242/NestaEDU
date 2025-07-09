# OpenAI Setup Guide

## Environment Variables

To enable the AI tutor functionality, you need to set up your OpenAI API key:

### 1. Get your OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it starts with `sk-`)

### 2. Set Environment Variables

#### For Local Development:
Create a `.env.local` file in your project root:

```env
OPENAI_API_KEY=your-openai-api-key-here
```

#### For Vercel Deployment:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new environment variable:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
   - Environment: Production, Preview, Development

### 3. Install Required Dependencies

The AI SDK packages are already included, but make sure you have:

```bash
npm install ai @ai-sdk/openai
```

### 4. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the AI Tutor page
3. Select a subject and topic
4. Ask a question to test the OpenAI integration

### 5. Usage Monitoring

- Monitor your OpenAI usage in the [OpenAI Dashboard](https://platform.openai.com/usage)
- Set up usage limits to control costs
- The current setup uses GPT-4o with a 500 token limit per response

### Troubleshooting

- **401 Unauthorized**: Check if your API key is correct and active
- **429 Rate Limited**: You've exceeded your rate limit, wait or upgrade your plan
- **500 Server Error**: Check the server logs for detailed error messages 