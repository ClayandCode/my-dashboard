import { processCapture } from '@/lib/capture'

export async function POST(request: Request) {
  try {
    const { text, source = 'web' } = await request.json()

    if (!text?.trim()) {
      return Response.json({ error: 'text is required' }, { status: 400 })
    }

    const result = await processCapture(text.trim(), source)
    return Response.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[capture]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
