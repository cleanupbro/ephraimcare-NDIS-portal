import { createClient } from '@supabase/supabase-js'
import { sendSms, formatToE164, isValidPhoneNumber } from '../sms/send-sms'
import {
  shiftReminder24h,
  shiftReminder2h,
  participantReminder24h,
} from '../sms/templates'
import { format } from 'date-fns'

interface ShiftWithDetails {
  id: string
  scheduled_start: string
  organization_id: string
  reminder_24h_sent: boolean
  reminder_2h_sent: boolean
  worker: {
    id: string
    profile: {
      first_name: string
      phone: string | null
      sms_notifications_enabled: boolean
    }
  }
  participant: {
    id: string
    first_name: string
    last_name: string
    phone: string | null
    sms_notifications_enabled: boolean
  }
  organization: {
    name: string
  }
}

interface ReminderResult {
  shiftsProcessed: number
  workerSmsSent: number
  participantSmsSent: number
  errors: string[]
}

/**
 * Send shift reminders for a specific time window
 * @param reminderType - '24h' or '2h'
 */
export async function sendShiftReminders(
  reminderType: '24h' | '2h'
): Promise<ReminderResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  let windowStart: Date
  let windowEnd: Date
  let sentColumn: 'reminder_24h_sent' | 'reminder_2h_sent'

  if (reminderType === '24h') {
    // 24h reminder: shifts starting 23-25 hours from now
    windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)
    sentColumn = 'reminder_24h_sent'
  } else {
    // 2h reminder: shifts starting 1.5-2.5 hours from now
    windowStart = new Date(now.getTime() + 1.5 * 60 * 60 * 1000)
    windowEnd = new Date(now.getTime() + 2.5 * 60 * 60 * 1000)
    sentColumn = 'reminder_2h_sent'
  }

  // Find shifts needing reminders
  const { data: shifts, error } = await supabase
    .from('shifts')
    .select(`
      id,
      scheduled_start,
      organization_id,
      reminder_24h_sent,
      reminder_2h_sent,
      worker:workers!inner(
        id,
        profile:profiles!inner(
          first_name,
          phone,
          sms_notifications_enabled
        )
      ),
      participant:participants!inner(
        id,
        first_name,
        last_name,
        phone,
        sms_notifications_enabled
      ),
      organization:organizations!inner(
        name
      )
    `)
    .gte('scheduled_start', windowStart.toISOString())
    .lte('scheduled_start', windowEnd.toISOString())
    .eq(sentColumn, false)
    .in('status', ['pending', 'confirmed'])

  if (error) {
    console.error('Error fetching shifts for reminders:', error)
    return {
      shiftsProcessed: 0,
      workerSmsSent: 0,
      participantSmsSent: 0,
      errors: [error.message],
    }
  }

  const result: ReminderResult = {
    shiftsProcessed: 0,
    workerSmsSent: 0,
    participantSmsSent: 0,
    errors: [],
  }

  for (const shift of (shifts as unknown as ShiftWithDetails[]) || []) {
    result.shiftsProcessed++

    const shiftDate = new Date(shift.scheduled_start)
    const startTime = format(shiftDate, 'h:mm a')

    // Send to worker if opted in and has phone
    const workerProfile = shift.worker?.profile
    if (workerProfile?.sms_notifications_enabled && workerProfile?.phone) {
      const formattedPhone = formatToE164(workerProfile.phone)

      if (isValidPhoneNumber(formattedPhone)) {
        const message = reminderType === '24h'
          ? shiftReminder24h({
              workerName: workerProfile.first_name,
              participantName: `${shift.participant.first_name} ${shift.participant.last_name}`,
              date: shiftDate,
              startTime,
              organizationName: shift.organization.name,
            })
          : shiftReminder2h({
              workerName: workerProfile.first_name,
              participantName: `${shift.participant.first_name} ${shift.participant.last_name}`,
              date: shiftDate,
              startTime,
              organizationName: shift.organization.name,
            })

        const smsResult = await sendSms({
          to: formattedPhone,
          body: message,
          organizationId: shift.organization_id,
          relatedShiftId: shift.id,
          relatedWorkerId: shift.worker.id,
        })

        if (smsResult.success) {
          result.workerSmsSent++
        } else {
          result.errors.push(`Worker SMS failed for shift ${shift.id}: ${smsResult.error}`)
        }
      }
    }

    // Send to participant if opted in, has phone, and is 24h reminder
    // (Participants only get 24h reminders per CONTEXT.md)
    if (reminderType === '24h') {
      const participant = shift.participant
      if (participant?.sms_notifications_enabled && participant?.phone) {
        const formattedPhone = formatToE164(participant.phone)

        if (isValidPhoneNumber(formattedPhone)) {
          const message = participantReminder24h({
            participantName: participant.first_name,
            workerName: workerProfile?.first_name || 'Your support worker',
            date: shiftDate,
            startTime,
            organizationName: shift.organization.name,
          })

          const smsResult = await sendSms({
            to: formattedPhone,
            body: message,
            organizationId: shift.organization_id,
            relatedShiftId: shift.id,
            relatedParticipantId: participant.id,
          })

          if (smsResult.success) {
            result.participantSmsSent++
          } else {
            result.errors.push(`Participant SMS failed for shift ${shift.id}: ${smsResult.error}`)
          }
        }
      }
    }

    // Mark reminder as sent
    await supabase
      .from('shifts')
      .update({ [sentColumn]: true } as any)
      .eq('id', shift.id)
  }

  return result
}
