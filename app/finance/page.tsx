import TopRail from '@/components/dashboard/TopRail'

export default function Page() {
  return (
    <>
      <TopRail />
      <main style={{ maxWidth: 700, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🚧</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink-0)', marginBottom: 8 }}>Finance — coming soon</div>
        <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>Net worth, spending, and savings tracking will live here.</div>
      </main>
    </>
  )
}
