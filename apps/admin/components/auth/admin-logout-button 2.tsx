'use client'

import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

export function AdminLogoutButton() {
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
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors mt-2"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  )
}
