'use client'

import { useState, useEffect } from 'react'
import Panel, { PanelHeader } from '../Panel'
import { useDemoMode } from '@/components/DemoContext'
import { DEMO_FINANCE } from '@/lib/demoData'

interface Category {
  label: string
  value: number
  pct: number
  color?: string
}

interface Snapshot {
  net_worth: number | null
  change_amount: number | null
  categories: Category[]
  raw_data: { summary?: string } | null
  snapshot_date: string
  updated_at: string
}

const CAT_COLORS = ['var(--accent)', 'var(--ok)', 'var(--warn)', '#8b5cf6', '#ec4899']

export default function FinancePulseCard() {
  const demo = useDemoMode()
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadSnapshot() {
    try {
      const r = await fetch('/api/finance/latest')
      if (r.ok) {
        const data = await r.json()
        setSnapshot(data)
      }
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => {
    if (!demo) loadSnapshot()
    else setLoading(false)
  }, [demo])

  async function runSnapshot() {
    setRefreshing(true)
    setError(null)
    try {
      const r = await fetch('/api/finance/refresh', { method: 'POST' })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setError(d.error ?? d.message ?? 'Refresh failed')
      } else {
        await loadSnapshot()
      }
    } catch (e) {
      setError(String(e))
    }
    setRefreshing(false)
  }

  if (demo) {
    const { netWorth, change, categories } = DEMO_FINANCE
    return (
      <Panel>
        <PanelHeader label="Finance Pulse" />
        <SnapshotDisplay
          netWorth={netWorth}
          change={change}
          categories={categories.map((c, i) => ({ ...c, color: CAT_COLORS[i] ?? 'var(--ink-3)' }))}
        />
      </Panel>
    )
  }

  if (loading) {
    return (
      <Panel>
        <PanelHeader label="Finance Pulse" />
        <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Loading…</div>
      </Panel>
    )
  }

  if (!snapshot) {
    return (
      <Panel>
        <PanelHeader label="Finance Pulse" />
        <div style={{ color: 'var(--ink-3)', fontSize: 12, lineHeight: 1.7, marginBottom: 10 }}>
          No snapshot yet. Click Refresh to pull from your Google Sheet.
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: 11, marginBottom: 8 }}>{error}</div>}
        <button
          onClick={runSnapshot}
          disabled={refreshing}
          style={{
            padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'var(--accent)', color: '#fff', fontSize: 12, fontFamily: 'inherit',
          }}
        >
          {refreshing ? 'Pulling data…' : '↻ Refresh from Sheet'}
        </button>
      </Panel>
    )
  }

  const cats = (snapshot.categories ?? []).map((c, i) => ({
    ...c,
    color: c.color ?? CAT_COLORS[i] ?? 'var(--ink-3)',
  }))

  const fmtDate = new Date(snapshot.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <Panel>
      <PanelHeader
        label="Finance Pulse"
        actionLabel={refreshing ? '…' : '↻'}
        action={runSnapshot}
      />
      <SnapshotDisplay
        netWorth={snapshot.net_worth}
        change={snapshot.change_amount}
        categories={cats}
      />
      {snapshot.raw_data?.summary && (
        <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 8, lineHeight: 1.5 }}>
          {snapshot.raw_data.summary}
        </div>
      )}
      {error && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 6 }}>{error}</div>}
      <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 6 }}>Updated {fmtDate}</div>
    </Panel>
  )
}

function SnapshotDisplay({
  netWorth, change, categories,
}: {
  netWorth: number | null
  change: number | null
  categories: (Category & { color: string })[]
}) {
  return (
    <>
      <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 500, color: 'var(--ink-0)', letterSpacing: '-0.5px', marginBottom: 2 }}>
        {netWorth != null ? `$${netWorth.toLocaleString()}` : '—'}
      </div>
      {change != null && (
        <div style={{ fontSize: 12, fontWeight: 500, color: change >= 0 ? 'var(--ok)' : 'var(--danger)', marginBottom: 12 }}>
          {change >= 0 ? '↑' : '↓'} ${Math.abs(change).toLocaleString()} this month
        </div>
      )}
      {categories.map(cat => (
        <div key={cat.label} style={{ marginBottom: 9 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{cat.label}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ink-1)', fontWeight: 500 }}>
              ${cat.value.toLocaleString()}
            </span>
          </div>
          <div style={{ width: '100%', height: 3, background: 'var(--surface-2)', borderRadius: 2 }}>
            <div style={{ width: `${cat.pct}%`, height: 3, background: cat.color, borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </>
  )
}
