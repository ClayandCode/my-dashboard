'use client'

import { useState, useEffect } from 'react'
import Panel, { PanelHeader } from '../Panel'

interface CalEvent {
  id: string
  title: string
  start: string
  end: string
  location: string | null
  allDay: boolean
}

function fmtTime(iso: string, tz: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}

export default function CalendarCard() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setEvents(d)
        } else {
          setErrorMsg(d?.message ?? d?.error ?? 'Unknown error')
        }
        setLoading(false)
      })
      .catch(e => { setErrorMsg(String(e)); setLoading(false) })
  }, [])

  const now = new Date()

  return (
    <Panel>
      <PanelHeader label="Today" />
      {loading && <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>}
      {errorMsg && <div style={{ color: 'var(--ink-4)', fontSize: 11 }}>{errorMsg}</div>}
      {!loading && !errorMsg && events.length === 0 && (
        <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Nothing scheduled today</div>
      )}
      {events.map(e => {
        const past = !e.allDay && new Date(e.end) < now
        return (
          <div key={e.id} style={{
            display: 'flex', gap: 10, padding: '7px 0',
            borderBottom: '1px solid var(--border)',
            opacity: past ? 0.45 : 1,
          }}>
            <div style={{
              width: 3, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch',
              background: past ? 'var(--ink-4)' : 'var(--accent)',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>
                {e.allDay ? 'All day' : `${fmtTime(e.start, tz)} – ${fmtTime(e.end, tz)}`}
                {e.location && <span style={{ marginLeft: 6 }}>· {e.location}</span>}
              </div>
            </div>
          </div>
        )
      })}
    </Panel>
  )
}
