'use client'

import { useState, useEffect } from 'react'
import Panel, { PanelHeader } from '../Panel'

interface Goal {
  id: string
  title: string
  timeframe: 'week' | 'month' | 'quarter'
  completed_at: string | null
}

function GoalSection({ title, goals, onToggle, onDelete }: {
  title: string
  goals: Goal[]
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  if (goals.length === 0) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
        {title}
      </div>
      {goals.map((goal, i) => {
        const done = !!goal.completed_at
        return (
          <div
            key={goal.id}
            onMouseEnter={() => setHoveredId(goal.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0',
              borderBottom: i < goals.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <button
              onClick={() => onToggle(goal.id, !done)}
              style={{
                width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                background: done ? 'var(--accent)' : 'transparent',
                border: `1.5px solid ${done ? 'var(--accent)' : 'var(--ink-4)'}`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: 'white', fontWeight: 700, transition: 'all 0.15s',
              }}
            >
              {done ? '✓' : ''}
            </button>
            <span style={{
              fontSize: 12, fontWeight: 500, flex: 1,
              color: done ? 'var(--ink-4)' : 'var(--ink-1)',
              textDecoration: done ? 'line-through' : 'none',
            }}>
              {goal.title}
            </span>
            <button
              onClick={() => onDelete(goal.id)}
              style={{
                opacity: hoveredId === goal.id ? 1 : 0,
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                background: 'var(--surface-2)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: 'var(--ink-3)', transition: 'opacity 0.15s',
              }}
            >✕</button>
          </div>
        )
      })}
    </div>
  )
}

export default function PrioritiesCard() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<'week' | 'month' | null>(null)
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    fetch('/api/goals')
      .then(r => r.json())
      .then(d => { setGoals(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function toggle(id: string, completed: boolean) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed_at: completed ? new Date().toISOString() : null } : g))
    await fetch(`/api/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
  }

  async function deleteGoal(id: string) {
    setGoals(prev => prev.filter(g => g.id !== id))
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
  }

  async function addGoal() {
    const title = newTitle.trim()
    if (!title || !adding) return
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, timeframe: adding }),
    })
    const goal = await res.json()
    setGoals(prev => [...prev, goal])
    setNewTitle('')
    setAdding(null)
  }

  const week = goals.filter(g => g.timeframe === 'week')
  const month = goals.filter(g => g.timeframe === 'month')

  return (
    <Panel>
      <PanelHeader label="Priorities" actionLabel="+ Goal" action={() => setAdding('week')} />

      {loading && <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>}

      <GoalSection title="This Week" goals={week} onToggle={toggle} onDelete={deleteGoal} />
      <GoalSection title="This Month" goals={month} onToggle={toggle} onDelete={deleteGoal} />

      {adding && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <select
            value={adding}
            onChange={e => setAdding(e.target.value as 'week' | 'month')}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 8px', fontSize: 11,
              color: 'var(--ink-1)', fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
          </select>
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addGoal(); if (e.key === 'Escape') setAdding(null) }}
            placeholder="New goal…"
            style={{
              flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 10px', fontSize: 12,
              color: 'var(--ink-0)', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={addGoal}
            style={{
              padding: '6px 11px', background: 'var(--accent)', border: 'none',
              borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Add</button>
        </div>
      )}
    </Panel>
  )
}
