import OpenAI from 'openai'

export async function embed(text: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY) return null
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const res = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    })
    return res.data[0].embedding
  } catch (err) {
    console.warn('[embed] failed:', err)
    return null
  }
}
