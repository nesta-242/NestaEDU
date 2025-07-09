import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { createClient } from '@/utils/supabase/server'

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
    const supabase = await createClient()
    
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
      throw new Error('Failed to create user.')
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
    console.error('Database error in createUser:', error)
    throw new Error('Database connection failed. Please check your database configuration.')
  }
}

export async function findUserByEmail(email: string): Promise<(UserData & { passwordHash: string }) | null> {
  try {
    const supabase = await createClient()
    
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
    const supabase = await createClient()
    
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