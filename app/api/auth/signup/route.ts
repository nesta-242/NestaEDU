import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('Signup API called')
    const { email, password, firstName, lastName, phone, gradeLevel, school } = await request.json()
    console.log('Signup data received:', { email, firstName, lastName, gradeLevel, school, password: '[HIDDEN]' })

    // Validate input
    if (!email || !password) {
      console.log('Validation failed: missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      console.log('Validation failed: password too short')
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    console.log('Checking if user already exists')
    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      console.log('User already exists')
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    console.log('Creating new user')
    // Create user
    const user = await createUser(email, password, {
      firstName,
      lastName,
      phone,
      gradeLevel,
      school,
    })

    console.log('User created successfully:', user.id)

    // Generate JWT token
    console.log('Generating JWT token')
    const token = await generateToken(user)
    console.log('JWT token generated')

    const response = {
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        gradeLevel: user.gradeLevel,
        school: user.school,
        avatar: user.avatar,
      },
      token: token
    }

    console.log('Sending successful response')
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 