'use client'

import { useState, useEffect, useCallback } from 'react'
import Panel, { PanelHeader } from '../Panel'
import { useDemoMode } from '@/components/DemoContext'
import { DEMO_NUTRITION } from '@/lib/demoData'

interface Meal {
  id: string
  name: string
  kcal: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  created_at?: string
}

const TARGET_KCAL = 2400

export default function NutritionCard() {
  const demo = useDemoMode()
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  const loadMeals = useCallback(() => {
    fetch('/api/meals')
      .then(r => r.json())
      .then(d => { setMeals(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (demo) {
      setMeals(DEMO_NUTRITION.meals as Meal[])
      setLoading(false)
    } else {
      loadMeals()
    }
  }, [demo, loadMeals])

  async function logMeal() {
    const text = input.trim()
    if (!text || saving) return
    setSaving(true)
    await fetch('/api/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    setInput('')
    setSaving(false)
    loadMeals()
  }

  const totalKcal = meals.reduce((s, m) => s + m.kcal, 0)
  const totalProtein = meals.reduce((s, m) => s + (m.protein_g ?? 0), 0)
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0)
  const totalFat = meals.reduce((s, m) => s + (m.fat_g ?? 0), 0)

  const pct = Math.min(100, Math.round((totalKcal / TARGET_KCAL) * 100))

  return (
    <Panel>
      <PanelHeader label="Nutrition" actionLabel="Reset" action={() => setMeals([])} />

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Calories</div>
        <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 500, color: 'var(--ink-0)', letterSpacing: '-0.3px' }}>
          {totalKcal.toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>of {TARGET_KCAL.toLocaleString()} kcal</div>
        <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? 'var(--warn)' : 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
      </div>

      {(totalProtein > 0 || totalCarbs > 0 || totalFat > 0) && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[
            { label: 'Protein', val: totalProtein },
            { label: 'Carbs',   val: totalCarbs },
            { label: 'Fat',     val: totalFat },
          ].map(m => (
            <div key={m.label} style={{ flex: 1, padding: '9px 6px', borderRadius: 10, background: 'var(--surface-2)', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 3 }}>
                {m.label}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 500, color: 'var(--ink-0)' }}>
                {m.val}<span style={{ fontSize: 9, color: 'var(--ink-3)' }}>g</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && <div style={{ fontSize: 13, color: 'var(--ink-4)', padding: '8px 0' }}>Loading…</div>}

      {!loading && meals.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--ink-4)', padding: '8px 0' }}>No meals logged today</div>
      )}

      {meals.map((meal, i) => {
        const timeStr = meal.created_at
          ? new Date(meal.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : null
        return (
          <div
            key={meal.id}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              padding: '8px 0',
              borderBottom: i < meals.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meal.name}
              </div>
              {timeStr && (
                <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 1 }}>{timeStr}</div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--ink-3)' }}>
                {meal.kcal > 0 ? `${meal.kcal} kcal` : '—'}
              </div>
              {(meal.protein_g || meal.carbs_g || meal.fat_g) && (
                <div style={{ fontSize: 9, color: 'var(--ink-4)', marginTop: 1 }}>
                  {meal.protein_g ? `P:${meal.protein_g}` : ''}{meal.carbs_g ? ` C:${meal.carbs_g}` : ''}{meal.fat_g ? ` F:${meal.fat_g}` : ''}g
                </div>
              )}
            </div>
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && logMeal()}
          placeholder="Log a meal…"
          style={{
            flex: 1, padding: '8px 11px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 9, fontSize: 12, color: 'var(--ink-0)',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          onClick={logMeal}
          disabled={saving}
          style={{
            padding: '8px 13px', background: saving ? 'var(--ink-4)' : 'var(--accent)',
            border: 'none', borderRadius: 9, color: 'white', fontSize: 12, fontWeight: 600,
            cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {saving ? '…' : 'AI ✦'}
        </button>
      </div>
    </Panel>
  )
}
