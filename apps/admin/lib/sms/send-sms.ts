import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

export interface SendSmsParams {
  to: string // E.164 format: +614xxxxxxxx
  body: string
  organizationId: string
  relatedShiftId?: string
  relatedWorkerId?: string
  relatedParticipantId?: string
}

export interface SendSmsResult {
  success: boolean
  sid?: string
  error?: string
}

/**
 * Send SMS via Twilio using organization's credentials
 * Logs all SMS to sms_logs table for audit
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch organization's Twilio credentials
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, settings')
    .eq('id', params.organizationId)
    .single()

  if (orgError || !org) {
    console.error('Failed to fetch org credentials:', orgError)
    return { success: false, error: 'Organization not found' }
  }

  // Check if SMS is enabled
  const settings = org.settings as { sms_enabled?: boolean } | null
  if (!settings?.sms_enabled) {
    console.log('SMS not enabled for organization:', params.organizationId)
    return { success: false, error: 'SMS not enabled for this organization' }
  }

  if (!org.twilio_account_sid || !org.twilio_auth_token || !org.twilio_phone_number) {
    return { success: false, error: 'Twilio credentials not configured' }
  }

  // Create Twilio client with org credentials
  const client = twilio(org.twilio_account_sid, org.twilio_auth_token)

  try {
    const message = await client.messages.create({
      body: params.body,
      to: params.to,
      from: org.twilio_phone_number,
    })

    // Log successful send
    await supabase.from('sms_logs').insert({
      organization_id: params.organizationId,
      to_phone: params.to,
      message_body: params.body,
      twilio_sid: message.sid,
      status: 'sent',
      related_shift_id: params.relatedShiftId || null,
      related_worker_id: params.relatedWorkerId || null,
      related_participant_id: params.relatedParticipantId || null,
    } as any)

    return { success: true, sid: message.sid }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Twilio send failed:', error)

    // Log failed attempt
    await supabase.from('sms_logs').insert({
      organization_id: params.organizationId,
      to_phone: params.to,
      message_body: params.body,
      status: 'failed',
      error_message: errorMessage,
      related_shift_id: params.relatedShiftId || null,
      related_worker_id: params.relatedWorkerId || null,
      related_participant_id: params.relatedParticipantId || null,
    } as any)

    return { success: false, error: errorMessage }
  }
}

/**
 * Validate phone number format (E.164)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Australian mobile: +614xxxxxxxx (12 chars)
  // Australian landline: +612xxxxxxxx, +613xxxxxxxx, etc.
  return /^\+61[2-9]\d{8}$/.test(phone)
}

/**
 * Format Australian phone number to E.164
 * Accepts: 0412345678, 04 1234 5678, +61412345678
 */
export function formatToE164(phone: string): string {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // If starts with 0, replace with +61
  if (cleaned.startsWith('0')) {
    return '+61' + cleaned.slice(1)
  }

  // If doesn't start with +, add +61
  if (!cleaned.startsWith('+')) {
    return '+61' + cleaned
  }

  return cleaned
}
