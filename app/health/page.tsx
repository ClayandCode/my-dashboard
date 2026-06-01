'use client'

import { useState, useEffect, useCallback } from 'react'
import TopRail from '@/components/dashboard/TopRail'

interface HealthLog {
  id: string
  log_date: string
  weight_lbs: number | null
  sleep_hours: number | null
  hrv: number | null
  energy: number | null
  water_oz: number | null
  notes: string | null
}

const METRICS = [
  { key: 'weight_lbs', label: 'Weight', unit: 'lbs', icon: '⚖️', step: '0.1', color: '#60a5fa' },
  { key: 'sleep_hours', label: 'Sleep', unit: 'hrs', icon: '😴', step: '0.5', color: '#a78bfa' },
  { key: 'hrv', label: 'HRV', unit: 'ms', icon: '💓', step: '1', color: '#f472b6' },
  { key: 'energy', label: 'Energy', unit: '/10', icon: '⚡', step: '1', color: '#facc15' },
  { key: 'water_oz', label: 'Water', unit: 'oz', icon: '💧', step: '1', color: '#34d399' },
] as const

type MetricKey = typeof METRICS[number]['key']

function todayStr() {
  return new Intl.DateTimeFormat('en-CA').format(new Date())
}

export default function HealthPage() {
  const [logs, setLogs] = useState<HealthLog[]>([])
  const [today, setToday] = useState<Partial<HealthLog>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then((d: HealthLog[]) => {
        if (!Array.isArray(d)) return
        setLogs(d)
        const t = d.find(l => l.log_date === todayStr())
        if (t) setToday(t)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const saveToday = useCallback(async (patch: Partial<HealthLog>) => {
    setSaving(true)
    const res = await fetch('/api/health', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...patch, log_date: todayStr() }),
    })
    const updated: HealthLog = await res.json()
    if (updated.id) {
      setLogs(prev => {
        const without = prev.filter(l => l.log_date !== todayStr())
        return [updated, ...without]
      })
      setToday(updated)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  function handleMetricBlur(key: MetricKey, value: string) {
    const num = value === '' ? null : parseFloat(value)
    const patch = { ...today, [key]: num }
    setToday(patch)
    saveToday(patch)
  }

  const pastLogs = logs.filter(l => l.log_date !== todayStr())

  return (
    <>
      <TopRail />
      <main style={{ maxWidth: 680, margin: '80px auto', padding: '0 16px 80px' }}>

        {/* Today's entry */}
        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20, marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>Today</div>
            {saving && <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>Saving…</div>}
            {saved && !saving && <div style={{ fontSize: 11, color: '#22c55e' }}>Saved ✓</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {METRICS.map(m => (
              <div key={m.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 18, textAlign: 'center' }}>{m.icon}</div>
                <input
                  type="number"
                  step={m.step}
                  min="0"
                  defaultValue={today[m.key] ?? ''}
                  key={`${m.key}-${today.id}`}
                  onBlur={e => handleMetricBlur(m.key, e.target.value)}
                  placeholder="—"
                  style={{
                    width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '7px 6px', fontSize: 14, fontWeight: 600,
                    color: m.color, outline: 'none', fontFamily: 'inherit',
                    textAlign: 'center', boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: 10, color: 'var(--ink-4)', textAlign: 'center' }}>
                  {m.label} <span style={{ opacity: 0.6 }}>{m.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7-day trend */}
        {logs.length > 1 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>Last 7 Days</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {METRICS.filter(m => m.key !== 'water_oz').map(m => {
                const vals = logs.slice(0, 7).map(l => l[m.key]).filter(v => v != null) as number[]
                if (vals.length === 0) return null
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length
                const latest = logs[0][m.key]
                const diff = latest != null ? latest - avg : null
                return (
                  <div key={m.key} style={{
                    background: 'var(--surface-1)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ fontSize: 20 }}>{m.icon}</div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 2 }}>{m.label} avg</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{avg.toFixed(1)}<span style={{ fontSize: 10, color: 'var(--ink-4)', marginLeft: 3 }}>{m.unit}</span></div>
                    </div>
                    {diff != null && (
                      <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: diff >= 0 ? '#22c55e' : '#ef4444' }}>
                        {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* History */}
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>History</div>
        {loading ? (
          <div style={{ color: 'var(--ink-4)', fontSize: 13, textAlign: 'center', padding: 40 }}>Loading…</div>
        ) : pastLogs.length === 0 ? (
          <div style={{ color: 'var(--ink-4)', fontSize: 13, textAlign: 'center', padding: 40 }}>
            No past entries yet. Fill in today's metrics above, or say "slept 7.5 hours" in the capture bar.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pastLogs.map(log => (
              <div key={log.id} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '10px 14px',
                background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 10,
              }}>
                <div style={{ fontSize: 12, color: 'var(--ink-4)', flexShrink: 0, width: 76 }}>{log.log_date}</div>
                <div style={{ display: 'flex', gap: 14, flex: 1, flexWrap: 'wrap' }}>
                  {METRICS.map(m => log[m.key] != null && (
                    <div key={m.key} style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--ink-4)' }}>{m.icon} </span>
                      <span style={{ fontWeight: 600, color: m.color }}>{log[m.key]}</span>
                      <span style={{ color: 'var(--ink-4)', fontSize: 10 }}> {m.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
