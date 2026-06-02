'use client'

import { useState, useEffect } from 'react'
import Panel, { PanelHeader } from '../Panel'
import { useDemoMode } from '@/components/DemoContext'
import { DEMO_CALENDAR } from '@/lib/demoData'

interface CalEvent {
  id: string
  title: string
  start: string
  end: string
  location: string | null
  allDay: boolean
}

const DAY_ABBR = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function localDateStr(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d)
}

function fmtTime(iso: string, tz: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay() // 0 = Sun
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export default function CalendarCard() {
  const demo = useDemoMode()
  const now = new Date()
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const todayStr = localDateStr(now, tz)

  const [selected, setSelected] = useState(todayStr)
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const monday = getMondayOfWeek(now)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  useEffect(() => {
    if (demo) {
      // In demo mode only show today's demo events regardless of selected day
      setEvents(selected === todayStr ? DEMO_CALENDAR : [])
      setLoading(false)
      setErrorMsg(null)
      return
    }
    setLoading(true)
    setErrorMsg(null)
    fetch(`/api/calendar?date=${selected}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setEvents(d)
        else setErrorMsg(d?.message ?? d?.error ?? 'Unknown error')
        setLoading(false)
      })
      .catch(e => { setErrorMsg(String(e)); setLoading(false) })
  }, [selected, demo, todayStr])

  const isToday = selected === todayStr
  const nowMs = now.getTime()

  const allDay = events.filter(e => e.allDay)
  const timed = events.filter(e => !e.allDay)
  const past = timed.filter(e => new Date(e.end).getTime() < nowMs)
  const upcoming = timed.filter(e => new Date(e.end).getTime() >= nowMs)

  function EventRow({ e, dim }: { e: CalEvent; dim: boolean }) {
    return (
      <div style={{
        display: 'flex', gap: 8, padding: '6px 0',
        borderBottom: '1px solid var(--border)',
        opacity: dim ? 0.4 : 1,
      }}>
        <div style={{
          width: 3, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch',
          background: dim ? 'var(--ink-4)' : 'var(--accent)',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'var(--ink-0)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {e.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 1 }}>
            {e.allDay ? 'All day' : `${fmtTime(e.start, tz)} – ${fmtTime(e.end, tz)}`}
            {e.location && <span style={{ marginLeft: 6 }}>· {e.location}</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Panel>
      <PanelHeader label="Calendar" />

      {/* 7-day week strip */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
        {weekDays.map(d => {
          const ds = localDateStr(d, tz)
          const isSel = ds === selected
          const isTd = ds === todayStr
          return (
            <button
              key={ds}
              onClick={() => setSelected(ds)}
              style={{
                flex: 1, padding: '5px 2px', border: 'none', cursor: 'pointer',
                borderRadius: 6,
                background: isSel ? 'var(--accent)' : 'transparent',
                color: isSel ? '#fff' : isTd ? 'var(--accent)' : 'var(--ink-3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {DAY_ABBR[d.getDay()]}
              </span>
              <span style={{ fontSize: 12, fontWeight: isTd ? 700 : 400, lineHeight: 1.1 }}>
                {d.getDate()}
              </span>
            </button>
          )
        })}
      </div>

      {loading && <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>}
      {errorMsg && <div style={{ color: 'var(--ink-4)', fontSize: 11 }}>{errorMsg}</div>}
      {!loading && !errorMsg && events.length === 0 && (
        <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Nothing scheduled</div>
      )}

      {!loading && !errorMsg && events.length > 0 && (
        <>
          {allDay.map(e => <EventRow key={e.id} e={e} dim={false} />)}

          {isToday ? (
            <>
              {past.map(e => <EventRow key={e.id} e={e} dim={true} />)}
              {(past.length > 0 || upcoming.length > 0) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0' }}>
                  <div style={{ height: 1, flex: 1, background: 'var(--danger)', opacity: 0.5 }} />
                  <span style={{ fontSize: 9, color: 'var(--danger)', fontWeight: 700, letterSpacing: 0.8 }}>NOW</span>
                  <div style={{ height: 1, flex: 1, background: 'var(--danger)', opacity: 0.5 }} />
                </div>
              )}
              {upcoming.map(e => <EventRow key={e.id} e={e} dim={false} />)}
            </>
          ) : (
            timed.map(e => <EventRow key={e.id} e={e} dim={false} />)
          )}
        </>
      )}
    </Panel>
  )
}
