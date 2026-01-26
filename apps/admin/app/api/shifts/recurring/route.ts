import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addWeeks, setDay, startOfDay, isBefore, setHours, setMinutes, parseISO } from 'date-fns'

interface RecurringShiftInput {
  participant_id: string
  worker_id?: string
  support_type: string
  start_time: string
  end_time: string
  days: number[]
  weeks: number
  organization_id: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: RecurringShiftInput = await request.json()

    // Validate input
    if (!body.participant_id || !body.support_type || !body.days?.length || !body.weeks) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Parse time
    const [startHour, startMin] = body.start_time.split(':').map(Number)
    const [endHour, endMin] = body.end_time.split(':').map(Number)

    // Generate dates
    const today = startOfDay(new Date())
    const shifts: any[] = []

    for (let week = 0; week < body.weeks; week++) {
      for (const day of body.days) {
        let date = setDay(addWeeks(today, week), day)

        // If the day is before today in the current week, skip to next week
        if (week === 0 && isBefore(date, today)) {
          date = addWeeks(date, 1)
        }

        // Check for duplicate dates
        const dateKey = date.toISOString().split('T')[0]
        if (shifts.some((s) => s.scheduled_start.split('T')[0] === dateKey)) {
          continue
        }

        // Set times
        const scheduledStart = setMinutes(setHours(date, startHour), startMin)
        const scheduledEnd = setMinutes(setHours(date, endHour), endMin)

        shifts.push({
          organization_id: body.organization_id,
          participant_id: body.participant_id,
          worker_id: body.worker_id || null,
          support_type: body.support_type,
          scheduled_start: scheduledStart.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          status: body.worker_id ? 'scheduled' : 'unassigned',
        })
      }
    }

    // Sort by date
    shifts.sort((a, b) =>
      new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
    )

    // Insert all shifts
    const { data, error } = await (supabase
      .from('shifts') as any)
      .insert(shifts)
      .select()

    if (error) {
      console.error('Shift creation error:', error)
      return NextResponse.json({ error: 'Failed to create shifts' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      shifts: data,
    })
  } catch (error) {
    console.error('Recurring shift error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
