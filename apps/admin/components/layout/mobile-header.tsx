'use client'

import { Menu } from 'lucide-react'
import { Button } from '@ephraimcare/ui'

interface MobileHeaderProps {
  onMenuClick: () => void
  initials: string
}

export function MobileHeader({ onMenuClick, initials }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-11 w-11">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>
      <h1 className="font-heading text-base font-bold text-primary">Ephraim Care</h1>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
        {initials}
      </div>
    </header>
  )
}
