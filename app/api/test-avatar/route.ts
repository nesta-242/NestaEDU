export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/lib/jwt-auth'

// Create Supabase client function to handle runtime configuration
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET - Test avatar functionality
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseClient()
    
    // Test 1: Check current avatar in database
    const { data: currentProfile, error: fetchError } = await supabase
      .from('users')
      .select('id, avatar, full_image')
      .eq('id', userId)
      .single()

    if (fetchError) {
      return NextResponse.json({ 
        error: 'Failed to fetch profile',
        details: fetchError.message 
      }, { status: 500 })
    }

    // Test 2: Try to update with a test avatar
    const testAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update({
        avatar: testAvatar,
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

    // Test 3: Fetch again to verify it was saved
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('users')
      .select('id, avatar, full_image')
      .eq('id', userId)
      .single()

    if (verifyError) {
      return NextResponse.json({ 
        error: 'Failed to verify avatar',
        details: verifyError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tests: {
        beforeUpdate: {
          avatar: currentProfile.avatar,
          avatarType: typeof currentProfile.avatar,
          avatarLength: currentProfile.avatar?.length
        },
        afterUpdate: {
          avatar: updatedProfile.avatar,
          avatarType: typeof updatedProfile.avatar,
          avatarLength: updatedProfile.avatar?.length
        },
        afterVerify: {
          avatar: verifyProfile.avatar,
          avatarType: typeof verifyProfile.avatar,
          avatarLength: verifyProfile.avatar?.length
        }
      }
    })
  } catch (error) {
    console.error('Error in avatar test:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
} 