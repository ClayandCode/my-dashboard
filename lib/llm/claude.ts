import Anthropic from '@anthropic-ai/sdk'

export interface LLMInput {
  system: string
  prompt: string
  json?: boolean
}

export async function callClaude({ system, prompt, json = false }: LLMInput): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: prompt }],
  })
  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  if (json) {
    return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  }
  return raw
}
