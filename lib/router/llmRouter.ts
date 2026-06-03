import { callClaude, type LLMInput } from '@/lib/llm/claude'
import { callOpenAI } from '@/lib/llm/openai'
import { callGemini } from '@/lib/llm/gemini'
import { ENGINES, TASK_REGISTRY, getTaskConfig, type EngineId, type Lane } from './taskRegistry'
import { createServerClient } from '@/lib/supabase'

export type { LLMInput }

export interface RunTaskResult {
  output: string
  engineUsed: EngineId
}

interface RunTaskOpts {
  captureId?: string
}

// Build ordered engine list for a lane
function laneEngines(lane: Lane): EngineId[] {
  return lane === 'quality' ? ['claude', 'openai'] : ['geminiPaid']
}

// Pure: build chain, apply privacy filter
export function getEngineChain(taskType: string): EngineId[] {
  const config = getTaskConfig(taskType)
  const chain = [config.tier, ...config.fallback].flatMap(laneEngines)

  if (config.sensitivity === 'personal') {
    const filtered = chain.filter(id => !ENGINES[id].trainsOnData)
    if (filtered.length === 0) {
      throw new Error(`[router] No privacy-safe engines available for task "${taskType}"`)
    }
    return filtered
  }

  return chain
}

async function callEngine(engine: EngineId, input: LLMInput): Promise<string> {
  switch (engine) {
    case 'claude':     return callClaude(input)
    case 'openai':     return callOpenAI(input)
    case 'geminiPaid': return callGemini(input)
    case 'geminiFree': throw new Error('[router] geminiFree is blocked — it trains on data')
  }
}

// Defense-in-depth: promote a "safe" task to "personal" if the input looks personal
const PERSONAL_PATTERN = /[\w.+]+@[\w.-]+\.\w{2,}|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b|\$\d+/

function containsPersonalData(text: string): boolean {
  return PERSONAL_PATTERN.test(text)
}

function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('429') || msg.includes('overloaded') || msg.includes('timeout') || msg.includes('AbortError')
}

export async function runTask(
  taskType: string,
  input: LLMInput,
  opts?: RunTaskOpts,
): Promise<RunTaskResult> {
  let config = getTaskConfig(taskType)

  // Defense-in-depth: treat as personal if input looks sensitive
  if (config.sensitivity === 'safe' && containsPersonalData(input.prompt)) {
    config = { ...config, sensitivity: 'personal' }
  }

  const chain = getEngineChain(taskType)

  if (process.env.ROUTER_LOG === 'verbose') {
    console.log(`[router] ${taskType} -> chain: [${chain.join(', ')}]`)
  }

  let lastErr: unknown
  for (const engine of chain) {
    try {
      const output = await callEngine(engine, input)
      const lane = ENGINES[engine].lane
      const userId = process.env.USER_ID!
      const db = createServerClient()

      // Update llm_source on the raw capture if caller provided its id
      if (opts?.captureId) {
        await db.from('raw_captures').update({ llm_source: engine }).eq('id', opts.captureId)
      }

      // Audit trail (non-blocking)
      void db.from('audit_log')
        .insert({ user_id: userId, action: 'llm_route', metadata: { taskType, engineUsed: engine, lane } })

      return { output, engineUsed: engine }
    } catch (err) {
      console.warn(`[router] engine "${engine}" failed for "${taskType}":`, err instanceof Error ? err.message : err)
      lastErr = err
      if (!isTransient(err)) break
    }
  }

  throw new Error(`[router] All engines exhausted for task "${taskType}": ${lastErr}`)
}

// ── Boot summary (once per process) ───────────────────────────────────────────
const _g = global as unknown as { __routerBooted?: boolean }
if (!_g.__routerBooted) {
  _g.__routerBooted = true
  for (const taskType of Object.keys(TASK_REGISTRY)) {
    try {
      const chain = getEngineChain(taskType)
      const engine = chain[0]
      const lane = ENGINES[engine].lane
      console.log(`[router] ${taskType.padEnd(20)} -> ${lane.padEnd(8)} -> ${engine}`)
    } catch (e) {
      console.error(`[router] ${taskType} -> ERROR: ${e}`)
    }
  }
}
