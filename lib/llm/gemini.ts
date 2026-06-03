import type { LLMInput } from './claude'

const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000]
const TIMEOUT_MS = 20_000

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

function stripJsonFences(raw: string): string {
  const stripped = raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim()
  // Extract the first JSON object or array in case of surrounding prose
  const match = stripped.match(/[{[][\s\S]*[}\]]/)
  if (!match) throw new Error('[gemini] No JSON object found in response')
  return match[0]
}

export async function callGemini({ system, prompt, json = false }: LLMInput): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('[gemini] GEMINI_API_KEY is not set')

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const fullPrompt = json
    ? `${system}\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown fences, no prose before or after.\n\n${prompt}`
    : `${system}\n\n${prompt}`

  let lastErr: unknown
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: json ? { responseMimeType: 'application/json' } : {},
        }),
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (res.status === 429) {
        if (attempt < RETRY_DELAYS_MS.length) {
          await sleep(RETRY_DELAYS_MS[attempt])
          continue
        }
        throw new Error('[gemini] Rate limited after all retries')
      }

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`[gemini] HTTP ${res.status}: ${body}`)
      }

      const data = await res.json()
      const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

      if (json) {
        const extracted = stripJsonFences(raw)
        JSON.parse(extracted) // validate — throw so router falls forward if malformed
        return extracted
      }

      return raw
    } catch (err) {
      clearTimeout(timer)
      const msg = err instanceof Error ? err.message : String(err)
      const isRetryable = msg.includes('429') || (err instanceof Error && err.name === 'AbortError')

      if (isRetryable && attempt < RETRY_DELAYS_MS.length) {
        lastErr = err
        await sleep(RETRY_DELAYS_MS[attempt])
        continue
      }

      throw err
    }
  }

  throw new Error(`[gemini] All retries exhausted: ${lastErr}`)
}
