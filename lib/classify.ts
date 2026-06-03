import { runTask, type RunTaskResult } from '@/lib/router/llmRouter'
import type { EngineId } from '@/lib/router/taskRegistry'

export type CaptureType = 'task' | 'note' | 'meal' | 'journal' | 'blocker' | 'finance' | 'health'

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
  weight_lbs?: number
  sleep_hours?: number
  hrv?: number
  energy?: number
  water_oz?: number
}

export interface ClassifyResult {
  classification: Classification
  engineUsed: EngineId
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
  "category": "income" | "expense" | "investment",      // finance only
  "weight_lbs": number,                                  // health only
  "sleep_hours": number,                                 // health only
  "hrv": number,                                         // health only
  "energy": number,                                      // health only — 1-10 scale
  "water_oz": number                                     // health only
}

Classification rules:
- task: action item, to-do, something to do
- note: idea, thought, reference info, something to remember
- meal: food, drink, nutrition entry
- journal: personal reflection, how the day is going, feelings
- blocker: something blocking progress on a project or goal
- finance: money, transaction, financial observation
- health: body metrics — weight, sleep, HRV, energy level, water intake`

export async function classify(text: string): Promise<ClassifyResult> {
  try {
    const result: RunTaskResult = await runTask('classifyCapture', {
      system: SYSTEM,
      prompt: text,
      json: true,
    })
    const classification = JSON.parse(result.output) as Classification
    return { classification, engineUsed: result.engineUsed }
  } catch (err) {
    console.warn('[classify] router failed, using keyword fallback:', err)
    return { classification: keywordClassify(text), engineUsed: 'claude' }
  }
}

function keywordClassify(text: string): Classification {
  const t = text.toLowerCase()
  let type: CaptureType = 'note'
  if (/\b(todo|task|do|fix|finish|complete|send|call|email|buy|book|schedule|remind)\b/.test(t)) type = 'task'
  else if (/\b(ate|eat|breakfast|lunch|dinner|meal|snack|drink|coffee|food|calories|kcal|protein)\b/.test(t)) type = 'meal'
  else if (/\b(feel|feeling|today was|reflection|grateful|mood|journal|diary)\b/.test(t)) type = 'journal'
  else if (/\b(blocked|blocking|stuck|waiting on|can't proceed|blocker)\b/.test(t)) type = 'blocker'
  else if (/\b(\$|dollar|money|paid|spent|earned|invoice|expense|income|budget)\b/.test(t)) type = 'finance'
  else if (/\b(weigh(ed|t)|slept|sleep|hrv|energy level|water|oz|lbs|pounds|resting heart|recovery)\b/.test(t)) type = 'health'

  return {
    type,
    title: text.slice(0, 80),
    body: text,
    urgency: type === 'task' ? 'medium' : undefined,
    key: false,
  }
}
