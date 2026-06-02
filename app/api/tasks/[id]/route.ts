import { createServerClient } from '@/lib/supabase'

export async function PATCH(request: Request, ctx: RouteContext<'/api/tasks/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()
  const db = createServerClient()

  const allowed = ['completed', 'title', 'description', 'urgency', 'key', 'time_estimate_min', 'tags']
  const updates: Record<string, unknown> = {}

  for (const field of allowed) {
    if (field in body) {
      if (field === 'completed') {
        updates.completed_at = body.completed ? new Date().toISOString() : null
      } else {
        updates[field] = body[field]
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'no valid fields to update' }, { status: 400 })
  }

  const { error } = await db
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', process.env.USER_ID!)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(_request: Request, ctx: RouteContext<'/api/tasks/[id]'>) {
  const { id } = await ctx.params
  const db = createServerClient()

  const { error } = await db
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', process.env.USER_ID!)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
