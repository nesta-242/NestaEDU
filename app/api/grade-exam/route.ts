import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getOpenAIKey, validateEnvironment } from "../../../config/api-keys"

export async function POST(request: NextRequest) {
  try {
    const { examData, answers } = await request.json()

    if (!examData || !answers) {
      return NextResponse.json({ error: "Exam data and answers are required" }, { status: 400 })
    }

    // Validate environment variables first
    if (!validateEnvironment()) {
      return NextResponse.json(
        {
          error: "Configuration error",
          message: "The exam grading service is not properly configured. Please check environment variables.",
          isMock: true,
          debug: {
            environment: process.env.NODE_ENV,
            hasOpenAIKey: !!process.env.OPENAI_API_KEY,
            hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasJwtSecret: !!process.env.JWT_SECRET
          }
        },
        { status: 500 },
      )
    }

    // Check if OpenAI API key is available
    const apiKey = getOpenAIKey()
    if (!apiKey) {
      console.error("OpenAI API key not found")
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          isMock: true,
          mockMessage: "Using mock grading - OpenAI API key not available",
        },
        { status: 500 },
      )
    }

    // Set the environment variable for the AI SDK
    process.env.OPENAI_API_KEY = apiKey

    try {
      const prompt = `Grade this exam and provide detailed feedback for each question.

EXAM DETAILS:
Title: ${examData.title}
Total Questions: ${examData.questions.length}
Total Points: ${examData.totalPoints}

QUESTIONS AND STUDENT ANSWERS:
${examData.questions
  .map((q: any, index: number) => {
    const userAnswer = answers[q.id] || "No answer provided"
    return `
Question ${index + 1} (${q.points} points):
Type: ${q.type}
Question: ${q.question}
${q.type === "multiple-choice" ? `Options: ${q.options?.join(", ")}` : ""}
Correct Answer: ${q.correctAnswer}
Student Answer: ${userAnswer}
`
  })
  .join("\n")}

GRADING REQUIREMENTS:
1. For multiple choice questions: Award full points if the student answer exactly matches the correct answer, 0 points otherwise
2. For short answer questions: Award partial credit based on the quality and accuracy of the response
3. Provide specific feedback for each question explaining why points were awarded or deducted
4. Calculate the total score and percentage
5. Provide overall feedback on the student's performance

RESPONSE FORMAT - Return ONLY valid JSON in this exact structure:
{
  "totalScore": number,
  "maxScore": ${examData.totalPoints},
  "percentage": number,
  "feedback": "Overall feedback about the student's performance",
  "questionResults": [
    {
      "questionId": number,
      "userAnswer": "student's answer",
      "isCorrect": boolean,
      "pointsEarned": number,
      "maxPoints": number,
      "feedback": "specific feedback for this question",
      "correctAnswer": "correct answer for reference"
    }
  ]
}

Grade the exam now:`

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
        temperature: 0.3,
        maxTokens: 4000,
      })

      // Clean the response to ensure it's valid JSON
      let cleanedText = text.trim()
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/```json\n?/, "").replace(/\n?```$/, "")
      }
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/```\n?/, "").replace(/\n?```$/, "")
      }

      const gradingResults = JSON.parse(cleanedText)

      // Validate the grading structure
      if (!gradingResults.questionResults || !Array.isArray(gradingResults.questionResults)) {
        throw new Error("Invalid grading structure - missing questionResults array")
      }

      return NextResponse.json(gradingResults)
    } catch (aiError) {
      console.error("OpenAI grading failed:", aiError)

      // Return enhanced fallback grading
      const fallbackGrading = generateFallbackGrading(examData, answers)
      return NextResponse.json({
        ...fallbackGrading,
        isMock: true,
        mockMessage: "Using automated grading - OpenAI grading failed",
      })
    }
  } catch (error) {
    console.error("Error in grade-exam route:", error)
    return NextResponse.json(
      {
        error: "Failed to grade exam",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function generateFallbackGrading(examData: any, answers: any) {
  let totalScore = 0
  const questionResults = []

  for (const question of examData.questions) {
    const userAnswer = answers[question.id] || ""
    let pointsEarned = 0
    let isCorrect = false

    if (question.type === "multiple-choice") {
      isCorrect = userAnswer.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase()
      pointsEarned = isCorrect ? question.points : 0
    } else {
      // For short answer, give partial credit based on answer length and presence
      if (userAnswer.trim().length > 10) {
        pointsEarned = Math.round(question.points * 0.7) // 70% credit for substantial answers
        isCorrect = true
      } else if (userAnswer.trim().length > 0) {
        pointsEarned = Math.round(question.points * 0.3) // 30% credit for minimal answers
      }
    }

    totalScore += pointsEarned

    questionResults.push({
      questionId: question.id,
      userAnswer: userAnswer || "No answer provided",
      isCorrect,
      pointsEarned,
      maxPoints: question.points,
      feedback: isCorrect
        ? "Good work! Your answer demonstrates understanding of the concept."
        : "This answer needs improvement. Please review the topic and try again.",
      correctAnswer: question.correctAnswer,
    })
  }

  const percentage = Math.round((totalScore / examData.totalPoints) * 100)

  return {
    totalScore,
    maxScore: examData.totalPoints,
    percentage,
    feedback: `You scored ${totalScore} out of ${examData.totalPoints} points (${percentage}%). ${
      percentage >= 80
        ? "Excellent work! You have a strong understanding of the material."
        : percentage >= 60
          ? "Good effort! Review the areas where you lost points to improve further."
          : "Keep studying! Focus on understanding the fundamental concepts."
    }`,
    questionResults,
  }
}
