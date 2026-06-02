import { createSign } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// ── Google service account JWT auth ─────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
  // .env.local stores \n as literal chars; convert to actual newlines
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!.replace(/\\n/g, '\n')

  const now = Math.floor(Date.now() / 1000)
  const claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify(claim)).toString('base64url')
  const unsigned = `${header}.${payload}`

  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  const sig = signer.sign(privateKey, 'base64url')
  const jwt = `${unsigned}.${sig}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google auth failed ${res.status}: ${text}`)
  }

  const { access_token } = await res.json()
  return access_token as string
}

// ── Fetch all sheets from the spreadsheet ───────────────────────────────────

async function fetchSheetData(token: string, sheetId: string): Promise<string> {
  // Get all tab names first
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!metaRes.ok) throw new Error(`Sheets metadata failed ${metaRes.status}: ${await metaRes.text()}`)
  const { sheets } = await metaRes.json()
  const tabNames: string[] = (sheets ?? []).map((s: any) => s.properties.title).slice(0, 5) // max 5 tabs

  // Fetch values from each tab
  const parts: string[] = []
  for (const tab of tabNames) {
    const range = encodeURIComponent(`'${tab}'!A1:Z500`)
    const valRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!valRes.ok) continue
    const { values } = await valRes.json()
    if (!values?.length) continue

    parts.push(`=== Sheet tab: "${tab}" ===`)
    parts.push((values as string[][]).slice(0, 200).map(row => row.join('\t')).join('\n'))
  }

  return parts.join('\n\n')
}

// ── Claude extraction ────────────────────────────────────────────────────────

interface FinancialExtraction {
  net_worth: number | null
  change_amount: number | null
  categories: { label: string; value: number; pct: number; color?: string }[]
  summary: string
}

async function extractWithClaude(rawData: string): Promise<FinancialExtraction> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are analyzing a personal financial spreadsheet. Extract key financial data and return it as JSON.

SPREADSHEET DATA:
${rawData.slice(0, 12000)}

Return ONLY valid JSON in this exact shape (no markdown, no explanation):
{
  "net_worth": <total net worth as number, or null if not found>,
  "change_amount": <month-over-month or period change as number (positive = gain), or null>,
  "categories": [
    { "label": "<category name>", "value": <dollar amount as number>, "pct": <percentage 0-100 as integer> }
  ],
  "summary": "<one sentence describing the financial state>"
}

Rules:
- categories should be the top asset/account groupings (e.g. Investments, Cash, Real Estate, Crypto, Retirement)
- Include at most 5 categories, ordered by value descending
- pct values must sum to 100
- All numbers must be plain numbers (no $ signs, no commas)
- If data is unclear or missing, use null for net_worth and change_amount, and empty array for categories`,
    }],
  })

  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'
  try {
    return JSON.parse(text) as FinancialExtraction
  } catch {
    return { net_worth: null, change_amount: null, categories: [], summary: 'Could not parse spreadsheet data.' }
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Accept CRON_SECRET (Vercel cron) or API_SECRET (manual trigger via proxy)
  const auth = request.headers.get('authorization')
  const apiSecret = request.headers.get('x-api-secret')
  const cronOk = auth === `Bearer ${process.env.CRON_SECRET}`
  const apiOk = apiSecret === process.env.API_SECRET
  if (!cronOk && !apiOk) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sheetId = process.env.GOOGLE_SHEETS_FINANCE_ID
  if (!sheetId) {
    return Response.json({ ok: false, message: 'GOOGLE_SHEETS_FINANCE_ID not set' })
  }

  try {
    const token = await getAccessToken()
    const rawData = await fetchSheetData(token, sheetId)

    if (!rawData.trim()) {
      return Response.json({ ok: false, message: 'Sheet appears to be empty' })
    }

    const extracted = await extractWithClaude(rawData)

    const db = createServerClient()
    const userId = process.env.USER_ID!
    const tz = process.env.USER_TIMEZONE ?? 'America/Denver'
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date())

    await db.from('finance_snapshots').upsert({
      user_id: userId,
      snapshot_date: today,
      net_worth: extracted.net_worth,
      change_amount: extracted.change_amount,
      categories: extracted.categories,
      raw_data: { summary: extracted.summary, rawLength: rawData.length },
      source_sheet: sheetId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,snapshot_date' })

    return Response.json({ ok: true, extracted })
  } catch (err) {
    console.error('[finance/snapshot]', err)
    return Response.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
