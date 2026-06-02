import { parseICal, getEventsForDate } from '@/lib/ical'

export const revalidate = 300

export async function GET() {
  const url = process.env.GOOGLE_CALENDAR_ICAL_URL
  if (!url) return Response.json({ error: 'no_url', message: 'GOOGLE_CALENDAR_ICAL_URL not set in environment' }, { status: 503 })

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return Response.json({ error: 'fetch_failed', message: `Google returned ${res.status}` }, { status: 502 })
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
    return Response.json({ error: 'parse_error', message: String(err) }, { status: 500 })
  }
}
