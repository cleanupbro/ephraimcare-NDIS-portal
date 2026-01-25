'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, FileText, User, LogOut } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  first_name: string
  last_name: string
  ndis_number: string
}

interface SidebarProps {
  participant: Participant
}

// ─── Navigation Items ─────────────────────────────────────────────────────────

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/profile', label: 'Profile', icon: User },
]

// ─── Sidebar Component ────────────────────────────────────────────────────────

/**
 * Sidebar component for participant portal.
 * - Shows navigation with active link highlighting
 * - Displays user info at bottom
 * - Logout button calls signOut and redirects to /login
 */
export function Sidebar({ participant }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      {/* Logo and portal name */}
      <div className="p-6">
        <h2 className="font-heading text-lg font-bold text-primary">Ephraim Care</h2>
        <p className="text-xs text-muted-foreground">Participant Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* User info and logout */}
      <div className="border-t border-border p-4">
        <div className="mb-3">
          <p className="text-sm font-medium">{participant.first_name} {participant.last_name}</p>
          <p className="text-xs text-muted-foreground font-mono">NDIS: {participant.ndis_number}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
