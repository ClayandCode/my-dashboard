import type { Metadata } from 'next'
import './globals.css'
import { DemoProvider } from '@/components/DemoContext'

export const metadata: Metadata = {
  title: 'Personal OS',
  description: 'Your AI-native personal operating system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <DemoProvider>
          {children}
        </DemoProvider>
      </body>
    </html>
  )
}
