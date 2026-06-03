import Panel, { PanelHeader } from '../Panel'

export default function OperatorCard() {
  return (
    <Panel>
      <PanelHeader label="Operator" actionLabel="Edit" action={() => {}} />
      <div style={{ fontSize: 19, fontWeight: 600, color: 'var(--ink-0)', letterSpacing: '-0.4px', marginBottom: 3 }}>
        Clay Dittman
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ok)', flexShrink: 0, display: 'inline-block' }} />
        Castle Rock, CO · Available
      </div>
      <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
          Current Focus
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-1)', lineHeight: 1.5 }}>
          Optimizing the Personal OS — habits, finance, and daily systems.
        </div>
      </div>
    </Panel>
  )
}
