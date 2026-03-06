'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, FileText, User, LogOut, Calendar, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

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
  const isOpen = !!mobileOpen

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose?.()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onMobileClose])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-6">
        <SidebarContent participant={participant} />
      </aside>

      {/* Mobile sidebar — plain div */}
      <div className="md:hidden">
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onMobileClose}
        />
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-card p-5 flex flex-col shadow-xl transition-transform duration-200 ease-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            type="button"
            onClick={onMobileClose}
            className="absolute top-3 right-3 h-10 w-10 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent active:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent participant={participant} onNavClick={onMobileClose} />
        </aside>
      </div>
    </>
  )
}
