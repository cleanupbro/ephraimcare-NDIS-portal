'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

export function ChangePasswordButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'error' })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'error' })
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) {
      toast({ title: 'Failed to update password', description: error.message, variant: 'error' })
      return
    }

    toast({ title: 'Password updated successfully', variant: 'success' })
    setIsOpen(false)
    setNewPassword('')
    setConfirmPassword('')
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
      >
        Change Password
      </button>
    )
  }

  return (
    <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
      <div className="space-y-1">
        <label htmlFor="new-password" className="text-sm font-medium">
          New Password
        </label>
        <input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Min 8 characters"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="confirm-password" className="text-sm font-medium">
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
        <button
          type="button"
          onClick={() => { setIsOpen(false); setNewPassword(''); setConfirmPassword(''); }}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
