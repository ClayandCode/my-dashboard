export type EngineId = 'claude' | 'openai' | 'geminiPaid' | 'geminiFree'
export type Lane = 'quality' | 'cheap'
export type Sensitivity = 'personal' | 'safe'

export interface EngineConfig {
  lane: Lane
  trainsOnData: boolean
}

export interface TaskConfig {
  sensitivity: Sensitivity
  tier: Lane
  fallback: Lane[]
}

export const ENGINES: Record<EngineId, EngineConfig> = {
  claude:     { lane: 'quality', trainsOnData: false },
  openai:     { lane: 'quality', trainsOnData: false },
  geminiPaid: { lane: 'cheap',   trainsOnData: false },
  geminiFree: { lane: 'cheap',   trainsOnData: true  }, // declared but NEVER routed to
}

export const TASK_REGISTRY: Record<string, TaskConfig> = {
  classifyCapture: { sensitivity: 'personal', tier: 'quality', fallback: ['cheap']   },
  enrichCapture:   { sensitivity: 'personal', tier: 'quality', fallback: ['cheap']   },
  tagNormalize:    { sensitivity: 'safe',     tier: 'cheap',   fallback: ['quality'] },
  gamifyCopy:      { sensitivity: 'safe',     tier: 'cheap',   fallback: ['quality'] },
  conceptExplain:  { sensitivity: 'safe',     tier: 'cheap',   fallback: ['quality'] },
  financeExtract:  { sensitivity: 'personal', tier: 'quality', fallback: []          },
  journalSummary:  { sensitivity: 'personal', tier: 'quality', fallback: ['cheap']   },
  crmSmartSearch:  { sensitivity: 'personal', tier: 'quality', fallback: ['cheap']   },
  embedText:       { sensitivity: 'personal', tier: 'quality', fallback: []          },
  transcribeAudio: { sensitivity: 'personal', tier: 'quality', fallback: []          },
}

const DEFAULT_CONFIG: TaskConfig = { sensitivity: 'personal', tier: 'cheap', fallback: ['quality'] }

export function getTaskConfig(taskType: string): TaskConfig {
  return TASK_REGISTRY[taskType] ?? DEFAULT_CONFIG
}

// ── Boot assertion ─────────────────────────────────────────────────────────────
// Resolve the full engine chain for a task (without privacy filtering)
function resolveChain(tier: Lane, fallback: Lane[]): EngineId[] {
  const laneOrder: Record<Lane, EngineId[]> = {
    quality: ['claude', 'openai'],
    cheap:   ['geminiPaid'], // geminiFree intentionally excluded from routing
  }
  return [tier, ...fallback].flatMap(lane => laneOrder[lane])
}

for (const [taskType, config] of Object.entries(TASK_REGISTRY)) {
  if (config.sensitivity === 'personal') {
    const chain = resolveChain(config.tier, config.fallback)
    const violator = chain.find(id => ENGINES[id].trainsOnData)
    if (violator) {
      throw new Error(
        `[router] PRIVACY VIOLATION: task "${taskType}" can route to "${violator}" which trains on data`
      )
    }
  }
}
