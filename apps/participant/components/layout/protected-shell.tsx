'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { MobileHeader } from './mobile-header'

interface Participant {
  id: string
  first_name: string
  last_name: string
  ndis_number: string
}

interface ProtectedShellProps {
  participant: Participant
  children: React.ReactNode
}

export function ProtectedShell({ participant, children }: ProtectedShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const initials = `${participant.first_name.charAt(0)}${participant.last_name.charAt(0)}`.toUpperCase()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileHeader
        onMenuClick={() => setSidebarOpen(true)}
        initials={initials}
      />
      <Sidebar
        participant={participant}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
