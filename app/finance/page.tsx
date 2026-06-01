'use client'

import { useState, useEffect, useRef } from 'react'
import TopRail from '@/components/dashboard/TopRail'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: 'income' | 'expense' | 'investment'
  tags: string[]
  notes: string | null
  created_at: string
}

const CAT_COLORS: Record<string, string> = {
  income: '#22c55e',
  expense: '#ef4444',
  investment: '#a78bfa',
}

const CAT_LABELS: Record<string, string> = {
  income: '+ Income',
  expense: '- Expense',
  investment: '↗ Investment',
}

const inputStyle: React.CSSProperties = {
  flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '7px 10px', fontSize: 13,
  color: 'var(--ink-0)', outline: 'none', fontFamily: 'inherit',
}

const selectStyle: React.CSSProperties = {
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '7px 10px', fontSize: 12,
  color: 'var(--ink-1)', fontFamily: 'inherit', cursor: 'pointer',
}

export default function FinancePage() {
  const [txns, setTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'expense' as Transaction['category'], date: '' })
  const [saving, setSaving] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const descRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/finance')
      .then(r => r.json())
      .then(d => { setTxns(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (adding) setTimeout(() => descRef.current?.focus(), 50)
  }, [adding])

  const income = txns.filter(t => t.category === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = txns.filter(t => t.category === 'expense').reduce((s, t) => s + t.amount, 0)
  const investments = txns.filter(t => t.category === 'investment').reduce((s, t) => s + t.amount, 0)
  const net = income - expenses - investments

  async function addTransaction() {
    const desc = form.description.trim()
    const amt = parseFloat(form.amount)
    if (!desc || isNaN(amt) || amt <= 0) return
    setSaving(true)
    const today = new Intl.DateTimeFormat('en-CA').format(new Date())
    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc, amount: amt, category: form.category, date: form.date || today }),
    })
    const tx = await res.json()
    if (tx.id) {
      setTxns(prev => [tx, ...prev])
      setForm({ description: '', amount: '', category: 'expense', date: '' })
      setAdding(false)
    }
    setSaving(false)
  }

  async function deleteTxn(id: string) {
    setTxns(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/finance/${id}`, { method: 'DELETE' })
  }

  function fmt(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  }

  return (
    <>
      <TopRail />
      <main style={{ maxWidth: 680, margin: '80px auto', padding: '0 16px 80px' }}>

        {/* Month summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Income', value: income, color: CAT_COLORS.income },
            { label: 'Expenses', value: expenses, color: CAT_COLORS.expense },
            { label: 'Invested', value: investments, color: CAT_COLORS.investment },
            { label: 'Net', value: net, color: net >= 0 ? CAT_COLORS.income : CAT_COLORS.expense },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface-1)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '16px 14px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{fmt(s.value)}</div>
            </div>
          ))}
        </div>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>
            This Month
            {!loading && <span style={{ color: 'var(--ink-4)', fontWeight: 400, marginLeft: 8 }}>{txns.length} transactions</span>}
          </div>
          <button
            onClick={() => setAdding(a => !a)}
            style={{
              padding: '6px 14px', background: 'var(--accent)', border: 'none',
              borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >+ Add</button>
        </div>

        {/* Add form */}
        {adding && (
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            borderRadius: 14, padding: 16, marginBottom: 16,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={descRef}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addTransaction(); if (e.key === 'Escape') setAdding(false) }}
                placeholder="Description…"
                style={inputStyle}
              />
              <input
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addTransaction() }}
                placeholder="Amount"
                type="number"
                min="0"
                style={{ ...inputStyle, flex: '0 0 100px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Transaction['category'] }))}
                style={selectStyle}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="investment">Investment</option>
              </select>
              <input
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                type="date"
                style={{ ...selectStyle, colorScheme: 'dark' }}
              />
              <button
                onClick={addTransaction}
                disabled={saving}
                style={{
                  marginLeft: 'auto', padding: '6px 16px', background: 'var(--accent)',
                  border: 'none', borderRadius: 8, color: 'white', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.6 : 1,
                }}
              >{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        )}

        {/* Transactions list */}
        {loading ? (
          <div style={{ color: 'var(--ink-4)', fontSize: 13, textAlign: 'center', padding: 40 }}>Loading…</div>
        ) : txns.length === 0 ? (
          <div style={{ color: 'var(--ink-4)', fontSize: 13, textAlign: 'center', padding: 40 }}>
            No transactions this month. Add one above or say "spent $50 on groceries" in the capture bar.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {txns.map(t => (
              <div
                key={t.id}
                onMouseEnter={() => setHoveredId(t.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--surface-1)', border: '1px solid var(--border)',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: CAT_COLORS[t.category],
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>
                    {t.date} · <span style={{ color: CAT_COLORS[t.category] }}>{CAT_LABELS[t.category]}</span>
                  </div>
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 700, flexShrink: 0,
                  color: t.category === 'income' ? CAT_COLORS.income : 'var(--ink-1)',
                }}>
                  {t.category === 'income' ? '+' : '-'}{fmt(t.amount)}
                </div>
                <button
                  onClick={() => deleteTxn(t.id)}
                  style={{
                    opacity: hoveredId === t.id ? 1 : 0,
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--surface-2)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: 'var(--ink-3)', transition: 'opacity 0.15s',
                  }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
