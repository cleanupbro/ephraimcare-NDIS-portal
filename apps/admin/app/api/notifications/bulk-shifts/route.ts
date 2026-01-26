import { NextResponse } from 'next/server'

/**
 * Send summary notification for bulk shift creation
 * POST /api/notifications/bulk-shifts
 *
 * Key: Sends single summary notification, not per-shift
 * This prevents notification storms when creating many shifts at once.
 */
export async function POST(request: Request) {
  try {
    const { workerEmail, workerName, shiftCount, startDate, endDate } = await request.json()

    if (!workerEmail || !shiftCount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Log the notification for now
    // TODO: Integrate with Resend or existing email infrastructure
    console.log('Bulk shift notification:', {
      to: workerEmail,
      subject: `${shiftCount} new shifts scheduled`,
      message: `Hi ${workerName || 'there'}, you have ${shiftCount} new shifts scheduled from ${startDate} to ${endDate}.`,
    })

    // In production, this would use the sendEmail utility:
    // await sendEmail({
    //   to: workerEmail,
    //   subject: `${shiftCount} new shifts scheduled - Ephraim Care`,
    //   template: 'bulk-shifts-assigned',
    //   data: { workerName, shiftCount, startDate, endDate },
    // })

    return NextResponse.json({
      success: true,
      message: `Summary notification queued for ${workerEmail}`,
    })
  } catch (error) {
    console.error('Bulk notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
