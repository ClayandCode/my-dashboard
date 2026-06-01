'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import TopRail from '@/components/dashboard/TopRail'

interface Note {
  id: string
  title: string
  content: string | null
  tags: string[]
  pinned: boolean
  created_at: string
  updated_at: string
}

const SAVE_DELAY = 1200

export default function BrainPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ title: string; content: string } | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/notes')
      .then(r => r.json())
      .then(d => { setNotes(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const activeNote = notes.find(n => n.id === activeId) ?? null

  function openNote(note: Note) {
    setActiveId(note.id)
    setDraft({ title: note.title, content: note.content ?? '' })
    setSaveStatus('idle')
  }

  const persistSave = useCallback(async (id: string, patch: { title: string; content: string }) => {
    setSaveStatus('saving')
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const updated = await res.json()
    if (updated.id) {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updated } : n))
    }
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }, [])

  function handleDraftChange(patch: Partial<{ title: string; content: string }>) {
    if (!activeId || !draft) return
    const next = { ...draft, ...patch }
    setDraft(next)
    setSaveStatus('idle')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => persistSave(activeId, next), SAVE_DELAY)
  }

  async function createNote() {
    const title = newTitle.trim()
    if (!title) return
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content: '' }),
    })
    const note = await res.json()
    if (note.id) {
      setNotes(prev => [note, ...prev])
      openNote(note)
      setNewTitle('')
      setCreating(false)
    }
  }

  async function togglePin(id: string, pinned: boolean) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned } : n))
    await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned }),
    })
  }

  async function deleteNote(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id))
    if (activeId === id) { setActiveId(null); setDraft(null) }
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
  }

  function handleSearch(q: string) {
    setSearch(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) {
      setSearching(false)
      fetch('/api/notes').then(r => r.json()).then(d => setNotes(Array.isArray(d) ? d : []))
      return
    }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/notes?q=${encodeURIComponent(q)}`)
      const d = await res.json()
      setNotes(Array.isArray(d) ? d : [])
      setSearching(false)
    }, 500)
  }

  const pinned = notes.filter(n => n.pinned)
  const unpinned = notes.filter(n => !n.pinned)

  return (
    <>
      <TopRail />
      <main style={{ maxWidth: 900, margin: '80px auto', padding: '0 16px 80px', display: 'flex', gap: 20, minHeight: 'calc(100vh - 80px)' }}>

        {/* Sidebar */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search your brain…"
              style={{
                width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '8px 12px', fontSize: 12,
                color: 'var(--ink-0)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            {searching && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--ink-4)' }}>…</div>}
          </div>

          {/* New note */}
          {creating ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createNote(); if (e.key === 'Escape') setCreating(false) }}
                placeholder="Note title…"
                style={{
                  flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 10px', fontSize: 12,
                  color: 'var(--ink-0)', outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button onClick={createNote} style={btnStyle}>+</button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              style={{ ...btnStyle, width: '100%', padding: '7px 0', borderRadius: 10 }}
            >+ New Note</button>
          )}

          {/* Note list */}
          {loading ? (
            <div style={{ color: 'var(--ink-4)', fontSize: 12, padding: '12px 0' }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1 }}>
              {pinned.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-4)', padding: '4px 4px 2px' }}>Pinned</div>
                  {pinned.map(n => <NoteRow key={n.id} note={n} active={n.id === activeId} onClick={() => openNote(n)} onPin={togglePin} onDelete={deleteNote} />)}
                  {unpinned.length > 0 && <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-4)', padding: '8px 4px 2px' }}>Notes</div>}
                </>
              )}
              {unpinned.map(n => <NoteRow key={n.id} note={n} active={n.id === activeId} onClick={() => openNote(n)} onPin={togglePin} onDelete={deleteNote} />)}
              {notes.length === 0 && !loading && (
                <div style={{ color: 'var(--ink-4)', fontSize: 12, padding: '16px 4px' }}>
                  {search ? 'No matches found.' : 'No notes yet. Create one or say "note: [idea]" in the capture bar.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {activeNote && draft ? (
            <div style={{
              background: 'var(--surface-1)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12, flex: 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <input
                  value={draft.title}
                  onChange={e => handleDraftChange({ title: e.target.value })}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 20, fontWeight: 700, color: 'var(--ink-0)', fontFamily: 'inherit',
                  }}
                />
                <div style={{ fontSize: 11, color: 'var(--ink-4)', marginLeft: 12 }}>
                  {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : ''}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                {new Date(activeNote.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {activeNote.tags.length > 0 && (
                  <span style={{ marginLeft: 10 }}>
                    {activeNote.tags.map(t => (
                      <span key={t} style={{ background: 'var(--surface-2)', borderRadius: 4, padding: '1px 6px', marginLeft: 4, fontSize: 10 }}>{t}</span>
                    ))}
                  </span>
                )}
              </div>
              <textarea
                value={draft.content}
                onChange={e => handleDraftChange({ content: e.target.value })}
                placeholder="Start writing…"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                  fontSize: 14, lineHeight: 1.7, color: 'var(--ink-1)', fontFamily: 'inherit',
                  minHeight: 400,
                }}
              />
            </div>
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-4)', fontSize: 13,
              background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 16,
            }}>
              Select a note or create a new one
            </div>
          )}
        </div>
      </main>
    </>
  )
}

function NoteRow({ note, active, onClick, onPin, onDelete }: {
  note: Note
  active: boolean
  onClick: () => void
  onPin: (id: string, pinned: boolean) => void
  onDelete: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
        background: active ? 'var(--accent)' : hovered ? 'var(--surface-2)' : 'transparent',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: active ? 'white' : 'var(--ink-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {note.title}
        </div>
        {note.content && (
          <div style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.7)' : 'var(--ink-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
            {note.content}
          </div>
        )}
      </div>
      {hovered && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onPin(note.id, !note.pinned)}
            title={note.pinned ? 'Unpin' : 'Pin'}
            style={{ ...iconBtn, color: note.pinned ? '#facc15' : 'var(--ink-4)' }}
          >{note.pinned ? '★' : '☆'}</button>
          <button
            onClick={() => onDelete(note.id)}
            style={{ ...iconBtn, color: '#ef4444' }}
          >✕</button>
        </div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'var(--accent)', border: 'none', borderRadius: 8,
  color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  padding: '6px 12px',
}

const iconBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
  padding: '2px 4px', borderRadius: 4, fontFamily: 'inherit',
}
