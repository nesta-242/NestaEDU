#!/bin/bash

# Education Platform Setup Script
echo "🚀 Setting up Education Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies with legacy peer deps for compatibility
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "To start the development server:"
    echo "  npm run dev"
    echo ""
    echo "The app will be available at: http://localhost:3000"
    echo ""
    echo "📚 Features available:"
    echo "  • AI Tutor (Math & Science)"
    echo "  • Practice Exams"
    echo "  • Student Dashboard"
    echo "  • Progress Tracking"
else
    echo "❌ Failed to install dependencies. Please try again."
    exit 1
fi 