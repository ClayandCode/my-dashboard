import { createServerClient } from '@/lib/supabase'
import { saveMemory } from '@/lib/memory'

function todayTz() {
  const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
}

export async function GET() {
  const db = createServerClient()
  const userId = process.env.USER_ID!

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const { data, error } = await db
    .from('health_logs')
    .select('id, log_date, weight_lbs, sleep_hours, hrv, energy, water_oz, notes')
    .eq('user_id', userId)
    .gte('log_date', thirtyDaysAgo)
    .order('log_date', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

export async function PUT(request: Request) {
  const body = await request.json()
  const db = createServerClient()
  const userId = process.env.USER_ID!
  const date = body.log_date ?? todayTz()

  const { data: existing } = await db
    .from('health_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('log_date', date)
    .maybeSingle()

  const payload: Record<string, unknown> = { user_id: userId, log_date: date, updated_at: new Date().toISOString() }
  const fields = ['weight_lbs', 'sleep_hours', 'hrv', 'energy', 'water_oz', 'notes'] as const
  for (const f of fields) {
    if (body[f] !== undefined) payload[f] = body[f] === '' ? null : body[f]
  }

  let result
  if (existing) {
    result = await db.from('health_logs').update(payload).eq('id', existing.id).select().single()
  } else {
    result = await db.from('health_logs').insert(payload).select().single()
  }

  if (result.error) return Response.json({ error: result.error.message }, { status: 500 })

  const d = result.data
  if (d) {
    const parts: string[] = []
    if (d.weight_lbs) parts.push(`weight ${d.weight_lbs}lbs`)
    if (d.sleep_hours) parts.push(`sleep ${d.sleep_hours}h`)
    if (d.hrv) parts.push(`HRV ${d.hrv}`)
    if (d.energy) parts.push(`energy ${d.energy}/10`)
    if (d.water_oz) parts.push(`water ${d.water_oz}oz`)
    if (d.notes) parts.push(d.notes)
    if (parts.length > 0) {
      saveMemory(`[health] ${d.log_date}: ${parts.join(', ')}`, 'health', d.id).catch(() => {})
    }
  }

  return Response.json(result.data)
}
