import { createServerClient } from '@/lib/supabase'

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string; sid: string }> }
) {
  const { sid } = await ctx.params
  const db = createServerClient()
  const userId = process.env.USER_ID!
  const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())

  const { data: existing } = await db
    .from('habit_subtask_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('subtask_id', sid)
    .eq('log_date', today)
    .maybeSingle()

  if (existing) {
    await db.from('habit_subtask_logs').delete().eq('id', existing.id)
    return Response.json({ done: false })
  }

  await db.from('habit_subtask_logs').insert({ user_id: userId, subtask_id: sid, log_date: today })
  return Response.json({ done: true })
}
