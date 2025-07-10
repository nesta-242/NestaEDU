export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/jwt-auth'
import { API_CONFIG } from '../../../../config/api-keys'

// Create Supabase client function to handle runtime configuration
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || API_CONFIG.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_SERVICE_ROLE_KEY

  // Validate configuration at runtime
  if (!supabaseUrl || supabaseUrl === 'your-supabase-url') {
    throw new Error('Supabase URL not configured')
  }

  if (!supabaseServiceKey || supabaseServiceKey === 'your-supabase-service-role-key') {
    throw new Error('Supabase service role key not configured')
  }

  // Log configuration for debugging (remove in production)
  console.log('Supabase URL:', supabaseUrl)
  console.log('Service role key length:', supabaseServiceKey?.length || 0)
  console.log('Service role key starts with:', supabaseServiceKey?.substring(0, 20) + '...')

  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET - Retrieve user profile
export async function GET(request: NextRequest) {
  try {
    // Get user ID from request headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseClient()
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, grade_level, school, avatar')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Supabase error fetching profile:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone,
      gradeLevel: profile.grade_level,
      school: profile.school,
      avatar: profile.avatar,
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    // Get user ID from request headers (set by middleware)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName, phone, gradeLevel, school, avatar } = await request.json()

    const supabase = createSupabaseClient()
    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        grade_level: gradeLevel,
        school: school,
        avatar: avatar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, email, first_name, last_name, phone, grade_level, school, avatar')
      .single()

    if (error) {
      console.error('Supabase error updating profile:', error)
      return NextResponse.json(
        { error: `Failed to update profile: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: updatedProfile.id,
      email: updatedProfile.email,
      firstName: updatedProfile.first_name,
      lastName: updatedProfile.last_name,
      phone: updatedProfile.phone,
      gradeLevel: updatedProfile.grade_level,
      school: updatedProfile.school,
      avatar: updatedProfile.avatar,
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 