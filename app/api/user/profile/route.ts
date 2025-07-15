export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/jwt-auth'

// Create Supabase client function to handle runtime configuration
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Validate configuration at runtime
  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured')
  }

  if (!supabaseServiceKey) {
    throw new Error('Supabase service role key not configured')
  }

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
      .select('id, email, first_name, last_name, phone, grade_level, school, avatar, full_image')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Supabase error fetching profile:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('GET /api/user/profile - Raw profile from database:', profile)
    console.log('GET /api/user/profile - Avatar from database:', profile.avatar)
    console.log('GET /api/user/profile - Avatar type:', typeof profile.avatar)
    console.log('GET /api/user/profile - Avatar length:', profile.avatar?.length)

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone,
      gradeLevel: profile.grade_level,
      school: profile.school,
      avatar: profile.avatar,
      fullImage: profile.full_image,
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

    const { firstName, lastName, phone, gradeLevel, school, avatar, fullImage } = await request.json()

    // Store null in DB if avatar or fullImage is empty string
    const avatarToStore = avatar === '' ? null : avatar
    const fullImageToStore = fullImage === '' ? null : fullImage

    console.log('PUT /api/user/profile - Received avatar data:', avatar ? 'exists' : 'null')
    console.log('PUT /api/user/profile - Avatar type:', typeof avatar)
    console.log('PUT /api/user/profile - Avatar length:', avatar?.length)
    console.log('PUT /api/user/profile - Avatar starts with data:image/:', avatar?.startsWith('data:image/'))

    const supabase = createSupabaseClient()
    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        grade_level: gradeLevel,
        school: school,
        avatar: avatarToStore,
        full_image: fullImageToStore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, email, first_name, last_name, phone, grade_level, school, avatar, full_image')
      .single()

    if (error) {
      console.error('Supabase error updating profile:', error)
      return NextResponse.json(
        { error: `Failed to update profile: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('PUT /api/user/profile - Updated profile from database:', updatedProfile)
    console.log('PUT /api/user/profile - Avatar after update:', updatedProfile.avatar)
    console.log('PUT /api/user/profile - Avatar type after update:', typeof updatedProfile.avatar)

    return NextResponse.json({
      id: updatedProfile.id,
      email: updatedProfile.email,
      firstName: updatedProfile.first_name,
      lastName: updatedProfile.last_name,
      phone: updatedProfile.phone,
      gradeLevel: updatedProfile.grade_level,
      school: updatedProfile.school,
      avatar: updatedProfile.avatar,
      fullImage: updatedProfile.full_image,
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 