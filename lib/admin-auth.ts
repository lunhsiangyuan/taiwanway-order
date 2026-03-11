import { cookies } from 'next/headers'
import crypto from 'crypto'

const ADMIN_COOKIE = 'tw-admin-token'
const SECRET = process.env.ADMIN_PASSWORD || ''

export function signToken(): string {
  const payload = `admin:${Date.now()}`
  const hmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  return Buffer.from(`${payload}:${hmac}`).toString('base64')
}

export function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const parts = decoded.split(':')
    if (parts.length !== 3) return false
    const [prefix, timestamp, signature] = parts
    if (prefix !== 'admin') return false
    // Token 有效期 24 小時
    const age = Date.now() - Number(timestamp)
    if (isNaN(age) || age > 86400000 || age < 0) return false
    const expected = crypto.createHmac('sha256', SECRET).update(`${prefix}:${timestamp}`).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function requireAdmin(): Promise<Response | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  if (!token || !verifyToken(token)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
