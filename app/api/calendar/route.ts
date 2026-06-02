import { parseICal, getEventsForDate } from '@/lib/ical'

export const revalidate = 300 // cache 5 minutes

export async function GET() {
  const url = process.env.GOOGLE_CALENDAR_ICAL_URL
  if (!url) return Response.json({ error: 'GOOGLE_CALENDAR_ICAL_URL not set' }, { status: 503 })

  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return Response.json({ error: 'Failed to fetch calendar' }, { status: 502 })
    const text = await res.text()

    const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
    const events = parseICal(text)
    const today = getEventsForDate(events, new Date(), tz)

    return Response.json(today.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      location: e.location,
      description: e.description,
      allDay: e.allDay,
    })))
  } catch (err) {
    console.error('[calendar]', err)
    return Response.json({ error: 'Calendar parse error' }, { status: 500 })
  }
}
