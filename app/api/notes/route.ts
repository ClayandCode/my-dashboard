import { createServerClient } from '@/lib/supabase'
import { saveMemory, searchMemory } from '@/lib/memory'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const userId = process.env.USER_ID!

  if (q) {
    const results = await searchMemory(q, 10, 0.45)
    const noteResults = results.filter(r => r.source_type === 'note')
    if (noteResults.length === 0) return Response.json([])

    const db = createServerClient()
    const ids = noteResults.map(r => r.source_id).filter(Boolean)
    const { data } = await db.from('notes').select('*').in('id', ids).eq('user_id', userId)
    const byId = Object.fromEntries((data ?? []).map(n => [n.id, n]))
    const ordered = noteResults.map(r => byId[r.source_id as string]).filter(Boolean)
    return Response.json(ordered)
  }

  const db = createServerClient()
  const { data, error } = await db
    .from('notes')
    .select('id, title, content, tags, pinned, created_at, updated_at')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

export async function POST(request: Request) {
  const { title, content, tags, pinned } = await request.json()
  if (!title?.trim()) return Response.json({ error: 'title required' }, { status: 400 })

  const db = createServerClient()
  const { data, error } = await db
    .from('notes')
    .insert({
      user_id: process.env.USER_ID!,
      title: title.trim(),
      content: content ?? '',
      tags: tags ?? [],
      pinned: pinned ?? false,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  saveMemory(`[note] ${data.title}: ${data.content ?? ''}`, 'note', data.id).catch(() => {})

  return Response.json(data)
}
