import OpenAI from 'openai'
import type { LLMInput } from './claude'

export async function callOpenAI({ system, prompt, json = false }: LLMInput): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_CLASSIFIER_MODEL ?? 'gpt-4o-mini',
    max_tokens: 1024,
    response_format: json ? { type: 'json_object' } : { type: 'text' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
  })
  return response.choices[0].message.content ?? ''
}
