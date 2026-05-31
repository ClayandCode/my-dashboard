import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const db = createServerClient()
  const userId = process.env.USER_ID!
  const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())

  const { data: habits, error } = await db
    .from('habits')
    .select('id, name, icon, sort_order')
    .eq('user_id', userId)
    .eq('active', true)
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: logs } = await db
    .from('habit_logs')
    .select('habit_id')
    .eq('user_id', userId)
    .eq('log_date', today)

  const doneIds = new Set((logs ?? []).map(l => l.habit_id))

  return Response.json(
    (habits ?? []).map(h => ({ ...h, done: doneIds.has(h.id) }))
  )
}
