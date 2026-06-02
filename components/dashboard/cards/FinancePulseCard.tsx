'use client'

import Panel, { PanelHeader } from '../Panel'
import { useDemoMode } from '@/components/DemoContext'
import { DEMO_FINANCE } from '@/lib/demoData'

export default function FinancePulseCard() {
  const demo = useDemoMode()

  // Real data pipeline not yet connected — requires Google service account setup.
  // When demo mode is off, the card stays blank until the finance snapshot cron is wired up.
  if (!demo) {
    return (
      <Panel>
        <PanelHeader label="Finance Pulse" />
        <div style={{ color: 'var(--ink-4)', fontSize: 12, lineHeight: 1.6 }}>
          Connect Google Sheets to see your net worth snapshot.<br />
          Set <code style={{ fontSize: 11 }}>GOOGLE_SHEETS_FINANCE_ID</code> in Vercel env vars.
        </div>
      </Panel>
    )
  }

  const { netWorth, change, categories } = DEMO_FINANCE

  return (
    <Panel>
      <PanelHeader label="Finance Pulse" />
      <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 500, color: 'var(--ink-0)', letterSpacing: '-0.5px', marginBottom: 2 }}>
        ${netWorth.toLocaleString()}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: change >= 0 ? 'var(--ok)' : 'var(--danger)', marginBottom: 14 }}>
        {change >= 0 ? '↑' : '↓'} ${Math.abs(change).toLocaleString()} this month
      </div>
      {categories.map(cat => (
        <div key={cat.label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
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
    </Panel>
  )
}
