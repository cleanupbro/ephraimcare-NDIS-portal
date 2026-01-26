import { NextResponse } from 'next/server'
import { XeroClient } from 'xero-node'
import { createClient } from '@/lib/supabase/server'

/**
 * Start Xero OAuth2 flow
 * GET /api/xero/connect
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_ADMIN_URL))
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id || profile.role !== 'admin') {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=admin_required', process.env.NEXT_PUBLIC_ADMIN_URL)
      )
    }

    // Initialize Xero client
    const xero = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID!,
      clientSecret: process.env.XERO_CLIENT_SECRET!,
      redirectUris: [`${process.env.NEXT_PUBLIC_ADMIN_URL}/api/xero/callback`],
      scopes: [
        'openid',
        'profile',
        'email',
        'accounting.transactions',
        'accounting.contacts',
        'offline_access', // Required for refresh tokens
      ],
    })

    // Store org ID in state for callback
    const state = Buffer.from(JSON.stringify({
      organizationId: profile.organization_id,
      timestamp: Date.now(),
    })).toString('base64url')

    // Generate consent URL
    const consentUrl = await xero.buildConsentUrl()

    // Append state to URL
    const url = new URL(consentUrl)
    url.searchParams.set('state', state)

    return NextResponse.redirect(url.toString())
  } catch (error) {
    console.error('Xero connect error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=xero_connect_failed', process.env.NEXT_PUBLIC_ADMIN_URL)
    )
  }
}
