import { XeroClient, TokenSet } from 'xero-node'
import { createClient } from '@supabase/supabase-js'

/**
 * Get authenticated Xero client for an organization
 * Handles token refresh automatically
 */
export async function getXeroClient(organizationId: string): Promise<{
  client: XeroClient | null
  tenantId: string | null
  error?: string
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch org's Xero credentials
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('xero_token_set, xero_tenant_id, settings')
    .eq('id', organizationId)
    .single()

  if (orgError || !org) {
    return { client: null, tenantId: null, error: 'Organization not found' }
  }

  const settings = org.settings as { xero_connected?: boolean } | null
  if (!settings?.xero_connected) {
    return { client: null, tenantId: null, error: 'Xero not connected' }
  }

  if (!org.xero_token_set || !org.xero_tenant_id) {
    return { client: null, tenantId: null, error: 'Xero credentials missing' }
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

  await xero.initialize()

  // Set stored tokens
  const tokenSet = org.xero_token_set as TokenSet
  await xero.setTokenSet(tokenSet)

  // Check if token needs refresh (expires_at is in seconds)
  const expiresAt = tokenSet.expires_at || 0
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const bufferSeconds = 60 // Refresh 1 minute before expiry

  if (expiresAt - nowInSeconds < bufferSeconds) {
    try {
      const newTokenSet = await xero.refreshToken()

      // Store refreshed tokens
      await supabase
        .from('organizations')
        .update({ xero_token_set: newTokenSet } as any)
        .eq('id', organizationId)

      console.log('Xero token refreshed for org:', organizationId)
    } catch (refreshError) {
      console.error('Xero token refresh failed:', refreshError)
      // Clear connection on refresh failure
      const currentSettings = org.settings as Record<string, any> || {}
      await supabase
        .from('organizations')
        .update({
          xero_token_set: null,
          xero_tenant_id: null,
          settings: { ...currentSettings, xero_connected: false },
        } as any)
        .eq('id', organizationId)

      return { client: null, tenantId: null, error: 'Xero connection expired. Please reconnect.' }
    }
  }

  return { client: xero, tenantId: org.xero_tenant_id }
}
