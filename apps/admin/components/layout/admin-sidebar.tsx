'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  HardHat,
  Calendar,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  XCircle,
  Settings,
  Receipt,
  BookOpen,
} from 'lucide-react'
import { AdminLogoutButton } from '@/components/auth/admin-logout-button'

interface AdminSidebarProps {
  firstName: string
  lastName: string
  role: string
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/participants', label: 'Participants', icon: Users },
  { href: '/workers', label: 'Workers', icon: HardHat },
  { href: '/shifts', label: 'Shifts', icon: Calendar },
  { href: '/plans', label: 'NDIS Plans', icon: BookOpen },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/case-notes', label: 'Case Notes', icon: ClipboardList },
  { href: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/cancellation-requests', label: 'Cancellations', icon: XCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function SidebarContent({ firstName, lastName, role, onNavClick }: {
  firstName: string
  lastName: string
  role: string
  onNavClick?: () => void
}) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="font-heading text-lg font-bold text-primary">Ephraim Care</h2>
        <p className="text-xs text-muted-foreground">Admin Portal</p>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={`flex items-center gap-3 rounded-md px-3 py-3 md:py-2 text-sm transition-colors ${
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {firstName} {lastName}
        </p>
        <p className="text-xs font-medium capitalize text-secondary">
          {role}
        </p>
        <AdminLogoutButton />
      </div>
    </>
  )
}

export function AdminSidebar({ firstName, lastName, role, mobileOpen, onMobileClose }: AdminSidebarProps) {
  const isOpen = !!mobileOpen

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  // Close on Escape
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
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-6 shrink-0">
        <SidebarContent firstName={firstName} lastName={lastName} role={role} />
      </aside>

      {/* Mobile sidebar — plain div, no library */}
      <div className="md:hidden">
        {/* Overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onMobileClose}
        />

        {/* Sidebar panel */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-card p-5 flex flex-col shadow-xl transition-transform duration-200 ease-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onMobileClose}
            className="absolute top-3 right-3 h-10 w-10 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent active:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>

          <SidebarContent
            firstName={firstName}
            lastName={lastName}
            role={role}
            onNavClick={onMobileClose}
          />
        </aside>
      </div>
    </>
  )
}
