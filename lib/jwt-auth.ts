import { SignJWT, jwtVerify } from 'jose'

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