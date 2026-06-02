import { createServerClient } from '@/lib/supabase'
import { saveMemory } from '@/lib/memory'

const URGENCY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export async function GET(request: Request) {
  const db = createServerClient()
  const { searchParams } = new URL(request.url)
  const includeCompleted = searchParams.get('completed') === 'true'

  const query = db
    .from('tasks')
    .select('id, title, description, urgency, key, time_estimate_min, tags, completed_at, created_at')
    .eq('user_id', process.env.USER_ID!)
    .order('created_at', { ascending: false })
    .limit(100)

  if (!includeCompleted) query.is('completed_at', null)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const sorted = (data ?? []).sort((a, b) => {
    if (a.key !== b.key) return a.key ? -1 : 1
    return (URGENCY_ORDER[a.urgency] ?? 2) - (URGENCY_ORDER[b.urgency] ?? 2)
  })

  return Response.json(sorted)
}

export async function POST(request: Request) {
  const { title, description, urgency, key, time_estimate_min, tags } = await request.json()
  if (!title?.trim()) return Response.json({ error: 'title required' }, { status: 400 })

  const db = createServerClient()
  const { data, error } = await db
    .from('tasks')
    .insert({
      user_id: process.env.USER_ID!,
      title: title.trim(),
      description: description ?? null,
      urgency: urgency ?? 'medium',
      key: key ?? false,
      time_estimate_min: time_estimate_min ?? null,
      tags: tags ?? [],
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  saveMemory(
    `[task] ${data.title}${description ? ': ' + description : ''}`,
    'capture',
    data.id,
  ).catch(() => {})

  return Response.json(data, { status: 201 })
}
