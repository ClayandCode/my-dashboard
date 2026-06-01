'use client'

import { useState, useEffect, useCallback } from 'react'
import TopRail from '@/components/dashboard/TopRail'

interface Contact {
  id: string
  name: string
  relationship: 'friend' | 'family' | 'business' | 'other'
  last_contact_date: string | null
  followup_date: string | null
  notes: string | null
  tags: string[]
  updated_at: string
}

const REL_COLORS: Record<string, string> = {
  friend: '#60a5fa',
  family: '#f472b6',
  business: '#34d399',
  other: 'var(--ink-4)',
}

const REL_LABELS: Record<string, string> = {
  friend: 'Friend',
  family: 'Family',
  business: 'Business',
  other: 'Other',
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86400000)
}

function urgencyColor(days: number | null, followup: string | null): string {
  if (followup && new Date(followup) <= new Date()) return '#ef4444'
  if (days === null) return 'var(--ink-4)'
  if (days <= 7) return '#22c55e'
  if (days <= 21) return '#facc15'
  return '#ef4444'
}

function todayStr() {
  return new Intl.DateTimeFormat('en-CA').format(new Date())
}

export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRel, setNewRel] = useState<Contact['relationship']>('friend')
  const [notesDraft, setNotesDraft] = useState('')
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/crm')
      .then(r => r.json())
      .then(d => { setContacts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const activeContact = contacts.find(c => c.id === activeId) ?? null

  function openContact(c: Contact) {
    setActiveId(c.id)
    setNotesDraft(c.notes ?? '')
  }

  const patch = useCallback(async (id: string, update: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...update } : c))
    await fetch(`/api/crm/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
  }, [])

  function handleNotesChange(notes: string) {
    setNotesDraft(notes)
    if (!activeId) return
    if (saveTimer) clearTimeout(saveTimer)
    setSaveTimer(setTimeout(() => patch(activeId, { notes }), 1200))
  }

  async function logContact(id: string) {
    await patch(id, { last_contact_date: todayStr() })
  }

  async function addContact() {
    const name = newName.trim()
    if (!name) return
    const res = await fetch('/api/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, relationship: newRel }),
    })
    const c = await res.json()
    if (c.id) {
      setContacts(prev => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))
      openContact(c)
      setNewName('')
      setAdding(false)
    }
  }

  async function deleteContact(id: string) {
    setContacts(prev => prev.filter(c => c.id !== id))
    if (activeId === id) setActiveId(null)
    await fetch(`/api/crm/${id}`, { method: 'DELETE' })
  }

  const filtered = contacts
    .filter(c => filter === 'all' || c.relationship === filter)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const da = daysSince(a.last_contact_date) ?? 9999
      const db = daysSince(b.last_contact_date) ?? 9999
      return db - da
    })

  const overdue = contacts.filter(c => {
    const days = daysSince(c.last_contact_date)
    const fu = c.followup_date && new Date(c.followup_date) <= new Date()
    return fu || (days !== null && days > 21)
  }).length

  return (
    <>
      <TopRail />
      <main style={{ maxWidth: 900, margin: '80px auto', padding: '0 16px 80px', display: 'flex', gap: 20 }}>

        {/* Sidebar */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Total</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink-0)' }}>{contacts.length}</div>
            </div>
            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Overdue</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: overdue > 0 ? '#ef4444' : '#22c55e' }}>{overdue}</div>
            </div>
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts…"
            style={{
              background: 'var(--surface-1)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '8px 12px', fontSize: 12,
              color: 'var(--ink-0)', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
            }}
          />

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'friend', 'family', 'business'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 600,
                  background: filter === f ? 'var(--accent)' : 'var(--surface-1)',
                  border: '1px solid var(--border)', borderRadius: 7,
                  color: filter === f ? 'white' : 'var(--ink-3)',
                  cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                }}
              >{f}</button>
            ))}
          </div>

          {/* Add contact */}
          {adding ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addContact(); if (e.key === 'Escape') setAdding(false) }}
                placeholder="Name…"
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <select value={newRel} onChange={e => setNewRel(e.target.value as Contact['relationship'])} style={{ ...inputStyle, flex: 1 }}>
                  <option value="friend">Friend</option>
                  <option value="family">Family</option>
                  <option value="business">Business</option>
                  <option value="other">Other</option>
                </select>
                <button onClick={addContact} style={btnStyle}>Add</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{ ...btnStyle, width: '100%', padding: '7px 0', borderRadius: 10 }}>+ Add Contact</button>
          )}

          {/* Contact list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ color: 'var(--ink-4)', fontSize: 12, padding: 12 }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ color: 'var(--ink-4)', fontSize: 12, padding: 12 }}>No contacts yet.</div>
            ) : filtered.map(c => {
              const days = daysSince(c.last_contact_date)
              const color = urgencyColor(days, c.followup_date)
              return (
                <div
                  key={c.id}
                  onClick={() => openContact(c)}
                  style={{
                    padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                    background: activeId === c.id ? 'var(--accent)' : 'var(--surface-1)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: REL_COLORS[c.relationship] + '33',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: REL_COLORS[c.relationship],
                  }}>
                    {c.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: activeId === c.id ? 'white' : 'var(--ink-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: activeId === c.id ? 'rgba(255,255,255,0.7)' : 'var(--ink-4)', marginTop: 1 }}>
                      {REL_LABELS[c.relationship]}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: activeId === c.id ? 'white' : color, flexShrink: 0 }}>
                    {days === null ? 'never' : days === 0 ? 'today' : `${days}d`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ flex: 1 }}>
          {activeContact ? (
            <div style={{
              background: 'var(--surface-1)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: REL_COLORS[activeContact.relationship] + '33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700, color: REL_COLORS[activeContact.relationship], flexShrink: 0,
                }}>
                  {activeContact.name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink-0)' }}>{activeContact.name}</div>
                  <div style={{ fontSize: 12, color: REL_COLORS[activeContact.relationship], fontWeight: 600, marginTop: 2 }}>{REL_LABELS[activeContact.relationship]}</div>
                </div>
                <button onClick={() => deleteContact(activeContact.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: 13, padding: '4px 8px', borderRadius: 6, fontFamily: 'inherit' }}>Delete</button>
              </div>

              {/* Relationship selector */}
              <div style={{ display: 'flex', gap: 6 }}>
                {(['friend', 'family', 'business', 'other'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => patch(activeContact.id, { relationship: r })}
                    style={{
                      padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                      background: activeContact.relationship === r ? REL_COLORS[r] : 'var(--surface-2)',
                      border: `1px solid ${activeContact.relationship === r ? REL_COLORS[r] : 'var(--border)'}`,
                      color: activeContact.relationship === r ? 'white' : 'var(--ink-3)',
                    }}
                  >{REL_LABELS[r]}</button>
                ))}
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Last Contact</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="date"
                      value={activeContact.last_contact_date ?? ''}
                      onChange={e => patch(activeContact.id, { last_contact_date: e.target.value || null })}
                      style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }}
                    />
                    <button
                      onClick={() => logContact(activeContact.id)}
                      style={{ ...btnStyle, padding: '6px 10px', fontSize: 11, whiteSpace: 'nowrap' }}
                    >Today</button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Follow-up Date</label>
                  <input
                    type="date"
                    value={activeContact.followup_date ?? ''}
                    onChange={e => patch(activeContact.id, { followup_date: e.target.value || null })}
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {/* Status badge */}
              {(() => {
                const days = daysSince(activeContact.last_contact_date)
                const color = urgencyColor(days, activeContact.followup_date)
                const fuOverdue = activeContact.followup_date && new Date(activeContact.followup_date) <= new Date()
                const msg = fuOverdue
                  ? `Follow-up overdue (${activeContact.followup_date})`
                  : days === null ? 'Never contacted'
                  : days === 0 ? 'Contacted today'
                  : `Last contact ${days} days ago`
                return (
                  <div style={{ fontSize: 12, fontWeight: 600, color, padding: '8px 12px', background: color + '18', borderRadius: 8 }}>
                    {msg}
                  </div>
                )
              })()}

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={notesDraft}
                  onChange={e => handleNotesChange(e.target.value)}
                  placeholder="Add notes about this person…"
                  style={{
                    width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.6,
                    color: 'var(--ink-1)', outline: 'none', fontFamily: 'inherit',
                    resize: 'vertical', minHeight: 120, boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{
              height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 16,
              color: 'var(--ink-4)', fontSize: 13,
            }}>
              Select a contact to view details
            </div>
          )}
        </div>
      </main>
    </>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '7px 10px', fontSize: 12,
  color: 'var(--ink-0)', outline: 'none', fontFamily: 'inherit',
}

const btnStyle: React.CSSProperties = {
  background: 'var(--accent)', border: 'none', borderRadius: 8,
  color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  padding: '6px 14px',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 6,
}
