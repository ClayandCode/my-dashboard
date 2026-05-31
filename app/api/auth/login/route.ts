import { NextResponse } from 'next/server'
import { createAuthToken, authCookieOptions } from '@/lib/auth'

export async function POST(request: Request) {
  const { password } = await request.json()

  if (password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const token = await createAuthToken()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(authCookieOptions(token))
  return response
}
