'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  HardHat,
  Calendar,
  FileText,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  XCircle,
  Settings,
  Receipt,
  BookOpen,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@ephraimcare/ui'
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
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card p-6 shrink-0">
        <SidebarContent firstName={firstName} lastName={lastName} role={role} />
      </aside>

      {/* Mobile Sheet sidebar */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent className="p-5 flex flex-col" side="left">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <SidebarContent
            firstName={firstName}
            lastName={lastName}
            role={role}
            onNavClick={onMobileClose}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
