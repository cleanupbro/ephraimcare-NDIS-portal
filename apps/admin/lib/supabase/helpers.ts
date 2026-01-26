import { createClient } from './server'

/**
 * Check if current user is a platform admin (cross-org access)
 *
 * Platform admins can view data across all organizations for
 * support and management purposes.
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single()

  // Handle null profile or null is_platform_admin
  if (!profile) return false
  return profile.is_platform_admin ?? false
}

/**
 * Organization settings shape
 */
export interface OrganizationSettings {
  sms_enabled: boolean
  xero_connected: boolean
  ndia_registered: boolean
}

/**
 * Get organization settings (feature flags)
 *
 * Returns null if organization not found.
 */
export async function getOrganizationSettings(
  organizationId: string
): Promise<OrganizationSettings | null> {
  const supabase = await createClient()

  const { data } = (await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single()) as { data: { settings: OrganizationSettings | null } | null }

  if (!data || !data.settings) return null

  return data.settings
}

/**
 * Get the current user's organization ID from their profile
 */
export async function getCurrentUserOrganizationId(): Promise<string | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  // Handle null profile
  if (!profile) return null
  return profile.organization_id ?? null
}
