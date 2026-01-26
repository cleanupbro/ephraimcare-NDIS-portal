'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrganizationSettings {
  id: string
  name: string
  abn: string | null
  settings: {
    sms_enabled: boolean
    xero_connected: boolean
    ndia_registered: boolean
  } | null
  twilio_account_sid: string | null
  twilio_phone_number: string | null
  // Note: twilio_auth_token is intentionally not returned for security
}

export interface UpdateOrganizationSettingsInput {
  twilio_account_sid?: string
  twilio_auth_token?: string
  twilio_phone_number?: string
  settings?: {
    sms_enabled?: boolean
    xero_connected?: boolean
    ndia_registered?: boolean
  }
}

// ─── Fetch Current User's Organization ────────────────────────────────────────

/**
 * Fetch current user's organization with settings
 * Returns organization data including credentials (except auth token)
 */
export function useOrganization() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['organization'],
    queryFn: async (): Promise<OrganizationSettings | null> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Get user's org ID from profile
      const { data: profile } = await (supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single() as any)

      const profileData = profile as { organization_id: string | null } | null
      if (!profileData?.organization_id) return null

      const { data, error } = await (supabase
        .from('organizations')
        .select(`
          id,
          name,
          abn,
          settings,
          twilio_account_sid,
          twilio_phone_number
        `)
        .eq('id', profileData.organization_id)
        .single() as any)

      if (error) throw error
      return data as OrganizationSettings
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - settings don't change often
  })
}

// ─── Update Organization Settings ─────────────────────────────────────────────

/**
 * Update organization settings (admin only)
 * Handles credentials and feature flags
 */
export function useUpdateOrganizationSettings() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateOrganizationSettingsInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await (supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single() as any)

      const profileData = profile as { organization_id: string | null; role: string | null } | null
      if (!profileData?.organization_id) throw new Error('No organization')
      if (profileData.role !== 'admin') throw new Error('Admin access required')

      // Build update object - only include fields that are being updated
      const updateData: Record<string, unknown> = {}

      if (input.twilio_account_sid !== undefined) {
        updateData.twilio_account_sid = input.twilio_account_sid
      }
      if (input.twilio_auth_token !== undefined && input.twilio_auth_token !== '') {
        // Only update token if a new one is provided
        updateData.twilio_auth_token = input.twilio_auth_token
      }
      if (input.twilio_phone_number !== undefined) {
        updateData.twilio_phone_number = input.twilio_phone_number
      }

      if (input.settings) {
        // Merge with existing settings
        const { data: org } = await (supabase
          .from('organizations')
          .select('settings')
          .eq('id', profileData.organization_id)
          .single() as any)

        updateData.settings = {
          ...(org?.settings as object || {}),
          ...input.settings,
        }
      }

      const { error } = await (supabase
        .from('organizations') as any)
        .update(updateData)
        .eq('id', profileData.organization_id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    },
  })
}

// ─── Test Twilio Credentials ──────────────────────────────────────────────────

/**
 * Test Twilio credentials by sending a test SMS
 * Requires credentials to be saved first
 */
export function useTestTwilioCredentials() {
  return useMutation({
    mutationFn: async (testPhone: string) => {
      const response = await fetch('/api/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testPhone }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send test SMS')
      }

      return response.json()
    },
  })
}
