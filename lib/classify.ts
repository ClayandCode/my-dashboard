import Anthropic from '@anthropic-ai/sdk'

export type CaptureType = 'task' | 'note' | 'meal' | 'journal' | 'blocker' | 'finance'

export interface Classification {
  type: CaptureType
  title: string
  body: string
  urgency?: 'low' | 'medium' | 'high' | 'critical'
  key?: boolean
  time_estimate_min?: number
  tags?: string[]
  kcal?: number
  amount?: number
  category?: string
}

const SYSTEM = `You are a personal assistant that classifies short text captures into structured data.
Return ONLY valid JSON with no markdown fences. Use this schema:
{
  "type": "task" | "note" | "meal" | "journal" | "blocker" | "finance",
  "title": "concise title under 80 chars",
  "body": "cleaned version of the full input",
  "urgency": "low" | "medium" | "high" | "critical",   // task only
  "key": boolean,                                        // task only — true = top-3 priority today
  "time_estimate_min": number,                           // task only
  "tags": ["tag1", "tag2"],                             // task only, 1-3 tags
  "kcal": number,                                        // meal only — estimated calories
  "amount": number,                                      // finance only — dollar amount if stated
  "category": "income" | "expense" | "investment"       // finance only
}

Classification rules:
- task: action item, to-do, something to do
- note: idea, thought, reference info, something to remember
- meal: food, drink, nutrition entry
- journal: personal reflection, how the day is going, feelings
- blocker: something blocking progress on a project or goal
- finance: money, transaction, financial observation`

export async function classify(text: string): Promise<Classification> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const message = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 512,
        system: SYSTEM,
        messages: [{ role: 'user', content: text }],
      })
      const raw = message.content[0].type === 'text' ? message.content[0].text : ''
      // Strip markdown fences if present
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      return JSON.parse(cleaned) as Classification
    } catch (err) {
      console.warn('[classify] Claude failed, using keyword fallback:', err)
    }
  }

  // Keyword fallback — no API needed
  return keywordClassify(text)
}

function keywordClassify(text: string): Classification {
  const t = text.toLowerCase()
  let type: CaptureType = 'note'
  if (/\b(todo|task|do|fix|finish|complete|send|call|email|buy|book|schedule|remind)\b/.test(t)) type = 'task'
  else if (/\b(ate|eat|breakfast|lunch|dinner|meal|snack|drink|coffee|food|calories|kcal|protein)\b/.test(t)) type = 'meal'
  else if (/\b(feel|feeling|today was|reflection|grateful|mood|journal|diary)\b/.test(t)) type = 'journal'
  else if (/\b(blocked|blocking|stuck|waiting on|can't proceed|blocker)\b/.test(t)) type = 'blocker'
  else if (/\b(\$|dollar|money|paid|spent|earned|invoice|expense|income|budget)\b/.test(t)) type = 'finance'

  return {
    type,
    title: text.slice(0, 80),
    body: text,
    urgency: type === 'task' ? 'medium' : undefined,
    key: false,
  }
}
