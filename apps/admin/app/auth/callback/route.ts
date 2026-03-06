import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()

  // Exchange code for session
  const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)

  if (authError || !user) {
    console.error('Auth callback error:', authError)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Verify user has admin/coordinator/worker role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (!profile || !['admin', 'coordinator', 'worker'].includes(profile.role)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=insufficient_role`)
  }

  // Password recovery flow — redirect to change-password page
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/reset-password?mode=update`)
  }

  // Default: redirect to dashboard
  return NextResponse.redirect(`${origin}/`)
}
