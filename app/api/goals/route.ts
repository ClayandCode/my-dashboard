import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const db = createServerClient()
  const { data, error } = await db
    .from('goals')
    .select('id, title, timeframe, completed_at, sort_order')
    .eq('user_id', process.env.USER_ID!)
    .order('sort_order')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

export async function POST(request: Request) {
  const { title, timeframe } = await request.json()
  if (!title?.trim() || !timeframe) {
    return Response.json({ error: 'title and timeframe required' }, { status: 400 })
  }
  const db = createServerClient()
  const { data, error } = await db
    .from('goals')
    .insert({ user_id: process.env.USER_ID!, title: title.trim(), timeframe })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
