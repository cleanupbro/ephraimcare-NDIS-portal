'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <h1 className="font-heading text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We've sent a password reset link to <strong>{email}</strong>.
        </p>
        <a href="/login" className="text-sm text-secondary hover:underline">
          Back to login
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold">Reset Password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email to receive a reset link
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>

        <div className="text-center">
          <a href="/login" className="text-sm text-secondary hover:underline">
            Back to login
          </a>
        </div>
      </form>
    </>
  )
}
