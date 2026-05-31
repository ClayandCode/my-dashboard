import { createServerClient } from '@/lib/supabase'

export async function PATCH(request: Request, ctx: RouteContext<'/api/goals/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()
  const db = createServerClient()

  const update: Record<string, unknown> = {}
  if ('completed' in body) update.completed_at = body.completed ? new Date().toISOString() : null
  if ('title' in body) update.title = body.title

  const { error } = await db
    .from('goals')
    .update(update)
    .eq('id', id)
    .eq('user_id', process.env.USER_ID!)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/goals/[id]'>) {
  const { id } = await ctx.params
  const db = createServerClient()

  const { error } = await db
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', process.env.USER_ID!)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
