'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, FileText, User, LogOut, Calendar } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@ephraimcare/ui'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  first_name: string
  last_name: string
  ndis_number: string
}

interface SidebarProps {
  participant: Participant
  mobileOpen?: boolean
  onMobileClose?: () => void
}

// ─── Navigation Items ─────────────────────────────────────────────────────────

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/appointments', label: 'Appointments', icon: Calendar },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/profile', label: 'Profile', icon: User },
]

// ─── Sidebar Content ──────────────────────────────────────────────────────────

function SidebarContent({ participant, onNavClick }: {
  participant: Participant
  onNavClick?: () => void
}) {
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      queryClient.clear()
      window.location.href = '/login'
    }
  }

  return (
    <>
      {/* Logo and portal name */}
      <div className="mb-6">
        <h2 className="font-heading text-lg font-bold text-primary">Ephraim Care</h2>
        <p className="text-xs text-muted-foreground">Participant Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 rounded-md px-3 py-3 md:py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info and logout */}
      <div className="mt-auto border-t border-border pt-4">
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
    </>
  )
}

// ─── Sidebar Component ────────────────────────────────────────────────────────

export function Sidebar({ participant, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-6">
        <SidebarContent participant={participant} />
      </aside>

      {/* Mobile Sheet sidebar */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent className="p-5 flex flex-col" side="left">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SidebarContent participant={participant} onNavClick={onMobileClose} />
        </SheetContent>
      </Sheet>
    </>
  )
}
