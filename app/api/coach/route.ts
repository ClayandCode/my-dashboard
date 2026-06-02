import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { searchMemory } from '@/lib/memory'
import { parseICal, getEventsForDate } from '@/lib/ical'

interface ChatMessage { role: 'user' | 'assistant'; content: string }

async function buildContext(): Promise<string> {
  const db = createServerClient()
  const userId = process.env.USER_ID!
  const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
  const now = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(new Date())

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const calendarPromise = process.env.GOOGLE_CALENDAR_ICAL_URL
    ? fetch(process.env.GOOGLE_CALENDAR_ICAL_URL).then(r => r.text()).catch(() => null)
    : Promise.resolve(null)

  const [tasksRes, habitsRes, logsRes, goalsRes, mealsRes, capturesRes, txnsRes, healthRes, calendarText] = await Promise.all([
    db.from('tasks').select('title, urgency, key, time_estimate_min').eq('user_id', userId).is('completed_at', null).order('key', { ascending: false }).limit(15),
    db.from('habits').select('id, name, icon').eq('user_id', userId).eq('active', true).order('sort_order'),
    db.from('habit_logs').select('habit_id').eq('user_id', userId).eq('log_date', today),
    db.from('goals').select('title, timeframe, completed_at').eq('user_id', userId).order('sort_order'),
    db.from('meals').select('name, kcal').eq('user_id', userId).eq('log_date', today).order('created_at'),
    db.from('raw_captures').select('raw_text, routed_to, created_at').eq('user_id', userId).gte('created_at', new Date(Date.now() - 86400000).toISOString()).order('created_at', { ascending: false }).limit(10),
    db.from('transactions').select('description, amount, category').eq('user_id', userId).gte('date', monthStart).order('date', { ascending: false }).limit(20),
    db.from('health_logs').select('log_date, weight_lbs, sleep_hours, hrv, energy, water_oz').eq('user_id', userId).order('log_date', { ascending: false }).limit(7),
    calendarPromise,
  ])

  const tasks = tasksRes.data ?? []
  const habits = habitsRes.data ?? []
  const doneIds = new Set((logsRes.data ?? []).map(l => l.habit_id))
  const goals = goalsRes.data ?? []
  const meals = mealsRes.data ?? []
  const captures = capturesRes.data ?? []
  const txns = txnsRes.data ?? []
  const healthLogs = healthRes.data ?? []
  const todayEvents = calendarText
    ? getEventsForDate(parseICal(calendarText), new Date(), tz)
    : []

  const taskLines = tasks.length
    ? tasks.map(t => `  ${t.key ? '[KEY] ' : ''}${t.title}${t.time_estimate_min ? ` (~${t.time_estimate_min}m)` : ''} [${t.urgency}]`).join('\n')
    : '  (none — all clear!)'

  const keyCount = tasks.filter(t => t.key).length
  const habitLines = habits.map(h => `  ${doneIds.has(h.id) ? '✅' : '⬜'} ${h.icon ?? ''} ${h.name}`).join('\n')
  const habitDone = habits.filter(h => doneIds.has(h.id)).length

  const weekGoals = goals.filter(g => g.timeframe === 'week')
  const monthGoals = goals.filter(g => g.timeframe === 'month')
  const goalSection = [
    weekGoals.length ? `  This Week:\n${weekGoals.map(g => `    ${g.completed_at ? '✅' : '⬜'} ${g.title}`).join('\n')}` : '',
    monthGoals.length ? `  This Month:\n${monthGoals.map(g => `    ${g.completed_at ? '✅' : '⬜'} ${g.title}`).join('\n')}` : '',
  ].filter(Boolean).join('\n') || '  (no goals set)'

  const totalKcal = meals.reduce((s, m) => s + (m.kcal ?? 0), 0)
  const mealLines = meals.length
    ? meals.map(m => `  ${m.name}${m.kcal ? ` (${m.kcal} kcal)` : ''}`).join('\n')
    : '  (nothing logged yet)'

  const recentLines = captures.length
    ? captures.map(c => `  [${c.routed_to}] ${c.raw_text}`).join('\n')
    : '  (no recent activity)'

  const txIncome = txns.filter(t => t.category === 'income').reduce((s, t) => s + t.amount, 0)
  const txExpenses = txns.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0)
  const txInvested = txns.filter(t => t.category === 'investment').reduce((s, t) => s + t.amount, 0)
  const financeSection = txns.length
    ? `  Income: $${txIncome.toFixed(0)} | Expenses: $${txExpenses.toFixed(0)} | Invested: $${txInvested.toFixed(0)} | Net: $${(txIncome - txExpenses - txInvested).toFixed(0)}`
    : '  (no transactions logged this month)'

  return `── ${now} (Mountain Time) ──

OPEN TASKS (${tasks.length} total, ${keyCount} KEY):
${taskLines}

HABITS (${habitDone}/${habits.length} done today):
${habitLines}

GOALS:
${goalSection}

NUTRITION TODAY: ${totalKcal} kcal logged
${mealLines}

CALENDAR TODAY:
${todayEvents.length
  ? todayEvents.map(e => {
      const time = e.allDay ? 'All day' : new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(e.start)
      return `  ${time} — ${e.title}${e.location ? ` (${e.location})` : ''}`
    }).join('\n')
  : '  (no events today)'}

FINANCES THIS MONTH:
${financeSection}

HEALTH (last 7 days):
${healthLogs.length ? healthLogs.map(h => {
  const parts = []
  if (h.weight_lbs) parts.push(`${h.weight_lbs}lbs`)
  if (h.sleep_hours) parts.push(`sleep ${h.sleep_hours}h`)
  if (h.hrv) parts.push(`HRV ${h.hrv}`)
  if (h.energy) parts.push(`energy ${h.energy}/10`)
  if (h.water_oz) parts.push(`water ${h.water_oz}oz`)
  return `  ${h.log_date}: ${parts.join(', ') || 'no data'}`
}).join('\n') : '  (no health data logged)'}

RECENT ACTIVITY (last 24h):
${recentLines}`
}

export async function POST(request: Request) {
  const { messages }: { messages: ChatMessage[] } = await request.json()

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'No API key' }, { status: 500 })
  }

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
  const [context, memories] = await Promise.all([
    buildContext(),
    searchMemory(lastUserMessage, 5, 0.55),
  ])

  const memorySection = memories.length
    ? `\nRELEVANT MEMORIES (from past captures & journal):\n${memories.map(m => `  - ${m.text}`).join('\n')}`
    : ''

  const system = `You are Clay's personal AI life coach embedded in his Personal OS dashboard.
You have real-time access to his tasks, habits, goals, nutrition, recent activity, and past memories.
Be specific — reference his actual data, not generic advice. Be warm, direct, and concise.
If he's crushing habits, acknowledge it. If he's behind on tasks, be honest and help him prioritize.
Keep responses under 4 sentences unless he asks for more detail.

${context}${memorySection}`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const s = client.messages.stream({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 512,
        system,
        messages,
      })
      for await (const chunk of s) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
