import { createServerClient } from '@/lib/supabase'

export async function DELETE(_req: Request, ctx: RouteContext<'/api/finance/[id]'>) {
  const { id } = await ctx.params
  const db = createServerClient()
  const { error } = await db
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', process.env.USER_ID!)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
