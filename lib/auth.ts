const COOKIE_NAME = 'pos_auth'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function getSecret(): ArrayBuffer {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET env var is not set')
  return new TextEncoder().encode(secret).buffer as ArrayBuffer
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    getSecret(),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return Buffer.from(sig).toString('base64url')
}

export async function createAuthToken(): Promise<string> {
  const payload = Date.now().toString()
  const sig = await hmac(payload)
  return `${payload}~${sig}`
}

export async function verifyAuthToken(token: string): Promise<boolean> {
  try {
    const [payload, sig] = token.split('~')
    if (!payload || !sig) return false
    const expected = await hmac(payload)
    return expected === sig
  } catch {
    return false
  }
}

export function authCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: MAX_AGE,
    path: '/',
  }
}

export { COOKIE_NAME }
