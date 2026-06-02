'use client'

import { useState, useEffect } from 'react'
import Panel from '../Panel'
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

const DAY_ABBR = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function localDateStr(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d)
}

function fmtTime(iso: string, tz: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  return monday
}

const EVENT_COLORS = [
  'var(--accent)',
  '#8b5cf6',
  '#ec4899',
  'var(--ok)',
  'var(--warn)',
  '#06b6d4',
]

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

  // Format the selected date as a nice header
  const selectedDateLabel = new Date(`${selected}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  // Color assignment per event (stable by index)
  function eventColor(idx: number) {
    return EVENT_COLORS[idx % EVENT_COLORS.length]
  }

  function EventCard({ e, dim, colorIdx }: { e: CalEvent; dim: boolean; colorIdx: number }) {
    const color = eventColor(colorIdx)
    return (
      <div style={{
        display: 'flex', gap: 10, padding: '9px 11px',
        borderRadius: 10,
        background: dim ? 'transparent' : 'var(--surface-2)',
        border: `1px solid ${dim ? 'transparent' : 'var(--border)'}`,
        opacity: dim ? 0.45 : 1,
        marginBottom: 5,
        transition: 'opacity 0.15s',
      }}>
        <div style={{
          width: 3, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch',
          minHeight: 32,
          background: color,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'var(--ink-0)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            marginBottom: 2,
          }}>
            {e.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span>{e.allDay ? 'All day' : `${fmtTime(e.start, tz)} – ${fmtTime(e.end, tz)}`}</span>
            {e.location && (
              <span style={{ color: 'var(--ink-4)' }}>· {e.location}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  let colorIdx = 0

  return (
    <Panel>
      {/* Month label */}
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8,
      }}>
        {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>

      {/* 7-day week strip */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
        {weekDays.map(d => {
          const ds = localDateStr(d, tz)
          const isSel = ds === selected
          const isTd = ds === todayStr
          return (
            <button
              key={ds}
              onClick={() => setSelected(ds)}
              style={{
                flex: 1, padding: '7px 2px', border: 'none', cursor: 'pointer',
                borderRadius: 10,
                background: isSel ? 'var(--accent)' : isTd ? 'var(--accent-bg)' : 'transparent',
                color: isSel ? '#fff' : isTd ? 'var(--accent)' : 'var(--ink-3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>
                {DAY_ABBR[d.getDay()]}
              </span>
              <span style={{ fontSize: 14, fontWeight: isTd ? 700 : 500, lineHeight: 1 }}>
                {d.getDate()}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected date label */}
      <div style={{
        fontSize: 13, fontWeight: 600, color: 'var(--ink-1)',
        marginBottom: 10, paddingBottom: 8,
        borderBottom: '1px solid var(--border)',
      }}>
        {isToday ? 'Today' : selectedDateLabel}
        {!loading && !errorMsg && events.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-4)', marginLeft: 6 }}>
            · {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading && <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>}
      {errorMsg && <div style={{ color: 'var(--ink-4)', fontSize: 11 }}>{errorMsg}</div>}
      {!loading && !errorMsg && events.length === 0 && (
        <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Nothing scheduled</div>
      )}

      {!loading && !errorMsg && events.length > 0 && (
        <>
          {allDay.map(e => <EventCard key={e.id} e={e} dim={false} colorIdx={colorIdx++} />)}

          {isToday ? (
            <>
              {past.map(e => <EventCard key={e.id} e={e} dim={true} colorIdx={colorIdx++} />)}
              {(past.length > 0 && upcoming.length > 0) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', marginBottom: 5 }}>
                  <div style={{ height: 1, flex: 1, background: 'var(--danger)', opacity: 0.5 }} />
                  <span style={{ fontSize: 9, color: 'var(--danger)', fontWeight: 700, letterSpacing: 0.8 }}>NOW</span>
                  <div style={{ height: 1, flex: 1, background: 'var(--danger)', opacity: 0.5 }} />
                </div>
              )}
              {upcoming.map(e => <EventCard key={e.id} e={e} dim={false} colorIdx={colorIdx++} />)}
            </>
          ) : (
            timed.map(e => <EventCard key={e.id} e={e} dim={false} colorIdx={colorIdx++} />)
          )}
        </>
      )}
    </Panel>
  )
}
