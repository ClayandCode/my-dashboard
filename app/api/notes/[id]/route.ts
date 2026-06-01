import { createServerClient } from '@/lib/supabase'
import { saveMemory } from '@/lib/memory'

export async function PATCH(request: Request, ctx: RouteContext<'/api/notes/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()
  const db = createServerClient()

  const update: Record<string, unknown> = {}
  if (body.title !== undefined) update.title = body.title
  if (body.content !== undefined) update.content = body.content
  if (body.tags !== undefined) update.tags = body.tags
  if (body.pinned !== undefined) update.pinned = body.pinned

  const { data, error } = await db
    .from('notes')
    .update(update)
    .eq('id', id)
    .eq('user_id', process.env.USER_ID!)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (data.title || data.content) {
    saveMemory(`[note] ${data.title}: ${data.content ?? ''}`, 'note', id).catch(() => {})
  }

  return Response.json(data)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/notes/[id]'>) {
  const { id } = await ctx.params
  const db = createServerClient()
  const { error } = await db
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', process.env.USER_ID!)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
