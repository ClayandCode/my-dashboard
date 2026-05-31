import Panel, { PanelHeader } from '../Panel'

const blockers = [
  { title: 'Waiting on client contract signature', sub: 'Blocks project kickoff · 3 days', severity: 'danger' },
  { title: 'Supabase migration needs review', sub: 'Required before auth gate · Today', severity: 'warn' },
  { title: 'Gym membership renewal overdue', sub: 'Personal · 1 week', severity: 'warn' },
]

export default function KeyBlockersCard() {
  return (
    <Panel>
      <PanelHeader label="Key Blockers" actionLabel="+ Add" action={() => {}} />
      {blockers.map((b, i) => (
        <div
          key={i}
          style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            padding: '10px 0',
            borderBottom: i < blockers.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: b.severity === 'danger' ? 'var(--danger)' : 'var(--warn)',
            flexShrink: 0, marginTop: 4,
          }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-1)', lineHeight: 1.4 }}>{b.title}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{b.sub}</div>
          </div>
        </div>
      ))}
    </Panel>
  )
}
