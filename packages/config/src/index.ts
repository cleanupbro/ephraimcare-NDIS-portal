/**
 * Shared configuration for Ephraim Care Portal
 * Re-exports environment helpers and feature flags
 */

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return key;
}

export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (server-only)');
  return key;
}

/** Feature flags - adjust per environment */
export const features = {
  /** Enable GPS tracking for shift check-in */
  gpsTracking: true,
  /** Enable push notifications */
  pushNotifications: false,
  /** Show OpBros branding in footer */
  opBrosFooter: true,
} as const;
