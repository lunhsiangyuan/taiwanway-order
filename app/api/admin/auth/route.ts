import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { signToken, verifyToken } from '@/lib/admin-auth'

const ADMIN_COOKIE = 'tw-admin-token'
const TOKEN_MAX_AGE = 60 * 60 * 24 // 24 小時

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = signToken()

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  })

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
  return NextResponse.json({ success: true })
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true })
}
