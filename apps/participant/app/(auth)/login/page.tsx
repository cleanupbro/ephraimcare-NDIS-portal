'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock } from 'lucide-react'

type AuthMode = 'password' | 'magic-link'

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please try again.'
          : error.message
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess('Check your email for a login link. The link will expire in 1 hour.')
  }

  return (
    <>
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold text-primary">
          Ephraim Care
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Participant Portal — Sign in to continue
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-md bg-muted p-1">
        <button
          type="button"
          onClick={() => { setMode('password'); setError(null); setSuccess(null); }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'password'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lock className="h-4 w-4" />
          Password
        </button>
        <button
          type="button"
          onClick={() => { setMode('magic-link'); setError(null); setSuccess(null); }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mode === 'magic-link'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mail className="h-4 w-4" />
          Magic Link
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Password Form */}
      {mode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
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
              placeholder="participant@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      )}

      {/* Magic Link Form */}
      {mode === 'magic-link' && (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="magic-email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="magic-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="participant@example.com"
            />
            <p className="text-xs text-muted-foreground">
              We'll email you a secure login link. No password needed.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Sending link...' : 'Send Magic Link'}
          </button>
        </form>
      )}
    </>
  )
}
