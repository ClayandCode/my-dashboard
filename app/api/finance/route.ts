import { createServerClient } from '@/lib/supabase'

function monthBounds(tz: string) {
  const now = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date()))
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { first, last }
}

export async function GET(request: Request) {
  const db = createServerClient()
  const userId = process.env.USER_ID!
  const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') ?? 'month'

  const { first, last } = monthBounds(tz)

  const query = db
    .from('transactions')
    .select('id, date, description, amount, category, tags, notes, source, created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (mode === 'month') query.gte('date', first).lte('date', last)

  const { data, error } = await query.limit(200)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

export async function POST(request: Request) {
  const { description, amount, category, date, tags, notes } = await request.json()
  if (!description?.trim() || amount == null || !category) {
    return Response.json({ error: 'description, amount, and category required' }, { status: 400 })
  }

  const db = createServerClient()
  const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())

  const { data, error } = await db
    .from('transactions')
    .insert({
      user_id: process.env.USER_ID!,
      description: description.trim(),
      amount: Math.abs(parseFloat(amount)),
      category,
      date: date ?? today,
      tags: tags ?? [],
      notes: notes ?? null,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
