import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = createServerClient()
    const userId = process.env.USER_ID!
    const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())

    const streakStart = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(
      new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
    )

    // Fetch habits first — surface any error immediately
    const habitsRes = await db
      .from('habits')
      .select('id, name, icon, sort_order, time_estimate_min, category')
      .eq('user_id', userId)
      .eq('active', true)
      .order('sort_order')

    if (habitsRes.error) {
      console.error('[habits] habits query error:', habitsRes.error)
      return Response.json({ error: habitsRes.error.message }, { status: 500 })
    }

    const habits = habitsRes.data ?? []
    if (habits.length === 0) {
      return Response.json([])
    }

    // Fetch supporting data in parallel
    const [logsRes, subtasksRes, subtaskLogsRes, recentLogsRes] = await Promise.all([
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
      db.from('habit_logs')
        .select('habit_id, log_date')
        .eq('user_id', userId)
        .gte('log_date', streakStart)
        .order('log_date', { ascending: false }),
    ])

    if (subtasksRes.error) console.error('[habits] subtasks error:', subtasksRes.error)
    if (logsRes.error)    console.error('[habits] logs error:', logsRes.error)

    const doneHabitIds  = new Set((logsRes.data ?? []).map(l => l.habit_id))
    const subtasks      = subtasksRes.data ?? []
    const doneSubtaskIds = new Set((subtaskLogsRes.data ?? []).map(l => l.subtask_id))

    const logDatesByHabit: Record<string, Set<string>> = {}
    for (const row of recentLogsRes.data ?? []) {
      if (!logDatesByHabit[row.habit_id]) logDatesByHabit[row.habit_id] = new Set()
      logDatesByHabit[row.habit_id].add(row.log_date)
    }

    function calcStreak(habitId: string): number {
      const dates = logDatesByHabit[habitId] ?? new Set<string>()
      let streak = 0
      const d = new Date(`${today}T12:00:00`)
      while (true) {
        const ds = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d)
        if (!dates.has(ds)) break
        streak++
        d.setDate(d.getDate() - 1)
      }
      return streak
    }

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
        const done = hasSubs ? subs.every(s => s.done) : doneHabitIds.has(h.id)
        return { ...h, subtasks: subs, done, streak: calcStreak(h.id) }
      })
    )
  } catch (err) {
    console.error('[habits] unhandled error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
