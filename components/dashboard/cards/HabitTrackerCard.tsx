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
  done: boolean
  subtasks: Subtask[]
}

const CONFETTI_COLORS = ['#30D158', '#0A84FF', '#FF9F0A', '#FF453A', '#BF5AF2', '#32ADE6', '#FF6961', '#FFD60A']

function ScoreCircle({ score }: { score: number }) {
  const r = 34
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <svg width={80} height={80} style={{ flexShrink: 0 }}>
      <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
      <circle
        cx={40} cy={40} r={r}
        fill="none"
        stroke="var(--ok)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
      <text
        x={40} y={45}
        textAnchor="middle"
        fill="var(--ink-0)"
        fontSize={20}
        fontWeight={700}
        fontFamily="'SF Mono','JetBrains Mono',monospace"
      >
        {score}
      </text>
    </svg>
  )
}

interface ConfettiProps { active: boolean }
function Confetti({ active }: ConfettiProps) {
  if (!active) return null
  const particles = Array.from({ length: 20 }, (_, i) => {
    const dir = i % 3 === 0 ? 'confetti-left' : i % 3 === 1 ? 'confetti-right' : 'confetti-up'
    return {
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: `${10 + (i / 20) * 80}%`,
      top: `${30 + Math.sin(i) * 20}%`,
      delay: `${(i % 5) * 0.06}s`,
      dur: `${0.6 + Math.random() * 0.4}s`,
      w: `${5 + (i % 3) * 2}px`,
      h: `${4 + (i % 4) * 2}px`,
      dir,
    }
  })

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20, overflow: 'hidden', borderRadius: 'inherit' }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.w,
            height: p.h,
            background: p.color,
            borderRadius: 2,
            animation: `${p.dir} ${p.dur} ${p.delay} ease-out forwards`,
          }}
        />
      ))}
    </div>
  )
}

function motivationalText(score: number) {
  if (score === 0) return 'Start with one.'
  if (score < 34) return 'Keep going.'
  if (score < 67) return 'Good progress.'
  if (score < 100) return 'On track.'
  return 'Perfect day.'
}

