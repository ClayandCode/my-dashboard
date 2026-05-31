export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{
      maxWidth: 1380,
      margin: '0 auto',
      padding: '14px 16px 100px',
      display: 'grid',
      gridTemplateColumns: '270px 1fr 250px',
      gap: 'var(--gap)',
    }}>
      {children}
    </main>
  )
}

export function Col({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      {children}
    </div>
  )
}
