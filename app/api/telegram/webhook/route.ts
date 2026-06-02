import { processCapture } from '@/lib/capture'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const TYPE_EMOJI: Record<string, string> = {
  task: '✅',
  note: '📝',
  meal: '🍽️',
  journal: '📓',
  blocker: '🚧',
  finance: '💰',
  health: '💪',
}

const URGENCY_LABEL: Record<string, string> = {
  critical: '🔴 Today',
  high: '🟡 Week',
  medium: '🟢 Month',
  low: '⬜ Someday',
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

  // Handle urgency override tapped from inline keyboard
  if (body.callback_query) {
    return handleCallbackQuery(body.callback_query)
  }

  const message = body.message ?? body.edited_message
  if (!message) return Response.json({ ok: true })

  if (String(message.from?.id) !== process.env.TELEGRAM_USER_ID) {
    return Response.json({ ok: true })
  }

  const chatId: number = message.chat.id
  let text: string | null = message.text ?? null

  // Transcribe voice/audio messages via OpenAI Whisper
  const voice = message.voice ?? message.audio
  if (!text && voice) {
    try {
      text = await transcribeVoice(voice.file_id)
    } catch (err) {
      console.error('[telegram/whisper]', err)
      await telegramSend(chatId, '⚠️ Failed to transcribe voice note. Try sending text instead.')
      return Response.json({ ok: true })
    }
  }

  if (!text) return Response.json({ ok: true })

  try {
    const result = await processCapture(text, 'telegram')
    const { classification, routedId } = result
    const emoji = TYPE_EMOJI[classification.type] ?? '📌'

    if ((classification.type === 'task' || classification.type === 'blocker') && routedId) {
      const urgency = classification.urgency ?? 'week'
      const replyText = `${emoji} *${classification.type}* saved\n_${classification.title}_\n\nAI urgency: *${URGENCY_LABEL[urgency] ?? urgency}* — override?`

      await telegramSend(chatId, replyText, {
        reply_markup: {
          inline_keyboard: [[
            { text: '🔴 Today', callback_data: `urg:critical:${routedId}` },
            { text: '🟡 Week', callback_data: `urg:high:${routedId}` },
            { text: '🟢 Month', callback_data: `urg:medium:${routedId}` },
            { text: '⬜ Someday', callback_data: `urg:low:${routedId}` },
            { text: '⭐ Key', callback_data: `key:${routedId}` },
          ]],
        },
      })
    } else {
      await telegramSend(chatId, `${emoji} *${classification.type}* logged\n_${classification.title}_`)
    }
  } catch (err) {
    console.error('[telegram/webhook]', err)
    await telegramSend(chatId, '⚠️ Something went wrong processing your capture.')
  }

  return Response.json({ ok: true })
}

async function handleCallbackQuery(cb: any) {
  const callbackId: string = cb.id
  const data: string = cb.data ?? ''

  const db = createServerClient()
  let alertText = 'Updated!'

  if (data.startsWith('urg:')) {
    const parts = data.split(':')
    const urgency = parts[1]
    const taskId = parts.slice(2).join(':')
    await db.from('tasks').update({ urgency }).eq('id', taskId)
    alertText = `Set to ${URGENCY_LABEL[urgency] ?? urgency}`
  } else if (data.startsWith('key:')) {
    const taskId = data.slice(4)
    await db.from('tasks').update({ key: true, urgency: 'today' }).eq('id', taskId)
    alertText = '⭐ Marked as Key task'
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (token) {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackId, text: alertText, show_alert: false }),
    })
  }

  return Response.json({ ok: true })
}

async function transcribeVoice(fileId: string): Promise<string> {
  const token = process.env.TELEGRAM_BOT_TOKEN!
  const apiKey = process.env.OPENAI_API_KEY!

  // Get the file path from Telegram
  const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`)
  if (!fileRes.ok) throw new Error(`getFile failed: ${fileRes.status}`)
  const { result } = await fileRes.json()

  // Download the OGG audio
  const audioRes = await fetch(`https://api.telegram.org/file/bot${token}/${result.file_path}`)
  if (!audioRes.ok) throw new Error(`Download failed: ${audioRes.status}`)
  const audioBlob = await audioRes.blob()

  // Send to OpenAI Whisper
  const formData = new FormData()
  formData.append('file', audioBlob, 'voice.ogg')
  formData.append('model', 'whisper-1')

  const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })
  if (!whisperRes.ok) throw new Error(`Whisper error: ${whisperRes.status}`)

  const { text } = await whisperRes.json()
  return text as string
}

async function telegramSend(chatId: number, text: string, extra: Record<string, unknown> = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...extra }),
  })
}
