import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const db = createServerClient()
  const userId = process.env.USER_ID!
  const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())

  const [habitsRes, logsRes, subtasksRes, subtaskLogsRes] = await Promise.all([
    db.from('habits')
      .select('id, name, icon, sort_order, time_estimate_min, category')
      .eq('user_id', userId)
      .eq('active', true)
      .order('sort_order'),
    db.from('habit_logs')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('log_date', today),
    db.from('habit_subtasks')
      .select('id, habit_id, name, sort_order, time_estimate_min')
      .eq('user_id', userId)
      .order('sort_order'),
    db.from('habit_subtask_logs')
      .select('subtask_id')
      .eq('user_id', userId)
      .eq('log_date', today),
  ])

  const habits = habitsRes.data ?? []
  const doneHabitIds = new Set((logsRes.data ?? []).map(l => l.habit_id))
  const subtasks = subtasksRes.data ?? []
  const doneSubtaskIds = new Set((subtaskLogsRes.data ?? []).map(l => l.subtask_id))

  const subtasksByHabit = subtasks.reduce<Record<string, typeof subtasks>>((acc, s) => {
    ;(acc[s.habit_id] ??= []).push(s)
    return acc
  }, {})

  return Response.json(
    habits.map(h => {
      const subs = (subtasksByHabit[h.id] ?? []).map(s => ({
        ...s,
        done: doneSubtaskIds.has(s.id),
      }))
      const hasSubs = subs.length > 0
      const done = hasSubs
        ? subs.every(s => s.done)
        : doneHabitIds.has(h.id)
      return { ...h, subtasks: subs, done }
    })
  )
}
