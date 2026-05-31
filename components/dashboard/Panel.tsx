import type { CSSProperties, ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

export default function Panel({ children, style, className }: PanelProps) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function PanelHeader({
  label,
  action,
  actionLabel,
}: {
  label: string
  action?: () => void
  actionLabel?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
        {label}
      </span>
      {action && actionLabel && (
        <button
          onClick={action}
          style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
