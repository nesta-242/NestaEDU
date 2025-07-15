export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client function to handle runtime configuration
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET - Comprehensive avatar debugging
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'No user ID in headers' }, { status: 401 })
    }

    const supabase = createSupabaseClient()
    
    // Step 1: Check current user record
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError) {
      return NextResponse.json({ 
        error: 'Failed to fetch user',
        details: fetchError.message 
      }, { status: 500 })
    }

    // Step 2: Check database schema for avatar field
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('get_column_info', { table_name: 'users', column_name: 'avatar' })
      .single()

    // Step 3: Try to update with a test avatar
    const testAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({
        avatar: testAvatar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update avatar',
        details: updateError.message 
      }, { status: 500 })
    }

    // Step 4: Fetch again to verify
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (verifyError) {
      return NextResponse.json({ 
        error: 'Failed to verify update',
        details: verifyError.message 
      }, { status: 500 })
    }

    // Step 5: Try a raw SQL query to see what's actually in the database
    const { data: rawResult, error: rawError } = await supabase
      .rpc('get_user_avatar_raw', { user_id: userId })

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        currentUser: {
          id: currentUser.id,
          email: currentUser.email,
          avatar: currentUser.avatar,
          avatarType: typeof currentUser.avatar,
          avatarLength: currentUser.avatar?.length,
          hasAvatar: !!currentUser.avatar
        },
        updateResult: {
          id: updateResult.id,
          avatar: updateResult.avatar,
          avatarType: typeof updateResult.avatar,
          avatarLength: updateResult.avatar?.length,
          hasAvatar: !!updateResult.avatar
        },
        verifyUser: {
          id: verifyUser.id,
          avatar: verifyUser.avatar,
          avatarType: typeof verifyUser.avatar,
          avatarLength: verifyUser.avatar?.length,
          hasAvatar: !!verifyUser.avatar
        },
        rawQuery: {
          success: !rawError,
          data: rawResult,
          error: rawError?.message
        },
        schemaInfo: {
          success: !schemaError,
          data: schemaInfo,
          error: schemaError?.message
        }
      }
    })
  } catch (error) {
    console.error('Error in avatar debug:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
} 