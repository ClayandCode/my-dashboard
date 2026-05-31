import { createServerClient } from '@/lib/supabase'

export async function POST(_req: Request, ctx: RouteContext<'/api/habits/[id]/toggle'>) {
  const { id } = await ctx.params
  const db = createServerClient()
  const userId = process.env.USER_ID!
  const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())

  const { data: existing } = await db
    .from('habit_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('habit_id', id)
    .eq('log_date', today)
    .maybeSingle()

  if (existing) {
    await db.from('habit_logs').delete().eq('id', existing.id)
    return Response.json({ done: false })
  }

  await db.from('habit_logs').insert({ user_id: userId, habit_id: id, log_date: today })
  return Response.json({ done: true })
}
