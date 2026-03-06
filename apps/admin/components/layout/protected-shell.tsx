'use client'

import { useState } from 'react'
import { AdminSidebar } from './admin-sidebar'
import { MobileHeader } from './mobile-header'

interface ProtectedShellProps {
  firstName: string
  lastName: string
  role: string
  children: React.ReactNode
}

export function ProtectedShell({ firstName, lastName, role, children }: ProtectedShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <MobileHeader
        onMenuClick={() => setSidebarOpen(true)}
        initials={initials}
      />
      <AdminSidebar
        firstName={firstName}
        lastName={lastName}
        role={role}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
