import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Disconnect Xero from organization
 * GET /api/xero/disconnect
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

    // Clear Xero credentials using service role
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current settings
    const { data: org } = await serviceClient
      .from('organizations')
      .select('settings')
      .eq('id', profile.organization_id)
      .single()

    const currentSettings = org?.settings as Record<string, any> || {}

    await serviceClient
      .from('organizations')
      .update({
        xero_token_set: null,
        xero_tenant_id: null,
        settings: {
          ...currentSettings,
          xero_connected: false,
          xero_org_name: null,
        },
      } as any)
      .eq('id', profile.organization_id)

    return NextResponse.redirect(
      new URL('/settings/integrations?success=xero_disconnected', process.env.NEXT_PUBLIC_ADMIN_URL!)
    )
  } catch (error) {
    console.error('Xero disconnect error:', error)
    return NextResponse.redirect(
      new URL('/settings/integrations?error=disconnect_failed', process.env.NEXT_PUBLIC_ADMIN_URL!)
    )
  }
}
