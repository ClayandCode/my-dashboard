-- Semantic memory search function using pgvector cosine similarity
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id text
)
RETURNS TABLE (
  id uuid,
  text text,
  source_type text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    text,
    source_type,
    1 - (embedding <=> query_embedding) AS similarity
  FROM memory_chunks
  WHERE user_id = p_user_id
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
