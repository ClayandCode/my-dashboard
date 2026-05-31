import Panel, { PanelHeader } from '../Panel'

const categories = [
  { label: 'Investments', value: '$84,200', pct: 67, color: 'var(--accent)' },
  { label: 'Cash',        value: '$22,400', pct: 18, color: 'var(--ok)' },
  { label: 'Crypto',      value: '$18,250', pct: 15, color: 'var(--warn)' },
]

export default function FinancePulseCard() {
  return (
    <Panel>
      <PanelHeader label="Finance Pulse" actionLabel="↻ Refresh" action={() => {}} />
      <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 500, color: 'var(--ink-0)', letterSpacing: '-0.5px', marginBottom: 2 }}>
        $124,850
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ok)', marginBottom: 14 }}>
        ↑ $3,210 this month
      </div>
      {categories.map(cat => (
        <div key={cat.label} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{cat.label}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ink-1)', fontWeight: 500 }}>{cat.value}</span>
          </div>
          <div style={{ width: '100%', height: 3, background: 'var(--surface-2)', borderRadius: 2 }}>
            <div style={{ width: `${cat.pct}%`, height: 3, background: cat.color, borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </Panel>
  )
}
