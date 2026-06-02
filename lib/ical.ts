export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  location: string | null
  description: string | null
  allDay: boolean
}

function parseICalDate(value: string, tzid?: string): Date {
  // All-day: 20260601
  if (/^\d{8}$/.test(value)) {
    return new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00`)
  }
  // UTC datetime: 20260601T140000Z
  if (value.endsWith('Z')) {
    return new Date(
      `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`
    )
  }
  // Floating datetime: 20260601T140000 (treat as local / tzid)
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}`
  if (tzid) {
    try {
      return new Date(new Intl.DateTimeFormat('en-CA', { timeZone: tzid, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso)))
    } catch { /* fall through */ }
  }
  return new Date(iso)
}

function unescape(s: string): string {
  return s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}

export function parseICal(ical: string): CalendarEvent[] {
  // Unfold lines (continuation lines start with space/tab)
  const unfolded = ical.replace(/\r?\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)

  const events: CalendarEvent[] = []
  let inEvent = false
  let current: Record<string, string> = {}

  for (const raw of lines) {
    const line = raw.trim()
    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      current = {}
      continue
    }
    if (line === 'END:VEVENT') {
      inEvent = false
      if (current.SUMMARY) {
        const startRaw = current['DTSTART'] ?? ''
        const endRaw = current['DTEND'] ?? startRaw
        const tzid = current['DTSTART_TZID'] ?? undefined
        const allDay = /^\d{8}$/.test(startRaw)
        try {
          events.push({
            id: current['UID'] ?? Math.random().toString(36),
            title: unescape(current['SUMMARY'] ?? ''),
            start: parseICalDate(startRaw, tzid),
            end: parseICalDate(endRaw, tzid),
            location: current['LOCATION'] ? unescape(current['LOCATION']) : null,
            description: current['DESCRIPTION'] ? unescape(current['DESCRIPTION']) : null,
            allDay,
          })
        } catch { /* skip unparseable events */ }
      }
      continue
    }
    if (!inEvent) continue

    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const keyFull = line.slice(0, colonIdx)
    const value = line.slice(colonIdx + 1)

    // Extract TZID from params e.g. DTSTART;TZID=America/Denver
    const semiIdx = keyFull.indexOf(';')
    const key = semiIdx === -1 ? keyFull : keyFull.slice(0, semiIdx)
    const params = semiIdx === -1 ? '' : keyFull.slice(semiIdx + 1)

    if (key === 'DTSTART' || key === 'DTEND') {
      current[key] = value
      const tzMatch = params.match(/TZID=([^;]+)/)
      if (tzMatch) current[`${key}_TZID`] = tzMatch[1]
    } else {
      current[key] = value
    }
  }

  return events
}

export function getEventsForDate(events: CalendarEvent[], date: Date, tz: string): CalendarEvent[] {
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date)
  return events
    .filter(e => {
      const startStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(e.start)
      return startStr === dateStr
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}
