'use client'

import { useState, useEffect, useRef } from 'react'
import Panel from '../Panel'
import { useDemoMode } from '@/components/DemoContext'
import { DEMO_HABITS } from '@/lib/demoData'

interface Subtask {
  id: string
  habit_id: string
  name: string
  sort_order: number
  time_estimate_min?: number
  done: boolean
}

interface Habit {
  id: string
  name: string
  icon?: string
  category?: string
  sort_order: number
  time_estimate_min?: number
  streak: number
  done: boolean
  subtasks: Subtask[]
}

const CONFETTI_COLORS = ['#30D158','#0A84FF','#FF9F0A','#FF453A','#BF5AF2','#32ADE6','#FFD60A','#FF6961']

// Deterministic positions so no hydration issues
const CONFETTI_SLOTS = Array.from({ length: 24 }, (_, i) => ({
  left: `${6 + (i / 24) * 88}%`,
  top:  `${20 + ((i * 17) % 60)}%`,
  dir:  (['confetti-up','confetti-left','confetti-right'] as const)[i % 3],
  dur:  `${0.65 + (i % 5) * 0.07}s`,
  delay:`${(i % 6) * 0.045}s`,
  w:    `${5 + (i % 3) * 2}px`,
  h:    `${4 + (i % 4) * 2}px`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}))

function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      zIndex: 30, overflow: 'visible', borderRadius: 'inherit',
    }}>
      {CONFETTI_SLOTS.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: p.left, top: p.top,
          width: p.w, height: p.h,
          background: p.color,
          borderRadius: 2,
          animation: `${p.dir} ${p.dur} ${p.delay} ease-out forwards`,
        }} />
      ))}
    </div>
  )
}

function ScoreCircle({ score }: { score: number }) {
  const r = 34
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <svg width={82} height={82} style={{ flexShrink: 0 }}>
      <circle cx={41} cy={41} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={5} />
      <circle
        cx={41} cy={41} r={r}
        fill="none" stroke="var(--ok)" strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 41 41)"
        style={{ transition: 'stroke-dashoffset 0.65s ease' }}
      />
      <text x={41} y={46} textAnchor="middle"
        fill="var(--ink-0)" fontSize={21} fontWeight={700}
        fontFamily="'SF Mono','JetBrains Mono',monospace"
      >
        {score}
      </text>
    </svg>
  )
}

