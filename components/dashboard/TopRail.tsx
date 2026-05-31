'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const TABS: { label: string; path: string }[] = [
  { label: 'Home',    path: '/' },
  { label: 'Journal', path: '/journal' },
  { label: 'Health',  path: '/health' },
  { label: 'Finance', path: '/finance' },
  { label: 'Brain',   path: '/brain' },
  { label: 'CRM',     path: '/crm' },
]

export default function TopRail() {
  const router = useRouter()
  const pathname = usePathname()
  const [dark, setDark] = useState(false)
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    function update() {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))
    }
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: 'var(--rail-h)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 12,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-0)', letterSpacing: '-0.3px', minWidth: 100 }}>
        Personal OS
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        {TABS.map(tab => {
          const active = pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              style={{
                padding: '5px 13px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                color: active ? 'var(--accent)' : 'var(--ink-2)',
                background: active ? 'var(--accent-bg)' : 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{dark ? 'Light' : 'Dark'}</span>
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          style={{
            width: 36, height: 20, borderRadius: 10,
            background: dark ? 'var(--accent)' : 'var(--ink-4)',
            border: 'none', cursor: 'pointer', position: 'relative',
            flexShrink: 0, transition: 'background 0.2s',
          }}
        >
          <span style={{
            position: 'absolute', width: 16, height: 16, borderRadius: '50%',
            background: 'white', top: 2, left: dark ? 18 : 2,
            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>

        <div style={{ fontSize: 13, color: 'var(--ink-2)', textAlign: 'right', lineHeight: 1.3 }}>
          <div>{time}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{date}</div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600, color: 'white', flexShrink: 0,
          }}
        >
          CD
        </button>
      </div>
    </nav>
  )
}
