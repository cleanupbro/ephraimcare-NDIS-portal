import { NextResponse } from 'next/server'
import { sendShiftReminders } from '@/lib/shifts/send-shift-notifications'

/**
 * Cron endpoint for sending shift SMS reminders
 * Called hourly by pg_cron or external scheduler
 *
 * POST /api/cron/send-shift-reminders
 * Authorization: Bearer {CRON_SECRET}
 */
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`

  if (!authHeader || authHeader !== expectedToken) {
    console.error('Unauthorized cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[CRON] Starting shift reminder job...')

  try {
    // Send 24h reminders
    const result24h = await sendShiftReminders('24h')
    console.log('[CRON] 24h reminders:', {
      shifts: result24h.shiftsProcessed,
      workerSms: result24h.workerSmsSent,
      participantSms: result24h.participantSmsSent,
      errors: result24h.errors.length,
    })

    // Send 2h reminders
    const result2h = await sendShiftReminders('2h')
    console.log('[CRON] 2h reminders:', {
      shifts: result2h.shiftsProcessed,
      workerSms: result2h.workerSmsSent,
      errors: result2h.errors.length,
    })

    return NextResponse.json({
      success: true,
      results: {
        '24h': {
          shiftsProcessed: result24h.shiftsProcessed,
          workerSmsSent: result24h.workerSmsSent,
          participantSmsSent: result24h.participantSmsSent,
          errors: result24h.errors,
        },
        '2h': {
          shiftsProcessed: result2h.shiftsProcessed,
          workerSmsSent: result2h.workerSmsSent,
          participantSmsSent: result2h.participantSmsSent,
          errors: result2h.errors,
        },
      },
    })
  } catch (error) {
    console.error('[CRON] Shift reminder job failed:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Allow GET for manual testing in development
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  // In dev, just run without auth check
  return POST(request)
}
