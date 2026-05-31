import { processCapture } from '@/lib/capture'

const TYPE_EMOJI: Record<string, string> = {
  task: '✅',
  note: '📝',
  meal: '🍽️',
  journal: '📓',
  blocker: '🚧',
  finance: '💰',
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: true })
  }

  const message = body.message ?? body.edited_message
  if (!message?.text) return Response.json({ ok: true })

  if (String(message.from?.id) !== process.env.TELEGRAM_USER_ID) {
    return Response.json({ ok: true })
  }

  const chatId: number = message.chat.id
  const text: string = message.text

  try {
    const result = await processCapture(text, 'telegram')
    const emoji = TYPE_EMOJI[result.classification.type] ?? '📌'
    const reply = `${emoji} *${result.classification.type}* logged\n_${result.classification.title}_`
    await telegramReply(chatId, reply)
  } catch (err) {
    console.error('[telegram/webhook]', err)
    await telegramReply(chatId, '⚠️ Something went wrong processing your capture.')
  }

  return Response.json({ ok: true })
}

async function telegramReply(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}
