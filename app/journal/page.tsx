'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import TopRail from '@/components/dashboard/TopRail'

interface Entry {
  id: string
  log_date: string
  notes: string | null
  mood: number | null
  updated_at: string
}

const MOODS = ['😞', '😕', '😐', '🙂', '😊']

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver' }).format(new Date())
}

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [todayNotes, setTodayNotes] = useState('')
  const [todayMood, setTodayMood] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const todayStr = today()

  const load = useCallback(async () => {
    const res = await fetch('/api/journal?limit=30')
    const data: Entry[] = await res.json()
    setEntries(data)
    const todayEntry = data.find(e => e.log_date === todayStr)
    if (todayEntry) {
      setTodayNotes(todayEntry.notes ?? '')
      setTodayMood(todayEntry.mood ?? null)
    }
  }, [todayStr])

  useEffect(() => { load() }, [load])

  function scheduleAutosave(notes: string, mood: number | null) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(notes, mood), 1500)
  }

  async function save(notes: string, mood: number | null) {
    setSaving(true)
    await fetch('/api/journal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, mood, log_date: todayStr }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    load()
  }

  function handleNotesChange(val: string) {
    setTodayNotes(val)
    scheduleAutosave(val, todayMood)
  }

  function handleMoodChange(val: number) {
    const next = todayMood === val ? null : val
    setTodayMood(next)
    scheduleAutosave(todayNotes, next)
  }

  const pastEntries = entries.filter(e => e.log_date !== todayStr && e.notes)

  return (
    <>
      <TopRail />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Today's entry */}
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', padding: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 3 }}>
                Today
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-0)' }}>
                {formatDate(todayStr)}
              </div>
            </div>
            <div style={{ fontSize: 12, color: saving ? 'var(--ink-4)' : saved ? 'var(--ok)' : 'transparent' }}>
              {saving ? 'Saving…' : saved ? '✓ Saved' : '·'}
            </div>
          </div>

          {/* Mood picker */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', alignSelf: 'center', marginRight: 4 }}>Mood:</span>
            {MOODS.map((m, i) => (
              <button
                key={i}
                onClick={() => handleMoodChange(i + 1)}
                style={{
                  fontSize: 20, background: 'none', border: 'none', cursor: 'pointer',
                  opacity: todayMood === i + 1 ? 1 : 0.35,
                  transform: todayMood === i + 1 ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.15s',
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <textarea
            value={todayNotes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="What's on your mind today? Wins, blockers, reflections…"
            style={{
              width: '100%', minHeight: 180, resize: 'vertical',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 14px', fontSize: 14,
              color: 'var(--ink-0)', fontFamily: 'inherit', lineHeight: 1.6,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Past entries */}
        {pastEntries.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 12 }}>
              Past entries
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pastEntries.map(entry => (
                <div
                  key={entry.id}
                  style={{
                    background: 'var(--surface)', borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)', padding: '18px 20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>
                      {formatDate(entry.log_date)}
                    </div>
                    {entry.mood && (
                      <span style={{ fontSize: 18 }}>{MOODS[entry.mood - 1]}</span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6,
                    margin: 0, whiteSpace: 'pre-wrap',
                    display: '-webkit-box', WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {entry.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </>
  )
}
