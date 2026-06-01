import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const db = createServerClient()
  const { data, error } = await db
    .from('contacts')
    .select('id, name, relationship, last_contact_date, followup_date, notes, tags, created_at, updated_at')
    .eq('user_id', process.env.USER_ID!)
    .order('name')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

export async function POST(request: Request) {
  const { name, relationship, last_contact_date, followup_date, notes, tags } = await request.json()
  if (!name?.trim()) return Response.json({ error: 'name required' }, { status: 400 })

  const db = createServerClient()
  const { data, error } = await db
    .from('contacts')
    .insert({
      user_id: process.env.USER_ID!,
      name: name.trim(),
      relationship: relationship ?? 'other',
      last_contact_date: last_contact_date ?? null,
      followup_date: followup_date ?? null,
      notes: notes ?? null,
      tags: tags ?? [],
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
