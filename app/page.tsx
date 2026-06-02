'use client'

import { useState, useRef, useCallback } from 'react'
import TopRail from '@/components/dashboard/TopRail'
import { Col } from '@/components/dashboard/Shell'
import OperatorCard from '@/components/dashboard/cards/OperatorCard'
import FinancePulseCard from '@/components/dashboard/cards/FinancePulseCard'
import KeyBlockersCard from '@/components/dashboard/cards/KeyBlockersCard'
import SessionCard from '@/components/dashboard/cards/SessionCard'
import HabitTrackerCard from '@/components/dashboard/cards/HabitTrackerCard'
import PrioritiesCard from '@/components/dashboard/cards/PrioritiesCard'
import NutritionCard from '@/components/dashboard/cards/NutritionCard'
import AICoachBubble from '@/components/dashboard/cards/AICoachBubble'
import CalendarCard from '@/components/dashboard/cards/CalendarCard'

const HABITS_TOTAL = 6

type CaptureStatus = 'idle' | 'loading' | 'ok' | 'error'

const TYPE_LABEL: Record<string, string> = {
  task: '✅ Task saved',
  note: '📝 Note saved',
  meal: '🍽️ Meal logged',
  journal: '📓 Journal entry saved',
  blocker: '🚧 Blocker noted',
  finance: '💰 Finance note saved',
}

export default function DashboardPage() {
  const [habitsDone] = useState(4)
  const [captureText, setCaptureText] = useState('')
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('idle')
  const [captureLabel, setCaptureLabel] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function submit() {
    const text = captureText.trim()
    if (!text || captureStatus === 'loading') return
    setCaptureStatus('loading')
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCaptureLabel(TYPE_LABEL[data.classification?.type] ?? '✓ Saved')
      setCaptureStatus('ok')
      setCaptureText('')
    } catch {
      setCaptureLabel('⚠️ Failed to save')
      setCaptureStatus('error')
    }
    setTimeout(() => { setCaptureStatus('idle'); setCaptureLabel('') }, 3000)
  }

  const barColor = captureStatus === 'ok'
    ? 'var(--ok)'
    : captureStatus === 'error'
    ? 'var(--danger)'
    : 'var(--border)'

  return (
    <>
      <TopRail />

      <main style={{
        maxWidth: 1380,
        margin: '0 auto',
        padding: '14px 16px 100px',
        display: 'grid',
        gridTemplateColumns: '270px 1fr 250px',
        gap: 'var(--gap)',
      }}>
        <Col>
          <OperatorCard />
          <FinancePulseCard />
          <KeyBlockersCard />
        </Col>

        <Col>
          <SessionCard />
          <HabitTrackerCard />
          <PrioritiesCard />
        </Col>

        <Col>
          <CalendarCard />
          <NutritionCard />
        </Col>
      </main>

      {/* Floating capture bar */}
      <div style={{
        position: 'fixed', bottom: 20, left: '50%',
        transform: 'translateX(-50%)', width: 540, zIndex: 200,
      }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--surface)', border: `1px solid ${barColor}`,
          borderRadius: 14, padding: '10px 14px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
          transition: 'border-color 0.2s',
        }}>
          <span style={{ fontSize: 15, color: captureStatus === 'loading' ? 'var(--accent)' : 'var(--ink-4)' }}>
            {captureStatus === 'loading' ? '⏳' : '⌘'}
          </span>
          {captureStatus === 'ok' || captureStatus === 'error' ? (
            <span style={{ flex: 1, fontSize: 13, color: captureStatus === 'ok' ? 'var(--ok)' : 'var(--danger)', fontWeight: 500 }}>
              {captureLabel}
            </span>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={captureText}
              onChange={e => setCaptureText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Capture anything — task, idea, note, meal..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 13, color: 'var(--ink-0)', fontFamily: 'inherit',
              }}
            />
          )}
          <span style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}>⏎ to send</span>
        </div>
      </div>

      <AICoachBubble habitsDone={habitsDone} habitsTotal={HABITS_TOTAL} />
    </>
  )
}
