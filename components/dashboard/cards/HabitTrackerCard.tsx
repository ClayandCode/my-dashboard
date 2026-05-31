'use client'

import { useState, useEffect } from 'react'
import Panel, { PanelHeader } from '../Panel'

interface Habit {
  id: string
  name: string
  icon?: string
  done: boolean
}

export default function HabitTrackerCard() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/habits')
      .then(r => r.json())
      .then(d => { setHabits(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function toggle(id: string) {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h))
    await fetch(`/api/habits/${id}/toggle`, { method: 'POST' })
  }

  const done = habits.filter(h => h.done).length
  const total = habits.length

  return (
    <Panel>
      <PanelHeader
        label="Habits — Today"
        actionLabel={total ? `${done} / ${total}` : undefined}
      />

      {loading && (
        <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '8px 0' }}>Loading…</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        {habits.map(habit => (
          <button
            key={habit.id}
            onClick={() => toggle(habit.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 11px', borderRadius: 'var(--radius-sm)',
              background: habit.done ? 'var(--ok-bg)' : 'var(--surface-2)',
              border: `1px solid ${habit.done ? 'rgba(52,199,89,0.2)' : 'transparent'}`,
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 0.15s',
            }}
          >
            <span style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: habit.done ? 'var(--ok)' : 'transparent',
              border: `1.5px solid ${habit.done ? 'var(--ok)' : 'var(--ink-4)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: 'white', fontWeight: 700, transition: 'all 0.15s',
            }}>
              {habit.done ? '✓' : ''}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: habit.done ? 'var(--ok)' : 'var(--ink-2)' }}>
              {habit.icon ? `${habit.icon} ` : ''}{habit.name}
            </span>
          </button>
        ))}
      </div>

      {!loading && total > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{done} of {total} complete</span>
          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500, color: 'var(--ok)' }}>
            {Math.round((done / total) * 100)}%
          </span>
        </div>
      )}
    </Panel>
  )
}
