'use client'

import { useState, useEffect } from 'react'
import Panel, { PanelHeader } from '../Panel'

interface Task {
  id: string
  title: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  key: boolean
  time_estimate_min?: number
  tags?: string[]
}

const URGENCY_DOT: Record<string, string> = {
  critical: 'var(--danger)',
  high: 'var(--warn)',
  medium: 'var(--accent)',
  low: 'var(--ink-5)',
}

export default function SessionCard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.json())
      .then(d => { setTasks(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function markDone(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
  }

  const display = tasks.slice(0, 6)

  return (
    <Panel>
      <PanelHeader label="Session — Today" actionLabel={tasks.length ? `${tasks.length} open` : undefined} />

      {loading && (
        <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '8px 0' }}>Loading…</div>
      )}

      {!loading && tasks.length === 0 && (
        <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '10px 0' }}>
          No open tasks — capture one below ↓
        </div>
      )}

      {display.map((task, i) => (
        <div
          key={task.id}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '9px 0',
            borderBottom: i < display.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <button
            onClick={() => markDone(task.id)}
            title="Mark complete"
            style={{
              width: 17, height: 17, borderRadius: '50%', flexShrink: 0, marginTop: 2,
              border: `2px solid ${URGENCY_DOT[task.urgency] ?? 'var(--ink-4)'}`,
              background: 'transparent', cursor: 'pointer',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {task.key && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                  color: 'var(--accent)', background: 'var(--accent-bg)',
                  padding: '2px 6px', borderRadius: 4,
                }}>KEY</span>
              )}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)', lineHeight: 1.3 }}>
                {task.title}
              </span>
            </div>
            {task.time_estimate_min && (
              <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>~{task.time_estimate_min}m</span>
            )}
          </div>
        </div>
      ))}

      {tasks.length > 6 && (
        <div style={{ fontSize: 11, color: 'var(--ink-4)', paddingTop: 8 }}>
          +{tasks.length - 6} more
        </div>
      )}
    </Panel>
  )
}
