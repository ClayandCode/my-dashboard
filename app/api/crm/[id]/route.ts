import { createServerClient } from '@/lib/supabase'

export async function PATCH(request: Request, ctx: RouteContext<'/api/crm/[id]'>) {
  const { id } = await ctx.params
  const body = await request.json()
  const db = createServerClient()

  const update: Record<string, unknown> = {}
  const fields = ['name', 'relationship', 'last_contact_date', 'followup_date', 'notes', 'tags'] as const
  for (const f of fields) {
    if (body[f] !== undefined) update[f] = body[f]
  }

  const { data, error } = await db
    .from('contacts')
    .update(update)
    .eq('id', id)
    .eq('user_id', process.env.USER_ID!)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/crm/[id]'>) {
  const { id } = await ctx.params
  const db = createServerClient()
  const { error } = await db
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', process.env.USER_ID!)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
