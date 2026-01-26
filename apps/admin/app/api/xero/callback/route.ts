import { NextResponse } from 'next/server'
import { XeroClient } from 'xero-node'
import { createClient } from '@supabase/supabase-js'

/**
 * Xero OAuth2 callback handler
 * GET /api/xero/callback?code=xxx&state=xxx
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // Handle user cancellation or error
  if (error) {
    console.error('Xero OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=xero_denied`, process.env.NEXT_PUBLIC_ADMIN_URL!)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings/integrations?error=invalid_callback', process.env.NEXT_PUBLIC_ADMIN_URL!)
    )
  }

  try {
    // Decode state to get organization ID
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
    const { organizationId, timestamp } = stateData

    // Validate timestamp (15 min expiry)
    if (Date.now() - timestamp > 15 * 60 * 1000) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=expired', process.env.NEXT_PUBLIC_ADMIN_URL!)
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
        'offline_access',
      ],
    })

    // Exchange code for tokens
    const tokenSet = await xero.apiCallback(url.toString())

    // Get connected Xero tenant (organization)
    await xero.updateTenants()
    const tenants = xero.tenants
    const activeTenant = tenants[0] // Use first tenant (most common case)

    if (!activeTenant) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=no_xero_org', process.env.NEXT_PUBLIC_ADMIN_URL!)
      )
    }

    // Store tokens in organization using service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get existing settings to merge
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single()

    const currentSettings = org?.settings as Record<string, any> || {}

    await supabase
      .from('organizations')
      .update({
        xero_token_set: tokenSet,
        xero_tenant_id: activeTenant.tenantId,
        settings: {
          ...currentSettings,
          xero_connected: true,
          xero_org_name: activeTenant.tenantName,
        },
      } as any)
      .eq('id', organizationId)

    return NextResponse.redirect(
      new URL('/settings/integrations?success=xero_connected', process.env.NEXT_PUBLIC_ADMIN_URL!)
    )
  } catch (error) {
    console.error('Xero callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=xero_callback_failed', process.env.NEXT_PUBLIC_ADMIN_URL!)
    )
  }
}
