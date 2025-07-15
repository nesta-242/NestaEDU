import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt-auth'
import { findUserById } from '@/lib/auth'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  try {
    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    console.log('Decoded token:', decoded)
    
    const user = await findUserById(decoded.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.log('Found user:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarExists: !!user.avatar,
      avatarLength: user.avatar?.length || 0,
      avatarType: typeof user.avatar,
      avatarPreview: user.avatar?.substring(0, 50) + '...' || 'null'
    })
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarExists: !!user.avatar,
        avatarLength: user.avatar?.length || 0,
        avatarType: typeof user.avatar,
        avatarPreview: user.avatar?.substring(0, 50) + '...' || 'null',
        fullAvatar: user.avatar // Include the full avatar for testing
      }
    })
  } catch (error) {
    console.error('Error in test-me:', error)
    return NextResponse.json({ error: 'Server error', details: error }, { status: 500 })
  }
} 