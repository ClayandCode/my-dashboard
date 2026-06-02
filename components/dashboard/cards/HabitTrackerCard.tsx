'use client'

import { useState, useEffect } from 'react'
import Panel, { PanelHeader } from '../Panel'
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
  sort_order: number
  time_estimate_min?: number
  done: boolean
  subtasks: Subtask[]
}

export default function HabitTrackerCard() {
  const demo = useDemoMode()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)

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

  async function toggleHabit(habit: Habit) {
    if (habit.subtasks.length > 0) return // subtask-driven habits can't be toggled directly
    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, done: !h.done } : h))
    await fetch(`/api/habits/${habit.id}/toggle`, { method: 'POST' })
  }

  async function toggleSubtask(habit: Habit, sub: Subtask) {
    const newDone = !sub.done
    setHabits(prev => prev.map(h => {
      if (h.id !== habit.id) return h
      const newSubs = h.subtasks.map(s => s.id === sub.id ? { ...s, done: newDone } : s)
      const allDone = newSubs.every(s => s.done)
      return { ...h, subtasks: newSubs, done: allDone }
    }))
    await fetch(`/api/habits/${habit.id}/subtasks/${sub.id}/toggle`, { method: 'POST' })
  }

  const totalHabits = habits.length
  const doneHabits = habits.filter(h => h.done).length
  const overallPct = totalHabits > 0 ? Math.round((doneHabits / totalHabits) * 100) : 0

  return (
    <Panel>
      {/* Header with overall progress */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
            Habits — Today
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: overallPct === 100 ? 'var(--ok)' : 'var(--accent)' }}>
            {overallPct}%
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${overallPct}%`,
            background: overallPct === 100 ? 'var(--ok)' : 'var(--accent)',
            borderRadius: 3,
            transition: 'width 0.4s ease, background 0.3s',
          }} />
        </div>
        {totalHabits > 0 && (
          <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 4 }}>
            {doneHabits} of {totalHabits} complete
          </div>
        )}
      </div>

      {loading && <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {habits.map(habit => {
          const hasSubs = habit.subtasks.length > 0
          const doneSubs = habit.subtasks.filter(s => s.done).length
          const subPct = hasSubs ? Math.round((doneSubs / habit.subtasks.length) * 100) : (habit.done ? 100 : 0)
          const totalMin = habit.time_estimate_min ??
            (hasSubs ? habit.subtasks.reduce((s, sub) => s + (sub.time_estimate_min ?? 0), 0) : 0)

          return (
            <div
              key={habit.id}
              style={{
                borderRadius: 10,
                background: habit.done ? 'var(--ok-bg)' : 'var(--surface-2)',
                border: `1px solid ${habit.done ? 'rgba(52,199,89,0.18)' : 'transparent'}`,
                overflow: 'hidden',
                transition: 'background 0.2s, border-color 0.2s',
              }}
            >
              {/* Habit header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px 7px' }}>
                <button
                  onClick={() => toggleHabit(habit)}
                  disabled={hasSubs}
                  style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: habit.done ? 'var(--ok)' : 'transparent',
                    border: `1.5px solid ${habit.done ? 'var(--ok)' : 'var(--ink-4)'}`,
                    cursor: hasSubs ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: 'white', fontWeight: 700,
                    transition: 'all 0.15s', padding: 0,
                  }}
                >
                  {habit.done ? '✓' : ''}
                </button>
                <span style={{
                  flex: 1, fontSize: 13, fontWeight: 600,
                  color: habit.done ? 'var(--ok)' : 'var(--ink-1)',
                  transition: 'color 0.15s',
                }}>
                  {habit.icon ? `${habit.icon} ` : ''}{habit.name}
                </span>
                {totalMin > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--ink-4)', flexShrink: 0 }}>
                    {totalMin}m
                  </span>
                )}
              </div>

              {/* Subtasks */}
              {hasSubs && (
                <div style={{ paddingLeft: 20, paddingRight: 11, paddingBottom: 6 }}>
                  {habit.subtasks.map(sub => (
                    <div
                      key={sub.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '4px 0',
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      <button
                        onClick={() => toggleSubtask(habit, sub)}
                        style={{
                          width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                          background: sub.done ? 'var(--ok)' : 'transparent',
                          border: `1.5px solid ${sub.done ? 'var(--ok)' : 'var(--ink-4)'}`,
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 8, color: 'white', fontWeight: 700,
                          transition: 'all 0.15s', padding: 0,
                        }}
                      >
                        {sub.done ? '✓' : ''}
                      </button>
                      <span style={{
                        flex: 1, fontSize: 11,
                        color: sub.done ? 'var(--ok)' : 'var(--ink-3)',
                        textDecoration: sub.done ? 'line-through' : 'none',
                        transition: 'all 0.15s',
                      }}>
                        {sub.name}
                      </span>
                      {sub.time_estimate_min && (
                        <span style={{ fontSize: 9, color: 'var(--ink-4)' }}>{sub.time_estimate_min}m</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom progress bar */}
              <div style={{ padding: '0 0 0', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 11px 8px' }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${subPct}%`, height: '100%',
                      background: subPct === 100 ? 'var(--ok)' : 'var(--accent)',
                      borderRadius: 2,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  {hasSubs && (
                    <span style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'monospace', flexShrink: 0 }}>
                      {doneSubs}/{habit.subtasks.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
