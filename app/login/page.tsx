'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Incorrect password')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 360,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '32px 28px',
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🧠</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink-0)', letterSpacing: '-0.3px' }}>
            Personal OS
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
            Enter your password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{
              width: '100%',
              padding: '11px 14px',
              background: 'var(--surface-2)',
              border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius: 10,
              fontSize: 14,
              color: 'var(--ink-0)',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {error && (
            <p style={{ fontSize: 12, color: 'var(--danger)', margin: '-4px 0' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '11px 14px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: 'white',
              cursor: loading || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !password ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