// Square checkbox, works in both light/dark
function Checkbox({ checked, size = 18 }: { checked: boolean; size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.round(size * 0.28),
      flexShrink: 0,
      background: checked ? 'var(--ok)' : 'transparent',
      border: `1.5px solid ${checked ? 'var(--ok)' : 'var(--ink-3)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.6),
      color: 'white', fontWeight: 800,
      transition: 'all 0.18s ease',
      boxShadow: checked ? '0 0 8px rgba(48,209,88,0.4)' : 'none',
    }}>
      {checked ? '✓' : ''}
    </div>
  )
}

function motivationalText(score: number) {
  if (score === 0)   return 'Start with one.'
  if (score < 34)    return 'Keep going.'
  if (score < 67)    return 'Good progress.'
  if (score < 100)   return 'On track.'
  return 'Perfect day. 🔥'
}

export default function HabitTrackerCard() {
  const demo = useDemoMode()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set())
  const prevDoneRef  = useRef<Set<string>>(new Set())
  const isFirstLoad  = useRef(true)

  function load() {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => { setHabits(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (demo) { setHabits(DEMO_HABITS as Habit[]); setLoading(false) }
    else        load()
  }, [demo])

  // Detect newly-completed habits → fire confetti
  // Skip the very first data load so we don't confetti on every page open
  useEffect(() => {
    if (habits.length === 0) return
    if (isFirstLoad.current) {
      isFirstLoad.current = false
      prevDoneRef.current = new Set(habits.filter(h => h.done).map(h => h.id))
      return
    }

    const newlyDone = habits
      .filter(h => h.done && !prevDoneRef.current.has(h.id))
      .map(h => h.id)

    if (newlyDone.length > 0) {
      setJustCompleted(prev => { const n = new Set(prev); newlyDone.forEach(id => n.add(id)); return n })
      setTimeout(() => {
        setJustCompleted(prev => { const n = new Set(prev); newlyDone.forEach(id => n.delete(id)); return n })
      }, 950)
    }

    prevDoneRef.current = new Set(habits.filter(h => h.done).map(h => h.id))
  }, [habits])

  async function toggleHabit(habit: Habit) {
    if (habit.subtasks.length > 0) return
    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, done: !h.done } : h))
    if (!demo) await fetch(`/api/habits/${habit.id}/toggle`, { method: 'POST' })
  }

  async function toggleSubtask(habit: Habit, sub: Subtask) {
    const newDone = !sub.done
    setHabits(prev => prev.map(h => {
      if (h.id !== habit.id) return h
      const newSubs = h.subtasks.map(s => s.id === sub.id ? { ...s, done: newDone } : s)
      return { ...h, subtasks: newSubs, done: newSubs.every(s => s.done) }
    }))
    if (!demo) await fetch(`/api/habits/${habit.id}/subtasks/${sub.id}/toggle`, { method: 'POST' })
  }

  const totalHabits  = habits.length
  const doneHabits   = habits.filter(h => h.done).length
  const score        = totalHabits > 0 ? Math.round((doneHabits / totalHabits) * 100) : 0
  const selectedHabit = habits.find(h => h.id === selectedId) ?? null

  return (
    <Panel style={{ padding: 0, overflow: 'visible' }}>
      {/* ── Header ── */}
      <div style={{ padding: '16px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--ink-3)',
            fontFamily: "'SF Mono','JetBrains Mono',monospace",
          }}>
            // HABITS
          </span>
          <span style={{
            fontSize: 10, color: 'var(--ink-3)',
            fontFamily: "'SF Mono','JetBrains Mono',monospace",
          }}>
            {doneHabits}/{totalHabits} · {score}%
          </span>
        </div>

        {/* Score row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ScoreCircle score={score} />
          <div>
            <div style={{
              fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--ink-4)', fontFamily: "'SF Mono','JetBrains Mono',monospace",
              marginBottom: 5,
            }}>
              DAILY SCORE · RESETS 00:00
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-1)' }}>
              {motivationalText(score)}
            </div>
          </div>
        </div>
      </div>

      {loading && <div style={{ padding: '0 18px 16px', color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>}

      {/* ── Habit grid ── */}
      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 7,
          padding: '0 12px 12px',
        }}>
          {habits.map(habit => {
            const hasSubs   = habit.subtasks.length > 0
            const doneSubs  = habit.subtasks.filter(s => s.done).length
            const pct       = hasSubs ? (doneSubs / habit.subtasks.length) * 100 : (habit.done ? 100 : 0)
            const isSelected = selectedId === habit.id
            const isJustDone = justCompleted.has(habit.id)

            const metaLabel = [
              habit.category,
              hasSubs ? `${doneSubs}/${habit.subtasks.length}` : null,
              habit.time_estimate_min ? `${habit.time_estimate_min}M` : null,
            ].filter(Boolean).join(' · ')

            function handleCardClick() {
              if (!hasSubs) {
                // No subtasks — card click = toggle
                toggleHabit(habit)
              } else {
                // Has subtasks — card click = select/deselect
                setSelectedId(isSelected ? null : habit.id)
              }
            }

            return (
              <div
                key={habit.id}
                onClick={handleCardClick}
                style={{
                  position: 'relative',
                  borderRadius: 12,
                  background: habit.done
                    ? 'rgba(48,209,88,0.10)'
                    : 'var(--surface-2)',
                  border: `1px solid ${
                    habit.done
                      ? 'rgba(48,209,88,0.30)'
                      : isSelected
                        ? 'rgba(48,209,88,0.40)'
                        : 'var(--border)'
                  }`,
                  boxShadow: habit.done
                    ? '0 0 20px rgba(48,209,88,0.20), inset 0 0 0 1px rgba(48,209,88,0.08)'
                    : isSelected
                      ? '0 0 0 2px rgba(48,209,88,0.25)'
                      : 'none',
                  cursor: 'pointer',
                  // Don't clip confetti
                  overflow: isJustDone ? 'visible' : 'hidden',
                  transition: 'box-shadow 0.3s, background 0.2s, border-color 0.2s',
                }}
              >
                <Confetti active={isJustDone} />

                {/* Card body */}
                <div style={{ padding: '12px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Top row: checkbox + name + streak */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={e => { e.stopPropagation(); toggleHabit(habit) }}
                      disabled={hasSubs}
                      style={{
                        background: 'none', border: 'none',
                        padding: 0, cursor: hasSubs ? 'default' : 'pointer',
                        flexShrink: 0, display: 'flex',
                      }}
                    >
                      <Checkbox checked={habit.done} size={19} />
                    </button>
                    <span style={{
                      flex: 1, fontSize: 13, fontWeight: 700, lineHeight: 1.25,
                      color: habit.done ? 'var(--ok)' : 'var(--ink-0)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      transition: 'color 0.2s',
                    }}>
                      {habit.name}
                    </span>
                    <span style={{
                      fontSize: 9, flexShrink: 0, lineHeight: 1,
                      color: (habit.streak ?? 0) > 0 ? 'var(--warn)' : 'var(--ink-4)',
                      fontFamily: "'SF Mono','JetBrains Mono',monospace",
                    }}>
                      🔥{habit.streak ?? 0}
                    </span>
                  </div>

                  {/* Meta row: category · X/Y · time */}
                  {metaLabel ? (
                    <div style={{
                      fontSize: 9, color: 'var(--ink-4)',
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      fontFamily: "'SF Mono','JetBrains Mono',monospace",
                      paddingLeft: 27,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {metaLabel}
                    </div>
                  ) : <div style={{ height: 0 }} />}
                </div>

                {/* Bottom progress bar (always rendered, outside padding so it touches card edge) */}
                <div style={{ height: 3, background: 'rgba(0,0,0,0.10)' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: 'var(--ok)',
                    transition: 'width 0.35s ease',
                    borderRadius: pct < 100 ? '0 2px 2px 0' : 0,
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Subtask panel ── */}
      {selectedHabit && selectedHabit.subtasks.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 14px 16px',
          background: 'rgba(0,0,0,0.08)',
          borderRadius: '0 0 var(--radius) var(--radius)',
        }}>
          <div style={{
            fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--ink-4)', fontFamily: "'SF Mono','JetBrains Mono',monospace",
            marginBottom: 10,
          }}>
            {selectedHabit.name} · SUB-TASKS · ALL REQUIRED TO COMPLETE
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 7,
          }}>
            {selectedHabit.subtasks.map((sub, idx) => (
              <button
                key={sub.id}
                onClick={() => toggleSubtask(selectedHabit, sub)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 9,
                  padding: '11px 10px',
                  borderRadius: 10,
                  background: sub.done ? 'rgba(48,209,88,0.09)' : 'var(--surface-2)',
                  border: `1px solid ${sub.done ? 'rgba(48,209,88,0.25)' : 'var(--border)'}`,
                  boxShadow: sub.done ? '0 0 10px rgba(48,209,88,0.12)' : 'none',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.18s',
                }}
              >
                <Checkbox checked={sub.done} size={16} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 9, color: 'var(--ink-4)', marginBottom: 3,
                    fontFamily: "'SF Mono','JetBrains Mono',monospace",
                  }}>
                    {idx + 1}.
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 600, lineHeight: 1.3,
                    color: sub.done ? 'var(--ok)' : 'var(--ink-0)',
                    textDecoration: sub.done ? 'line-through' : 'none',
                    textDecorationColor: 'var(--ok)',
                    transition: 'all 0.18s',
                    wordBreak: 'break-word',
                  }}>
                    {sub.name}
                  </div>
                  {sub.time_estimate_min && (
                    <div style={{
                      fontSize: 9, color: 'var(--ink-4)', marginTop: 3,
                      fontFamily: "'SF Mono','JetBrains Mono',monospace",
                      textTransform: 'uppercase',
                    }}>
                      {sub.time_estimate_min}m
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}
