export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate token
    const token = await generateToken(user)

    // Create response with user data (excluding password)
    const { passwordHash, ...userData } = user

    const response = NextResponse.json({
      message: 'Login successful',
      user: userData
    })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    response.cookies.set('test-cookie', 'hello', {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60,
      sameSite: 'lax',
      secure: false,
    })
    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 