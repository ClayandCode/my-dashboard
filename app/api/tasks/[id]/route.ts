import { createServerClient } from '@/lib/supabase'

export async function PATCH(request: Request, ctx: RouteContext<'/api/tasks/[id]'>) {
  const { id } = await ctx.params
  const { completed } = await request.json()
  const db = createServerClient()

  const { error } = await db
    .from('tasks')
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('user_id', process.env.USER_ID!)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
