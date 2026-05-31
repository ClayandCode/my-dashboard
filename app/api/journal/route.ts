import { createServerClient } from '@/lib/supabase'
import { saveMemory } from '@/lib/memory'

function today() {
  const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
}

export async function GET(request: Request) {
  const db = createServerClient()
  const userId = process.env.USER_ID!
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') ?? '30')

  const { data, error } = await db
    .from('daily_logs')
    .select('id, log_date, notes, mood, created_at, updated_at')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(limit)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

export async function PUT(request: Request) {
  const { notes, mood, log_date } = await request.json()
  const db = createServerClient()
  const userId = process.env.USER_ID!
  const date = log_date ?? today()

  const { data: existing } = await db
    .from('daily_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('log_date', date)
    .maybeSingle()

  const payload: Record<string, unknown> = { user_id: userId, log_date: date }
  if (notes !== undefined) payload.notes = notes
  if (mood !== undefined) payload.mood = mood

  let entryId: string
  if (existing) {
    await db.from('daily_logs').update(payload).eq('id', existing.id)
    entryId = existing.id
  } else {
    const { data: created } = await db.from('daily_logs').insert(payload).select('id').single()
    entryId = created?.id ?? ''
  }

  // Save journal entry to memory (fire-and-forget)
  if (notes && entryId) {
    saveMemory(`[journal] ${date}: ${notes}`, 'journal', entryId).catch(() => {})
  }

  return Response.json({ ok: true })
}
