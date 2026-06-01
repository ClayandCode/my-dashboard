import { createServerClient } from '@/lib/supabase'
import { classify, type Classification } from '@/lib/classify'
import { saveMemory } from '@/lib/memory'

export interface CaptureResult {
  ok: boolean
  classification: Classification
  rawId: string
}

export async function processCapture(
  text: string,
  source: 'web' | 'telegram' = 'web',
): Promise<CaptureResult> {
  const userId = process.env.USER_ID!
  const db = createServerClient()

  const classification = await classify(text)

  const { data: raw } = await db
    .from('raw_captures')
    .insert({
      user_id: userId,
      source,
      raw_text: text,
      classification,
      llm_source: 'anthropic',
      routed_to: classification.type,
    })
    .select('id')
    .single()

  let routedId: string | null = null

  if (classification.type === 'meal') {
    const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
    const { data: meal } = await db
      .from('meals')
      .insert({
        user_id: userId,
        log_date: today,
        name: classification.title,
        kcal: classification.kcal ?? 0,
        source: source,
      })
      .select('id')
      .single()
    routedId = meal?.id ?? null
  } else if (classification.type === 'task' || classification.type === 'blocker') {
    const { data: task } = await db
      .from('tasks')
      .insert({
        user_id: userId,
        title: classification.title,
        description: classification.body,
        urgency: classification.urgency ?? 'medium',
        key: classification.key ?? false,
        time_estimate_min: classification.time_estimate_min ?? null,
        tags: classification.tags ?? [],
      })
      .select('id')
      .single()
    routedId = task?.id ?? null
  } else if (classification.type === 'health') {
    const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
    const payload: Record<string, unknown> = { user_id: userId, log_date: today }
    if (classification.weight_lbs) payload.weight_lbs = classification.weight_lbs
    if (classification.sleep_hours) payload.sleep_hours = classification.sleep_hours
    if (classification.hrv) payload.hrv = classification.hrv
    if (classification.energy) payload.energy = classification.energy
    if (classification.water_oz) payload.water_oz = classification.water_oz
    payload.notes = classification.body

    const { data: existing } = await db.from('health_logs').select('id').eq('user_id', userId).eq('log_date', today).maybeSingle()
    if (existing) {
      await db.from('health_logs').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id)
      routedId = existing.id
    } else {
      const { data: log } = await db.from('health_logs').insert(payload).select('id').single()
      routedId = log?.id ?? null
    }
  } else if (classification.type === 'finance') {
    const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())
    const { data: tx } = await db
      .from('transactions')
      .insert({
        user_id: userId,
        description: classification.title,
        amount: Math.abs(classification.amount ?? 0),
        category: classification.category ?? 'expense',
        date: today,
        notes: classification.body,
        source,
      })
      .select('id')
      .single()
    routedId = tx?.id ?? null
  } else if (classification.type === 'note') {
    const { data: note } = await db
      .from('notes')
      .insert({
        user_id: userId,
        title: classification.title,
        content: classification.body,
        tags: classification.tags ?? [],
      })
      .select('id')
      .single()
    routedId = note?.id ?? null
  } else if (classification.type === 'journal') {
    const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())

    const { data: existing } = await db
      .from('daily_logs')
      .select('id, notes')
      .eq('user_id', userId)
      .eq('log_date', today)
      .maybeSingle()

    if (existing) {
      const notes = existing.notes
        ? `${existing.notes}\n\n${classification.body}`
        : classification.body
      await db.from('daily_logs').update({ notes }).eq('id', existing.id)
      routedId = existing.id
    } else {
      const { data: log } = await db
        .from('daily_logs')
        .insert({ user_id: userId, log_date: today, notes: classification.body })
        .select('id')
        .single()
      routedId = log?.id ?? null
    }
  }

  if (routedId && raw?.id) {
    await db.from('raw_captures').update({ routed_id: routedId }).eq('id', raw.id)
  }

  // Save to memory (fire-and-forget — don't block the response)
  if (raw?.id) {
    saveMemory(
      `[${classification.type}] ${classification.title}: ${classification.body}`,
      'capture',
      raw.id,
    ).catch(() => {})
  }

  return { ok: true, classification, rawId: raw?.id ?? '' }
}
