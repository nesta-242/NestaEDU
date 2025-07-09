import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getOpenAIKey } from "@/config/api-keys"

export async function POST(request: NextRequest) {
  try {
    const { subject } = await request.json()

    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 })
    }

    // Check if OpenAI API key is available
    const apiKey = getOpenAIKey()
    if (!apiKey) {
      console.error("OpenAI API key not found")
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          isMock: true,
          mockMessage: "Using mock exam - OpenAI API key not available",
        },
        { status: 500 },
      )
    }

    // Set the environment variable for the AI SDK
    process.env.OPENAI_API_KEY = apiKey

    // Determine exam details based on subject
    const getExamConfig = (subject: string) => {
      switch (subject.toLowerCase()) {
        case "bjc-math":
          return {
            title: "BJC Mathematics Practice Exam",
            level: "Middle School (BJC)",
            topics:
              "basic algebra, geometry, fractions, decimals, percentages, simple equations, basic statistics, number operations, measurement",
            duration: 30,
            totalQuestions: 15,
            mcQuestions: 10,
            saQuestions: 5,
            mcPoints: 4,
            saPoints: 8,
            examStyle:
              "BJC Mathematics past papers format with emphasis on fundamental mathematical concepts, problem-solving, and practical applications. Questions should mirror the style and difficulty of official BJC Mathematics examinations from 1997-2023.",
          }
        case "bjc-general-science":
          return {
            title: "BJC General Science Practice Exam",
            level: "Middle School (BJC)",
            topics:
              "basic biology, chemistry, physics, earth science, scientific method, simple experiments, natural phenomena, environmental science",
            duration: 30,
            totalQuestions: 15,
            mcQuestions: 10,
            saQuestions: 5,
            mcPoints: 4,
            saPoints: 8,
            examStyle:
              "BJC General Science past papers format with emphasis on scientific understanding, practical applications, and scientific inquiry. Questions should mirror the style and difficulty of official BJC General Science examinations from 2007-2023.",
          }
        case "bjc-health-science":
          return {
            title: "BJC Health Science Practice Exam",
            level: "Middle School (BJC)",
            topics:
              "human anatomy, health and nutrition, disease prevention, medical basics, personal hygiene, first aid, mental health, community health",
            duration: 30,
            totalQuestions: 15,
            mcQuestions: 10,
            saQuestions: 5,
            mcPoints: 4,
            saPoints: 8,
            examStyle:
              "BJC Health Science past papers format with emphasis on health education, medical knowledge, and practical health applications. Questions should mirror the style and difficulty of official BJC Health Science examinations from 1999-2023.",
          }
        case "bgcse-math":
          return {
            title: "BGCSE Mathematics Practice Exam",
            level: "High School (BGCSE)",
            topics:
              "advanced algebra, trigonometry, calculus basics, statistics, geometry proofs, complex equations, coordinate geometry, functions",
            duration: 45,
            totalQuestions: 25,
            mcQuestions: 15,
            saQuestions: 10,
            mcPoints: 3,
            saPoints: 5.5,
            examStyle:
              "BGCSE Mathematics past papers format with emphasis on problem-solving, mathematical reasoning, and practical applications. Questions should mirror the style and difficulty of official BGCSE Mathematics examinations from 1999-2023.",
          }
        case "bgcse-chemistry":
          return {
            title: "BGCSE Chemistry Practice Exam",
            level: "High School (BGCSE)",
            topics:
              "organic chemistry, chemical bonding, thermodynamics, electrochemistry, chemical kinetics, equilibrium, acids and bases, redox reactions, periodic table trends, molecular structure",
            duration: 45,
            totalQuestions: 25,
            mcQuestions: 15,
            saQuestions: 10,
            mcPoints: 3,
            saPoints: 5.5,
            examStyle:
              "BGCSE Chemistry past papers format with emphasis on practical applications, chemical calculations, and theoretical understanding. Questions should mirror the style and difficulty of official BGCSE Chemistry examinations from 1998-2023.",
          }
        case "bgcse-physics":
          return {
            title: "BGCSE Physics Practice Exam",
            level: "High School (BGCSE)",
            topics:
              "mechanics, electricity and magnetism, waves and optics, thermodynamics, modern physics, nuclear physics, particle physics, electromagnetic radiation",
            duration: 45,
            totalQuestions: 25,
            mcQuestions: 15,
            saQuestions: 10,
            mcPoints: 3,
            saPoints: 5.5,
            examStyle:
              "BGCSE Physics past papers format with emphasis on mathematical problem-solving, physics principles, and practical applications. Questions should mirror the style and difficulty of official BGCSE Physics examinations from 2009-2019.",
          }
        case "bgcse-biology":
          return {
            title: "BGCSE Biology Practice Exam",
            level: "High School (BGCSE)",
            topics:
              "cell biology, genetics, evolution, ecology, human physiology, plant biology, molecular biology, biotechnology, classification, reproduction",
            duration: 45,
            totalQuestions: 25,
            mcQuestions: 15,
            saQuestions: 10,
            mcPoints: 3,
            saPoints: 5.5,
            examStyle:
              "BGCSE Biology past papers format with emphasis on biological processes, scientific analysis, and practical biology applications. Questions should mirror the style and difficulty of official BGCSE Biology examinations from 2000-2023.",
          }
        case "bgcse-combined-science":
          return {
            title: "BGCSE Combined Science Practice Exam",
            level: "High School (BGCSE)",
            topics:
              "integrated biology, chemistry, and physics concepts, scientific method, practical applications, interdisciplinary connections",
            duration: 45,
            totalQuestions: 25,
            mcQuestions: 15,
            saQuestions: 10,
            mcPoints: 3,
            saPoints: 5.5,
            examStyle:
              "BGCSE Combined Science past papers format covering all three sciences with emphasis on connections between disciplines and practical applications. Questions should mirror the style and difficulty of official BGCSE Combined Science examinations from 2003-2023.",
          }
        default:
          return {
            title: "Practice Exam",
            level: "General",
            topics: "various academic topics",
            duration: 30,
            totalQuestions: 15,
            mcQuestions: 10,
            saQuestions: 5,
            mcPoints: 4,
            saPoints: 8,
          }
      }
    }

    const examConfig = getExamConfig(subject)
    const totalPoints = examConfig.mcQuestions * examConfig.mcPoints + examConfig.saQuestions * examConfig.saPoints

    // Subject-specific prompts based on past papers
    const getSubjectSpecificPrompt = (config: any) => {
      switch (subject.toLowerCase()) {
        case "bjc-math":
          return `
SPECIAL INSTRUCTIONS FOR BJC MATHEMATICS:
Generate questions that mirror the style and difficulty of official BJC Mathematics past papers (1997-2023).

MATHEMATICS-SPECIFIC REQUIREMENTS:
- Include questions on basic arithmetic and number operations
- Cover fractions, decimals, and percentages
- Include basic algebra and simple equations
- Test understanding of geometry and measurement
- Include basic statistics and data interpretation
- Cover practical mathematics applications
- Include word problems and real-world scenarios
- Test mathematical reasoning and problem-solving

QUESTION STYLE GUIDELINES:
- Multiple choice should test fundamental mathematical concepts
- Include questions with clear mathematical notation
- Use age-appropriate language and contexts
- Include questions requiring basic calculations
- Short answer questions should require step-by-step solutions
- Include questions that test application of mathematical principles to everyday situations`

        case "bjc-general-science":
          return `
SPECIAL INSTRUCTIONS FOR BJC GENERAL SCIENCE:
Generate questions that mirror the style and difficulty of official BJC General Science past papers (2007-2023).

GENERAL SCIENCE-SPECIFIC REQUIREMENTS:
- Include questions on basic biology concepts
- Cover fundamental chemistry principles
- Include basic physics concepts and phenomena
- Test understanding of earth science and environment
- Include scientific method and inquiry
- Cover natural phenomena and observations
- Include practical science applications
- Test scientific reasoning and understanding

QUESTION STYLE GUIDELINES:
- Multiple choice should test basic scientific concepts
- Include questions with simple scientific diagrams or scenarios
- Use age-appropriate scientific terminology
- Include questions requiring observation and analysis
- Short answer questions should require explanations of scientific processes
- Include questions that test application of scientific principles to everyday life`

        case "bjc-health-science":
          return `
SPECIAL INSTRUCTIONS FOR BJC HEALTH SCIENCE:
Generate questions that mirror the style and difficulty of official BJC Health Science past papers (1999-2023).

HEALTH SCIENCE-SPECIFIC REQUIREMENTS:
- Include questions on human anatomy and physiology
- Cover health and nutrition principles
- Include disease prevention and health promotion
- Test understanding of personal hygiene and safety
- Include first aid and emergency care basics
- Cover mental health and wellness
- Include community health concepts
- Test health education and awareness

QUESTION STYLE GUIDELINES:
- Multiple choice should test health knowledge and concepts
- Include questions with health scenarios and case studies
- Use appropriate medical and health terminology
- Include questions requiring health decision-making
- Short answer questions should require explanations of health processes
- Include questions that test application of health principles to daily life`

        case "bgcse-chemistry":
          return `
SPECIAL INSTRUCTIONS FOR BGCSE CHEMISTRY:
Generate questions that mirror the style and difficulty of official BGCSE Chemistry past papers (1998-2023). 

CHEMISTRY-SPECIFIC REQUIREMENTS:
- Include questions on chemical calculations (molar mass, stoichiometry, concentration)
- Cover organic chemistry nomenclature and reactions
- Include questions on chemical bonding and molecular structure
- Test understanding of periodic table trends and properties
- Include acid-base chemistry and pH calculations
- Cover redox reactions and electrochemistry
- Include thermodynamics and chemical kinetics
- Test practical chemistry knowledge and laboratory techniques

QUESTION STYLE GUIDELINES:
- Multiple choice should test conceptual understanding and calculations
- Include questions with chemical equations and formulas
- Use proper chemical nomenclature and terminology
- Include questions requiring interpretation of data/graphs
- Short answer questions should require explanations of chemical processes
- Include questions that test application of chemical principles to real-world scenarios`

        case "bgcse-biology":
          return `
SPECIAL INSTRUCTIONS FOR BGCSE BIOLOGY:
Generate questions that mirror the style and difficulty of official BGCSE Biology past papers (2000-2023).

BIOLOGY-SPECIFIC REQUIREMENTS:
- Include questions on cell structure and function
- Cover genetics, inheritance, and DNA/RNA
- Include ecology and environmental biology
- Test understanding of human physiology and anatomy
- Include plant biology and photosynthesis
- Cover evolution and natural selection
- Include molecular biology and biotechnology
- Test practical biology knowledge and experimental design

QUESTION STYLE GUIDELINES:
- Multiple choice should test biological concepts and processes
- Include questions with diagrams and biological illustrations
- Use proper biological terminology and classification
- Include questions requiring interpretation of experimental data
- Short answer questions should require explanations of biological processes
- Include questions that test application of biological principles to real-world scenarios`

        case "bgcse-physics":
          return `
SPECIAL INSTRUCTIONS FOR BGCSE PHYSICS:
Generate questions that mirror the style and difficulty of official BGCSE Physics past papers (2009-2019).

PHYSICS-SPECIFIC REQUIREMENTS:
- Include questions on mechanics (motion, forces, energy)
- Cover electricity and magnetism
- Include waves, optics, and sound
- Test understanding of thermodynamics and heat
- Include modern physics and atomic structure
- Cover nuclear physics and radioactivity
- Include practical physics and experimental methods
- Test mathematical problem-solving with physics formulas

QUESTION STYLE GUIDELINES:
- Multiple choice should test physics concepts and calculations
- Include questions with physics formulas and equations
- Use proper physics units and notation
- Include questions requiring interpretation of graphs and data
- Short answer questions should require calculations and explanations
- Include questions that test application of physics principles to real-world scenarios`

        case "bgcse-combined-science":
          return `
SPECIAL INSTRUCTIONS FOR BGCSE COMBINED SCIENCE:
Generate questions that mirror the style and difficulty of official BGCSE Combined Science past papers (2003-2023).

COMBINED SCIENCE-SPECIFIC REQUIREMENTS:
- Include questions from biology, chemistry, and physics
- Cover interdisciplinary connections between sciences
- Include practical science and experimental methods
- Test understanding of scientific method and inquiry
- Include environmental science and sustainability
- Cover health and safety in science
- Include technology applications in science
- Test integrated scientific thinking and problem-solving

QUESTION STYLE GUIDELINES:
- Multiple choice should test concepts from all three sciences
- Include questions that connect different scientific disciplines
- Use proper scientific terminology from all areas
- Include questions requiring interpretation of scientific data
- Short answer questions should require explanations across scientific fields
- Include questions that test application of scientific principles to real-world scenarios`

        case "bgcse-math":
          return `
SPECIAL INSTRUCTIONS FOR BGCSE MATHEMATICS:
Generate questions that mirror the style and difficulty of official BGCSE Mathematics past papers (1999-2023).

MATHEMATICS-SPECIFIC REQUIREMENTS:
- Include questions on algebra and algebraic manipulation
- Cover trigonometry and trigonometric functions
- Include coordinate geometry and analytical geometry
- Test understanding of functions and graphs
- Include calculus basics (differentiation and integration)
- Cover statistics and probability
- Include geometric proofs and constructions
- Test mathematical reasoning and problem-solving

QUESTION STYLE GUIDELINES:
- Multiple choice should test mathematical concepts and calculations
- Include questions with mathematical formulas and equations
- Use proper mathematical notation and symbols
- Include questions requiring interpretation of graphs and data
- Short answer questions should require step-by-step solutions
- Include questions that test application of mathematical principles to real-world scenarios`

        default:
          return ""
      }
    }

    const subjectSpecificPrompt = getSubjectSpecificPrompt(examConfig)

    const prompt = `Generate a comprehensive practice exam for ${examConfig.title} at the ${examConfig.level} level.

EXAM REQUIREMENTS:
- Create exactly ${examConfig.totalQuestions} questions total
- ${examConfig.mcQuestions} multiple choice questions (${examConfig.mcPoints} points each = ${examConfig.mcQuestions * examConfig.mcPoints} points)
- ${examConfig.saQuestions} short answer questions (${examConfig.saPoints} points each = ${examConfig.saQuestions * examConfig.saPoints} points)
- Total exam worth: ${totalPoints} points
- Duration: ${examConfig.duration} minutes
- Topics to cover: ${examConfig.topics}

${subjectSpecificPrompt}

CRITICAL MULTIPLE CHOICE REQUIREMENTS:
- Each multiple choice question MUST have exactly 4 options (A, B, C, D)
- The correct answer MUST be one of the 4 provided options
- The correct answer field must contain the EXACT text of one of the options
- All options must be plausible but clearly distinguishable
- Double-check that correctAnswer matches one of the options exactly

QUESTION QUALITY STANDARDS:
- Questions should be appropriate for ${examConfig.level} students
- Multiple choice options should be realistic and educational
- Short answer questions should require 2-3 sentences to answer properly
- Include a mix of difficulty levels (easy, medium, challenging)
- Ensure questions test understanding, not just memorization
- Use proper scientific/mathematical terminology and notation

RESPONSE FORMAT - Return ONLY valid JSON in this exact structure:
{
  "title": "${examConfig.title}",
  "duration": ${examConfig.duration},
  "totalPoints": ${totalPoints},
  "questions": [
    {
      "id": 1,
      "type": "multiple-choice",
      "question": "Clear, specific question text here",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswer": "Option A text",
      "points": ${examConfig.mcPoints}
    },
    {
      "id": 2,
      "type": "short-answer",
      "question": "Clear question requiring explanation",
      "correctAnswer": "Expected answer with key points",
      "points": ${examConfig.saPoints}
    }
  ]
}

VALIDATION CHECKLIST:
- Verify each multiple choice correctAnswer exactly matches one of the 4 options
- Ensure all questions are appropriate for the education level
- Check that point values are correct
- Confirm total questions = ${examConfig.totalQuestions}

Generate the exam now:`

    try {
      console.log("Generating exam with OpenAI for subject:", subject)

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
        temperature: 0.7,
        maxTokens: 8000,
      })

      console.log("OpenAI response received, parsing JSON...")

      // Clean the response to ensure it's valid JSON
      let cleanedText = text.trim()
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/```json\n?/, "").replace(/\n?```$/, "")
      }
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/```\n?/, "").replace(/\n?```$/, "")
      }

      const examData = JSON.parse(cleanedText)

      // Validate the exam structure
      if (!examData.questions || !Array.isArray(examData.questions)) {
        throw new Error("Invalid exam structure - missing questions array")
      }

      if (examData.questions.length !== examConfig.totalQuestions) {
        console.warn(`Expected ${examConfig.totalQuestions} questions, got ${examData.questions.length}`)
      }

      // Validate multiple choice questions
      examData.questions.forEach((question: any, index: number) => {
        if (question.type === "multiple-choice") {
          if (!question.options || question.options.length !== 4) {
            console.error(`Question ${index + 1}: Must have exactly 4 options`)
          }
          if (!question.options.includes(question.correctAnswer)) {
            console.error(
              `Question ${index + 1}: Correct answer "${question.correctAnswer}" not found in options:`,
              question.options,
            )
            // Fix by setting correct answer to first option
            question.correctAnswer = question.options[0]
          }
        }
      })

      console.log("Exam generated successfully with", examData.questions.length, "questions")
      return NextResponse.json(examData)
    } catch (aiError) {
      console.error("OpenAI generation failed:", aiError)

      // Return enhanced fallback exam
      const fallbackExam = generateFallbackExam(subject, examConfig)
      return NextResponse.json({
        ...fallbackExam,
        isMock: true,
        mockMessage: "Using mock exam - OpenAI generation failed",
      })
    }
  } catch (error) {
    console.error("Error in generate-exam route:", error)
    return NextResponse.json(
      {
        error: "Failed to generate exam",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function generateFallbackExam(subject: string, examConfig: any) {
  const subjectName = examConfig.title.replace(" Practice Exam", "")

  // Generate questions based on exam configuration
  const questions = []

  // Multiple Choice Questions
  for (let i = 1; i <= examConfig.mcQuestions; i++) {
    questions.push({
      id: i,
      type: "multiple-choice",
      question: `What is an important concept to understand in ${subjectName}?`,
      options: [
        "Understanding fundamental principles and their applications",
        "Memorizing formulas without understanding context",
        "Avoiding practical applications entirely",
        "Focusing only on theoretical aspects without practice",
      ],
      correctAnswer: "Understanding fundamental principles and their applications",
      points: examConfig.mcPoints,
    })
  }

  // Short Answer Questions
  for (let i = 1; i <= examConfig.saQuestions; i++) {
    questions.push({
      id: examConfig.mcQuestions + i,
      type: "short-answer",
      question: `Explain why understanding fundamental concepts is important in ${subjectName}.`,
      correctAnswer: `Understanding fundamental concepts in ${subjectName} allows students to apply knowledge to new situations, solve complex problems, and build connections between different topics. This approach provides better long-term retention and practical application skills.`,
      points: examConfig.saPoints,
    })
  }

  return {
    title: examConfig.title,
    duration: examConfig.duration,
    totalPoints: examConfig.mcQuestions * examConfig.mcPoints + examConfig.saQuestions * examConfig.saPoints,
    questions: questions,
  }
}
