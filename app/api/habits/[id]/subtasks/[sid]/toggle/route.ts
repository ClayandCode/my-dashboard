import { createServerClient } from '@/lib/supabase'

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string; sid: string }> }
) {
  const { id: habitId, sid } = await ctx.params
  const db = createServerClient()
  const userId = process.env.USER_ID!
  const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())

  // Toggle the subtask log
  const { data: existing } = await db
    .from('habit_subtask_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('subtask_id', sid)
    .eq('log_date', today)
    .maybeSingle()

  if (existing) {
    await db.from('habit_subtask_logs').delete().eq('id', existing.id)
  } else {
    await db.from('habit_subtask_logs').insert({ user_id: userId, subtask_id: sid, log_date: today })
  }

  // Check if ALL subtasks for this habit are now done
  const { data: allSubs } = await db
    .from('habit_subtasks')
    .select('id')
    .eq('habit_id', habitId)
    .eq('user_id', userId)

  const { data: doneSubs } = await db
    .from('habit_subtask_logs')
    .select('subtask_id')
    .eq('user_id', userId)
    .eq('log_date', today)
    .in('subtask_id', (allSubs ?? []).map(s => s.id))

  const allDone = (allSubs ?? []).length > 0 &&
    (doneSubs ?? []).length === (allSubs ?? []).length

  // Sync habit_log so streak tracks correctly
  const { data: habitLog } = await db
    .from('habit_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .eq('log_date', today)
    .maybeSingle()

  if (allDone && !habitLog) {
    await db.from('habit_logs').insert({ user_id: userId, habit_id: habitId, log_date: today })
  } else if (!allDone && habitLog) {
    await db.from('habit_logs').delete().eq('id', habitLog.id)
  }

  return Response.json({ done: !existing, habitDone: allDone })
}
