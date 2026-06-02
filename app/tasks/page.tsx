'use client'

import { useState, useEffect, useCallback } from 'react'
import TopRail from '@/components/dashboard/TopRail'

interface Task {
  id: string
  title: string
  description: string | null
  urgency: 'critical' | 'high' | 'medium' | 'low'
  key: boolean
  time_estimate_min: number | null
  tags: string[]
  completed_at: string | null
  created_at: string
}

type View = 'kanban' | 'smart' | 'category'

const URGENCY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  critical: { label: 'Today',      color: 'var(--danger)',  dot: '#ef4444' },
  high:     { label: 'This Week',  color: '#f59e0b',        dot: '#f59e0b' },
  medium:   { label: 'This Month', color: '#10b981',        dot: '#10b981' },
  low:      { label: 'Someday',    color: 'var(--ink-3)',   dot: '#9ca3af' },
}

const URGENCY_ORDER = ['critical', 'high', 'medium', 'low']

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('kanban')
  const [editing, setEditing] = useState<Task | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newUrgency, setNewUrgency] = useState<string>('high')
  const [newKey, setNewKey] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const r = await fetch('/api/tasks')
    if (r.ok) setTasks(await r.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function createTask() {
    if (!newTitle.trim() || saving) return
    setSaving(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), urgency: newUrgency, key: newKey }),
    })
    setNewTitle('')
    setNewKey(false)
    setAddingTask(false)
    setSaving(false)
    load()
  }

  async function completeTask(id: string, done: boolean) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed_at: done ? new Date().toISOString() : null } : t))
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: done }),
    })
    if (done) setTimeout(() => setTasks(prev => prev.filter(t => t.id !== id)), 600)
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    await fetch(`/api/tasks/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editing.title,
        description: editing.description,
        urgency: editing.urgency,
        key: editing.key,
        time_estimate_min: editing.time_estimate_min,
      }),
    })
    setSaving(false)
    setEditing(null)
    load()
  }

  const open = tasks.filter(t => !t.completed_at)

  function TaskCard({ task }: { task: Task }) {
    const cfg = URGENCY_CONFIG[task.urgency] ?? URGENCY_CONFIG.low
    const isCompleting = !!task.completed_at

    return (
      <div
        onClick={() => setEditing({ ...task })}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '10px 12px',
          cursor: 'pointer',
          opacity: isCompleting ? 0.4 : 1,
          transition: 'opacity 0.5s',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <input
            type="checkbox"
            checked={isCompleting}
            onChange={e => { e.stopPropagation(); completeTask(task.id, e.target.checked) }}
            onClick={e => e.stopPropagation()}
            style={{ marginTop: 2, accentColor: cfg.dot, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              {task.key && <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>⭐ KEY</span>}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-0)' }}>{task.title}</span>
            </div>
            {task.description && (
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.description}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              {task.time_estimate_min && (
                <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>~{task.time_estimate_min}m</span>
              )}
              {task.tags.map(tag => (
                <span key={tag} style={{ fontSize: 10, color: 'var(--ink-4)', background: 'var(--bg)', borderRadius: 4, padding: '1px 5px' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
            title="Delete"
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              color: 'var(--ink-4)', fontSize: 14, padding: '0 2px',
              flexShrink: 0, lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      </div>
    )
  }

  function KanbanView() {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start' }}>
        {URGENCY_ORDER.map(urg => {
          const cfg = URGENCY_CONFIG[urg]
          const col = open.filter(t => t.urgency === urg)
          const keyTasks = col.filter(t => t.key)
          const rest = col.filter(t => !t.key)
          return (
            <div key={urg}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-1)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: 11, color: 'var(--ink-4)', marginLeft: 'auto' }}>{col.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...keyTasks, ...rest].map(t => <TaskCard key={t.id} task={t} />)}
                {col.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', padding: '12px 0', textAlign: 'center' }}>Empty</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function SmartView() {
    const sorted = [...open].sort((a, b) => {
      if (a.key !== b.key) return a.key ? -1 : 1
      const ua = URGENCY_ORDER.indexOf(a.urgency)
      const ub = URGENCY_ORDER.indexOf(b.urgency)
      return ua - ub
    })
    return (
      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map(t => {
          const cfg = URGENCY_CONFIG[t.urgency]
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: cfg.dot, width: 60, flexShrink: 0 }}>
                {cfg.label.toUpperCase()}
              </span>
              <div style={{ flex: 1 }}>
                <TaskCard task={t} />
              </div>
            </div>
          )
        })}
        {open.length === 0 && <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>All clear!</div>}
      </div>
    )
  }

  function CategoryView() {
    const byTag: Record<string, Task[]> = { Untagged: [] }
    for (const t of open) {
      if (t.tags.length === 0) {
        byTag['Untagged'].push(t)
      } else {
        for (const tag of t.tags) {
          if (!byTag[tag]) byTag[tag] = []
          byTag[tag].push(t)
        }
      }
    }
    const groups = Object.entries(byTag).filter(([, ts]) => ts.length > 0)
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'start' }}>
        {groups.map(([tag, ts]) => (
          <div key={tag} style={{ minWidth: 260, flex: '1 1 260px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {tag} <span style={{ fontWeight: 400, color: 'var(--ink-4)' }}>({ts.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ts.map(t => <TaskCard key={t.id} task={t} />)}
            </div>
          </div>
        ))}
        {groups.length === 0 && <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>All clear!</div>}
      </div>
    )
  }

  return (
    <>
      <TopRail />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 20px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-0)', margin: 0 }}>
            Tasks
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-4)', marginLeft: 8 }}>
              {open.length} open
            </span>
          </h1>
          <div style={{ flex: 1 }} />

          {/* View switcher */}
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {(['kanban', 'smart', 'category'] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '5px 12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 12, fontWeight: 500, textTransform: 'capitalize',
                  background: view === v ? 'var(--accent)' : 'transparent',
                  color: view === v ? '#fff' : 'var(--ink-2)',
                }}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAddingTask(true)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            + New Task
          </button>
        </div>

        {/* Quick-add form */}
        {addingTask && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--accent)',
            borderRadius: 10, padding: 14, marginBottom: 16,
            display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createTask(); if (e.key === 'Escape') setAddingTask(false) }}
              placeholder="Task title…"
              style={{
                flex: 1, minWidth: 200, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 14, color: 'var(--ink-0)', fontFamily: 'inherit',
              }}
            />
            <select
              value={newUrgency}
              onChange={e => setNewUrgency(e.target.value)}
              style={{
                padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--bg)', color: 'var(--ink-1)', fontSize: 12, fontFamily: 'inherit',
              }}
            >
              {URGENCY_ORDER.map(u => (
                <option key={u} value={u}>{URGENCY_CONFIG[u].label}</option>
              ))}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={newKey} onChange={e => setNewKey(e.target.checked)} style={{ accentColor: '#f59e0b' }} />
              Key
            </label>
            <button
              onClick={createTask}
              disabled={!newTitle.trim() || saving}
              style={{
                padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: 'var(--accent)', color: '#fff', fontSize: 12, fontFamily: 'inherit',
              }}
            >
              {saving ? '…' : 'Add'}
            </button>
            <button
              onClick={() => setAddingTask(false)}
              style={{
                padding: '5px 8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: 'var(--border)', color: 'var(--ink-2)', fontSize: 12, fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>
        ) : (
          <>
            {view === 'kanban'   && <KanbanView />}
            {view === 'smart'    && <SmartView />}
            {view === 'category' && <CategoryView />}
          </>
        )}
      </main>

      {/* Edit drawer */}
      {editing && (
        <div
          onClick={() => setEditing(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300,
            display: 'flex', justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 360, height: '100%', background: 'var(--surface)',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
              padding: 24, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-0)' }}>Edit Task</span>
              <button onClick={() => setEditing(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Title</label>
              <input
                type="text"
                value={editing.title}
                onChange={e => setEditing(prev => prev ? { ...prev, title: e.target.value } : prev)}
                style={{
                  width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--ink-0)', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</label>
              <textarea
                value={editing.description ?? ''}
                onChange={e => setEditing(prev => prev ? { ...prev, description: e.target.value } : prev)}
                rows={3}
                style={{
                  width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--ink-0)', fontSize: 13, fontFamily: 'inherit',
                  resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Urgency</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {URGENCY_ORDER.map(u => {
                  const cfg = URGENCY_CONFIG[u]
                  const active = editing.urgency === u
                  return (
                    <button
                      key={u}
                      onClick={() => setEditing(prev => prev ? { ...prev, urgency: u as Task['urgency'] } : prev)}
                      style={{
                        padding: '4px 10px', borderRadius: 20, border: '1px solid',
                        borderColor: active ? cfg.dot : 'var(--border)',
                        background: active ? cfg.dot : 'transparent',
                        color: active ? '#fff' : 'var(--ink-2)',
                        fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editing.key}
                onChange={e => setEditing(prev => prev ? { ...prev, key: e.target.checked } : prev)}
                style={{ accentColor: '#f59e0b', width: 16, height: 16 }}
              />
              <span style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 500 }}>⭐ Mark as Key task</span>
            </label>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Time estimate (min)</label>
              <input
                type="number"
                value={editing.time_estimate_min ?? ''}
                onChange={e => setEditing(prev => prev ? { ...prev, time_estimate_min: e.target.value ? parseInt(e.target.value) : null } : prev)}
                style={{
                  width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--ink-0)', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { deleteTask(editing.id); setEditing(null) }}
                style={{
                  padding: '9px 14px', borderRadius: 8, border: '1px solid var(--danger)',
                  background: 'transparent', color: 'var(--danger)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
