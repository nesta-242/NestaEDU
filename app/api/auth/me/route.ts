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
    const user = await findUserById(decoded.id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
} 