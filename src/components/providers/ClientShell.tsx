'use client'

import SessionProvider from '@/components/providers/SessionProvider'
import Navigation from '@/components/Navigation'

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>{children}</main>
      </div>
    </SessionProvider>
  )
}
