import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'
import { API_CONFIG } from '../config/api-keys'

export interface UserData {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  gradeLevel?: string
  school?: string
  avatar?: string
}

// JWT functions - safe for Edge Runtime
export async function generateToken(user: UserData): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  return await new SignJWT({ id: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<UserData | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as UserData
  } catch (error) {
    return null
  }
}

// Password functions - Node.js only (use in API routes with runtime = 'nodejs')
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Database functions - Node.js only
export async function createUser(email: string, password: string, userData: Partial<UserData> = {}): Promise<UserData> {
  try {
    const hashedPassword = await hashPassword(password)
    
    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || API_CONFIG.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || API_CONFIG.SUPABASE_ANON_KEY
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Service key exists:', !!supabaseServiceKey)
    console.log('Anon key exists:', !!supabaseAnonKey)
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured')
    }
    
    // Try using service role key first, then fall back to anon key
    let keyToUse = supabaseServiceKey
    let keyType = 'service role'
    
    if (!keyToUse) {
      keyToUse = supabaseAnonKey
      keyType = 'anon'
    }
    
    if (!keyToUse) {
      throw new Error('Supabase authentication keys not configured')
    }
    
    console.log('Using Supabase key type:', keyType)
    console.log('Key prefix:', keyToUse.substring(0, 20) + '...')
    
    const supabase = createClient(supabaseUrl, keyToUse)
    
    console.log('Attempting to insert user with data:', {
      email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      grade_level: userData.gradeLevel,
      school: userData.school,
      password_hash: '[HIDDEN]'
    })
    
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        grade_level: userData.gradeLevel,
        school: userData.school,
        avatar: userData.avatar,
      })
      .select('id, email, first_name, last_name, phone, grade_level, school, avatar')
      .single()
    
    if (error) {
      console.error('Supabase error in createUser:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      throw new Error(`Failed to create user: ${error.message}`)
    }
    
    console.log('User created successfully:', user)
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      gradeLevel: user.grade_level,
      school: user.school,
      avatar: user.avatar,
    }
  } catch (error: any) {
    console.error('Database error in createUser:', error)
    throw new Error(`Database connection failed: ${error.message}`)
  }
}

export async function findUserByEmail(email: string): Promise<(UserData & { passwordHash: string }) | null> {
  try {
    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || API_CONFIG.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || API_CONFIG.SUPABASE_ANON_KEY
    
    if (!supabaseUrl) {
      console.error('Missing Supabase URL')
      throw new Error('Supabase URL not configured')
    }
    
    // Use service role key if available, otherwise fall back to anon key (limited functionality)
    const keyToUse = supabaseServiceKey || supabaseAnonKey
    if (!keyToUse) {
      console.error('Missing Supabase keys')
      throw new Error('Supabase authentication keys not configured')
    }
    
    const supabase = createClient(supabaseUrl, keyToUse)
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, first_name, last_name, phone, grade_level, school, avatar')
      .eq('email', email)
      .single()
    
    if (error || !user) {
      return null
    }
    
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.password_hash,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      gradeLevel: user.grade_level,
      school: user.school,
      avatar: user.avatar,
    }
  } catch (error) {
    console.error('Database error in findUserByEmail:', error)
    throw new Error('Database connection failed. Please check your database configuration.')
  }
}

export async function findUserById(id: string): Promise<UserData | null> {
  try {
    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || API_CONFIG.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || API_CONFIG.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || API_CONFIG.SUPABASE_ANON_KEY
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured')
    }
    
    // Use service role key if available, otherwise fall back to anon key
    const keyToUse = supabaseServiceKey || supabaseAnonKey
    if (!keyToUse) {
      throw new Error('Supabase authentication keys not configured')
    }
    
    const supabase = createClient(supabaseUrl, keyToUse)
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone, grade_level, school, avatar')
      .eq('id', id)
      .single()
    
    if (error || !user) {
      return null
    }
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      gradeLevel: user.grade_level,
      school: user.school,
      avatar: user.avatar,
    }
  } catch (error) {
    console.error('Database error in findUserById:', error)
    throw new Error('Database connection failed. Please check your database configuration.')
  }
} 