import { createServerClient } from '@/lib/supabase'

function today() {
  const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
}

export async function GET() {
  const db = createServerClient()
  const { data, error } = await db
    .from('meals')
    .select('id, name, kcal, protein_g, carbs_g, fat_g')
    .eq('user_id', process.env.USER_ID!)
    .eq('log_date', today())
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}
