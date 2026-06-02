import { parseICal, getEventsForDate } from '@/lib/ical'

export const revalidate = 300

export async function GET(request: Request) {
  const url = process.env.GOOGLE_CALENDAR_ICAL_URL
  if (!url) return Response.json({ error: 'no_url', message: 'GOOGLE_CALENDAR_ICAL_URL not set in environment' }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date') // YYYY-MM-DD in user's local timezone

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return Response.json({ error: 'fetch_failed', message: `Google returned ${res.status}` }, { status: 502 })
    const text = await res.text()

    const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
    const events = parseICal(text)
    // Use noon on the target date to avoid DST edge cases
    const targetDate = dateParam ? new Date(`${dateParam}T12:00:00`) : new Date()
    const dayEvents = getEventsForDate(events, targetDate, tz)

    return Response.json(dayEvents.map(e => ({
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
