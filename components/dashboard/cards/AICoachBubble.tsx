'use client'

import { useState, useRef, useEffect } from 'react'

interface Message { role: 'user' | 'assistant'; content: string }

interface AICoachBubbleProps {
  habitsDone: number
  habitsTotal: number
}

export default function AICoachBubble({ habitsDone, habitsTotal }: AICoachBubbleProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey Clay! I'm your AI coach. I have live access to your tasks, habits, goals, and nutrition. What do you need?" },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const ratio = habitsTotal > 0 ? habitsDone / habitsTotal : 0
  const mood = ratio >= 0.67 ? 'happy' : ratio >= 0.34 ? 'meh' : 'sad'
  const emoji = mood === 'happy' ? '😊' : mood === 'meh' ? '😐' : '😔'
  const dotColor = mood === 'happy' ? 'var(--ok)' : mood === 'meh' ? 'var(--warn)' : 'var(--danger)'
  const tooltip = mood === 'happy' ? 'Crushing it! Tap to chat' : mood === 'meh' ? 'Keep going — tap to chat' : "Let's get back on track"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    const aiMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, aiMsg])

    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: "Sorry, I couldn't reach the coach API. Try again." }
        return updated
      })
    }

    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>

      {open && (
        <div style={{
          width: 320, background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 18,
          boxShadow: '0 8px 40px rgba(0,0,0,0.16)', display: 'flex',
          flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 14px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>{emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-0)' }}>AI Coach</div>
              <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>Knows your tasks, habits & goals</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 20, height: 20, borderRadius: '50%', background: 'var(--surface-2)',
                border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--ink-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>

          <div style={{
            padding: '12px 14px', display: 'flex', flexDirection: 'column',
            gap: 10, minHeight: 160, maxHeight: 280, overflowY: 'auto',
          }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  maxWidth: '88%', padding: '9px 12px',
                  borderRadius: msg.role === 'assistant' ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
                  background: msg.role === 'assistant' ? 'var(--surface-2)' : 'var(--accent)',
                  color: msg.role === 'assistant' ? 'var(--ink-1)' : 'white',
                  fontSize: 12.5, lineHeight: 1.5,
                  alignSelf: msg.role === 'assistant' ? 'flex-start' : 'flex-end',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content || (loading && i === messages.length - 1
                  ? <span style={{ opacity: 0.5 }}>Thinking…</span>
                  : null
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: 'flex', gap: 7, padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask your coach…"
              disabled={loading}
              style={{
                flex: 1, background: 'var(--surface-2)', border: '1px solid transparent',
                borderRadius: 20, padding: '7px 12px', fontSize: 12,
                color: 'var(--ink-0)', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={send}
              disabled={loading}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: loading ? 'var(--ink-4)' : 'var(--accent)',
                border: 'none', cursor: loading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 14, color: 'white',
              }}
            >↑</button>
          </div>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          title={tooltip}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--surface)', border: '1.5px solid var(--border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.14)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, transition: 'transform 0.2s', userSelect: 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {emoji}
        </button>
        <span style={{
          position: 'absolute', top: 2, right: 2,
          width: 12, height: 12, borderRadius: '50%',
          background: dotColor, border: '2px solid var(--surface)',
        }} />
      </div>
    </div>
  )
}
