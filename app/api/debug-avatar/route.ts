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

// GET - Debug avatar functionality
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseClient()
    
    // Get current profile
    const { data: profile, error: fetchError } = await supabase
      .from('users')
      .select('id, avatar, full_image, first_name, last_name')
      .eq('id', userId)
      .single()

    if (fetchError) {
      return NextResponse.json({ 
        error: 'Failed to fetch profile',
        details: fetchError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        avatar: profile.avatar,
        fullImage: profile.full_image,
        avatarExists: !!profile.avatar,
        avatarType: typeof profile.avatar,
        avatarLength: profile.avatar?.length || 0,
        avatarStartsWithDataImage: profile.avatar?.startsWith('data:image/') || false,
        fullImageExists: !!profile.full_image,
        fullImageType: typeof profile.full_image,
        fullImageLength: profile.full_image?.length || 0,
      }
    })
  } catch (error) {
    console.error('Error in debug avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Test avatar update
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { avatar, fullImage } = await request.json()

    console.log('Debug avatar POST - Received data:')
    console.log('Avatar exists:', !!avatar)
    console.log('Avatar type:', typeof avatar)
    console.log('Avatar length:', avatar?.length)
    console.log('Full image exists:', !!fullImage)
    console.log('Full image type:', typeof fullImage)
    console.log('Full image length:', fullImage?.length)

    const supabase = createSupabaseClient()
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update({
        avatar: avatar,
        full_image: fullImage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, avatar, full_image')
      .single()

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update avatar',
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      updatedProfile: {
        id: updatedProfile.id,
        avatar: updatedProfile.avatar,
        fullImage: updatedProfile.full_image,
        avatarExists: !!updatedProfile.avatar,
        avatarType: typeof updatedProfile.avatar,
        avatarLength: updatedProfile.avatar?.length || 0,
        avatarStartsWithDataImage: updatedProfile.avatar?.startsWith('data:image/') || false,
      }
    })
  } catch (error) {
    console.error('Error in debug avatar POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 