export default function HabitTrackerCard() {
  const demo = useDemoMode()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set())
  const prevDoneRef = useRef<Set<string>>(new Set())

  function load() {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => { setHabits(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (demo) {
      setHabits(DEMO_HABITS as Habit[])
      setLoading(false)
    } else {
      load()
    }
  }, [demo])

  // Detect newly-completed habits for confetti
  useEffect(() => {
    const newlyDone = habits
      .filter(h => h.done && !prevDoneRef.current.has(h.id))
      .map(h => h.id)

    if (newlyDone.length > 0) {
      setJustCompleted(prev => {
        const next = new Set(prev)
        newlyDone.forEach(id => next.add(id))
        return next
      })
      setTimeout(() => {
        setJustCompleted(prev => {
          const next = new Set(prev)
          newlyDone.forEach(id => next.delete(id))
          return next
        })
      }, 900)
    }

    prevDoneRef.current = new Set(habits.filter(h => h.done).map(h => h.id))
  }, [habits])

  async function toggleHabit(habit: Habit) {
    if (habit.subtasks.length > 0) return
    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, done: !h.done } : h))
    await fetch(`/api/habits/${habit.id}/toggle`, { method: 'POST' })
  }

  async function toggleSubtask(habit: Habit, sub: Subtask) {
    const newDone = !sub.done
    setHabits(prev => prev.map(h => {
      if (h.id !== habit.id) return h
      const newSubs = h.subtasks.map(s => s.id === sub.id ? { ...s, done: newDone } : s)
      return { ...h, subtasks: newSubs, done: newSubs.every(s => s.done) }
    }))
    if (!demo) {
      await fetch(`/api/habits/${habit.id}/subtasks/${sub.id}/toggle`, { method: 'POST' })
    }
  }

  const totalHabits = habits.length
  const doneHabits = habits.filter(h => h.done).length
  const score = totalHabits > 0 ? Math.round((doneHabits / totalHabits) * 100) : 0

  const selectedHabit = habits.find(h => h.id === selectedId) ?? null

  return (
    <Panel style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 12px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
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

        {/* Score section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <ScoreCircle score={score} />
          <div>
            <div style={{
              fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--ink-4)', fontFamily: "'SF Mono','JetBrains Mono',monospace",
              marginBottom: 4,
            }}>
              DAILY SCORE · RESETS 00:00
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>
              {motivationalText(score)}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ padding: '0 16px 14px', color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>
      )}

      {/* Habit grid */}
      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          padding: '0 10px 10px',
        }}>
          {habits.map(habit => {
            const hasSubs = habit.subtasks.length > 0
            const doneSubs = habit.subtasks.filter(s => s.done).length
            const pct = hasSubs
              ? (doneSubs / habit.subtasks.length) * 100
              : habit.done ? 100 : 0
            const isSelected = selectedId === habit.id
            const isJustDone = justCompleted.has(habit.id)

            const subtaskLabel = [
              habit.category,
              hasSubs ? `${doneSubs}/${habit.subtasks.length}` : null,
              habit.time_estimate_min ? `${habit.time_estimate_min} MIN` : null,
            ].filter(Boolean).join(' · ')

            return (
              <div
                key={habit.id}
                onClick={() => setSelectedId(isSelected ? null : habit.id)}
                style={{
                  position: 'relative',
                  borderRadius: 12,
                  background: habit.done
                    ? 'rgba(48,209,88,0.10)'
                    : isSelected ? 'var(--surface-2)' : 'var(--surface-2)',
                  border: `1px solid ${habit.done
                    ? 'rgba(48,209,88,0.28)'
                    : isSelected ? 'rgba(255,255,255,0.14)' : 'var(--border)'}`,
                  boxShadow: habit.done
                    ? '0 0 18px rgba(48,209,88,0.18), inset 0 0 0 1px rgba(48,209,88,0.1)'
                    : 'none',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.35s ease, background 0.25s, border-color 0.25s',
                  outline: isSelected ? '2px solid rgba(48,209,88,0.5)' : 'none',
                  outlineOffset: -2,
                }}
              >
                <Confetti active={isJustDone} />

                <div style={{ padding: '10px 10px 8px' }}>
                  {/* Name row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
                      {/* Square checkbox */}
                      <button
                        onClick={e => { e.stopPropagation(); toggleHabit(habit) }}
                        disabled={hasSubs}
                        style={{
                          width: 18, height: 18, borderRadius: 5,
                          background: habit.done ? 'var(--ok)' : 'transparent',
                          border: `1.5px solid ${habit.done ? 'var(--ok)' : 'rgba(255,255,255,0.25)'}`,
                          cursor: hasSubs ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, color: 'white', fontWeight: 800,
                          transition: 'all 0.2s', padding: 0, flexShrink: 0,
                        }}
                      >
                        {habit.done ? '✓' : ''}
                      </button>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: habit.done ? 'var(--ok)' : 'var(--ink-0)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'color 0.2s',
                      }}>
                        {habit.name}
                      </span>
                    </div>
                    {/* Streak placeholder */}
                    <span style={{ fontSize: 9, color: 'var(--ink-4)', flexShrink: 0, paddingTop: 2 }}>
                      🔥 0
                    </span>
                  </div>

                  {/* Category / count / time */}
                  {subtaskLabel && (
                    <div style={{
                      fontSize: 9, color: 'var(--ink-4)',
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      fontFamily: "'SF Mono','JetBrains Mono',monospace",
                      paddingLeft: 25,
                    }}>
                      {subtaskLabel}
                    </div>
                  )}
                </div>

                {/* Bottom progress bar */}
                <div style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: 'var(--ok)',
                    transition: 'width 0.35s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Subtasks panel */}
      {selectedHabit && selectedHabit.subtasks.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 14px 14px',
          background: 'rgba(0,0,0,0.12)',
        }}>
          <div style={{
            fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--ink-4)', fontFamily: "'SF Mono','JetBrains Mono',monospace",
            marginBottom: 10,
          }}>
            SUB-TASKS · ALL REQUIRED TO COMPLETE
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
          }}>
            {selectedHabit.subtasks.map((sub, idx) => (
              <button
                key={sub.id}
                onClick={() => toggleSubtask(selectedHabit, sub)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '9px 10px',
                  borderRadius: 10,
                  background: sub.done ? 'rgba(48,209,88,0.08)' : 'var(--surface-2)',
                  border: `1px solid ${sub.done ? 'rgba(48,209,88,0.2)' : 'var(--border)'}`,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                {/* Square checkbox */}
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  background: sub.done ? 'var(--ok)' : 'transparent',
                  border: `1.5px solid ${sub.done ? 'var(--ok)' : 'rgba(255,255,255,0.22)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: 'white', fontWeight: 800,
                  transition: 'all 0.15s',
                }}>
                  {sub.done ? '✓' : ''}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: 'var(--ink-4)', marginBottom: 2, fontFamily: "'SF Mono','JetBrains Mono',monospace" }}>
                    {idx + 1}.
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 500,
                    color: sub.done ? 'var(--ok)' : 'var(--ink-1)',
                    textDecoration: sub.done ? 'line-through' : 'none',
                    textDecorationColor: 'var(--ok)',
                    lineHeight: 1.3,
                    transition: 'all 0.15s',
                  }}>
                    {sub.name}
                  </div>
                  {sub.time_estimate_min && (
                    <div style={{ fontSize: 9, color: 'var(--ink-4)', marginTop: 2, fontFamily: "'SF Mono','JetBrains Mono',monospace", textTransform: 'uppercase' }}>
                      {sub.time_estimate_min} MIN
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
