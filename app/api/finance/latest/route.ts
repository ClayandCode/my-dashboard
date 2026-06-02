import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = createServerClient()
  const { data, error } = await db
    .from('finance_snapshots')
    .select('net_worth, change_amount, categories, raw_data, snapshot_date, updated_at')
    .eq('user_id', process.env.USER_ID!)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? null)
}
