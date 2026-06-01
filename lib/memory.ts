import { createServerClient } from '@/lib/supabase'
import { embed } from '@/lib/embeddings'

export async function saveMemory(
  text: string,
  sourceType: string,
  sourceId: string,
): Promise<void> {
  const embedding = await embed(text)
  if (!embedding) return

  const db = createServerClient()
  await db.from('memory_chunks').insert({
    user_id: process.env.USER_ID!,
    source_type: sourceType,
    source_id: sourceId,
    text,
    embedding: `[${embedding.join(',')}]`,
  })
}

export interface MemoryResult {
  id: string
  text: string
  source_type: string
  source_id: string | null
  similarity: number
}

export async function searchMemory(
  query: string,
  limit = 5,
  threshold = 0.55,
): Promise<MemoryResult[]> {
  const embedding = await embed(query)
  if (!embedding) return []

  const db = createServerClient()
  const { data, error } = await db.rpc('match_memories', {
    query_embedding: `[${embedding.join(',')}]`,
    match_threshold: threshold,
    match_count: limit,
    p_user_id: process.env.USER_ID!,
  })

  if (error) {
    console.warn('[searchMemory] error:', error.message)
    return []
  }

  return (data ?? []) as MemoryResult[]
}
