import { createServerClient } from '@/lib/supabase'

const URGENCY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export async function GET() {
  const db = createServerClient()
  const { data, error } = await db
    .from('tasks')
    .select('id, title, urgency, key, time_estimate_min, tags')
    .eq('user_id', process.env.USER_ID!)
    .is('completed_at', null)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const sorted = (data ?? []).sort((a, b) => {
    if (a.key !== b.key) return a.key ? -1 : 1
    return (URGENCY_ORDER[a.urgency] ?? 2) - (URGENCY_ORDER[b.urgency] ?? 2)
  })

  return Response.json(sorted)
}
