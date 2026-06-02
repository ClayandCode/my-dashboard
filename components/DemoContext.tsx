'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface DemoCtx { demo: boolean; toggle: () => void }

const DemoContext = createContext<DemoCtx>({ demo: false, toggle: () => {} })

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    setDemo(localStorage.getItem('demo_mode') === 'true')
  }, [])

  function toggle() {
    const next = !demo
    setDemo(next)
    localStorage.setItem('demo_mode', String(next))
  }

  return <DemoContext.Provider value={{ demo, toggle }}>{children}</DemoContext.Provider>
}

export function useDemoMode(): boolean {
  return useContext(DemoContext).demo
}

export { DemoContext }
