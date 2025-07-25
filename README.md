# Education Platform - AI-Powered Learning

An AI-powered education platform aligned to BJC & BGCSE Math and Science curriculum, featuring an intelligent AI tutor and exam generation system.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (you have v22.16.0 ✅)
- npm (you have v10.9.2 ✅)

### One-Command Setup & Run

```bash
# Clone and navigate to the project
cd education-platform

# Install dependencies and start development server
npm run setup && npm run dev
```

The app will be available at: **http://localhost:3000**

## 📁 Project Structure

```
education-platform/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (chat, exam generation, grading)
│   ├── student/           # Student dashboard and features
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
├── config/               # Configuration files (API keys)
├── lib/                  # Utility functions
└── public/               # Static assets
```

## 🔧 Configuration

### OpenAI API Key
The project includes a pre-configured OpenAI API key in `config/api-keys.js`. This means:
- ✅ **No manual setup required**
- ✅ **Works out of the box**
- ✅ **No .env files needed**

If you want to use your own API key:
1. Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Replace the key in `config/api-keys.js`

## 🎯 Features

### AI Tutor
- **Socratic Method**: Guides students through questions rather than giving direct answers
- **Subject Specialization**: Math and Science tutoring with curriculum alignment
- **Image Analysis**: Can analyze uploaded images and diagrams
- **Mathematical Notation**: Clean, readable math formatting
- **Voice Dictation**: Speak your questions using the device microphone for hands-free interaction

### Exam System
- **AI-Generated Exams**: Creates custom exams based on subject and difficulty
- **Automated Grading**: Provides detailed feedback and scoring
- **Practice Mode**: Unlimited practice exams with instant feedback

### Student Dashboard
- **Progress Tracking**: Learning sessions and exam results
- **Performance Analytics**: Weekly activity and subject distribution
- **Session History**: Complete chat and exam history

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run setup        # Install dependencies
npm run clean        # Clean install (remove node_modules and reinstall)
```

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **UI**: Radix UI + Tailwind CSS
- **AI**: OpenAI GPT-4o via AI SDK
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components

## 🚀 Deployment

The project includes configuration for multiple deployment platforms:

- **Vercel**: `vercel.json` configuration
- **Railway**: `railway.toml` configuration
- **DigitalOcean**: `.do/app.yaml` configuration
- **Docker**: `Dockerfile` for containerized deployment

## 🔍 Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Kill the process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Dependencies not found**
   ```bash
   npm run clean
   ```

3. **TypeScript errors**
   - The project is configured to ignore TypeScript build errors for development
   - Check `next.config.mjs` for configuration

### AI Features Not Working
- Check that the OpenAI API key is valid in `config/api-keys.js`
- Verify your internet connection
- Check the browser console for error messages

## 📚 Learning Resources

- **BJC Curriculum**: Bahamas Junior Certificate
- **BGCSE Curriculum**: Bahamas General Certificate of Secondary Education
- **Socratic Method**: Question-based teaching approach
- **AI Tutoring**: Personalized learning with artificial intelligence

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

**Ready to start learning?** Run `npm run dev` and visit http://localhost:3000! 