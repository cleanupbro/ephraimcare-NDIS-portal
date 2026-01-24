import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { overrideCheckoutSchema } from '@/lib/shifts/schemas'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shiftId } = await params

    // 1. Verify caller is authenticated
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. Verify caller is admin or coordinator
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profile = callerProfile as { role: string } | null

    if (!profile || !['admin', 'coordinator'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    const parsed = overrideCheckoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { check_out_time } = parsed.data

    // 4. Fetch existing check-in record for this shift
    const { data: checkIn, error: checkInError } = await (supabase
      .from('shift_check_ins') as any)
      .select('id, check_in_time, shift_id')
      .eq('shift_id', shiftId)
      .single()

    if (checkInError || !checkIn) {
      return NextResponse.json(
        { error: 'No check-in record found for this shift' },
        { status: 404 }
      )
    }

    // 5. Validate checkout time is after check-in time
    const checkInDate = new Date(checkIn.check_in_time)
    const checkOutDate = new Date(check_out_time)

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: 'Check-out time must be after check-in time' },
        { status: 400 }
      )
    }

    // 6. Calculate duration in minutes
    const durationMinutes = Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / 60000
    )

    // 7. Update shift_check_ins with override
    const { error: updateCheckInError } = await (supabase
      .from('shift_check_ins') as any)
      .update({
        check_out_time,
        check_out_type: 'admin_override',
        duration_minutes: durationMinutes,
      })
      .eq('id', checkIn.id)

    if (updateCheckInError) {
      return NextResponse.json(
        { error: `Failed to update check-in record: ${updateCheckInError.message}` },
        { status: 500 }
      )
    }

    // 8. Update shift status to completed
    const { error: updateShiftError } = await (supabase
      .from('shifts') as any)
      .update({ status: 'completed' })
      .eq('id', shiftId)

    if (updateShiftError) {
      return NextResponse.json(
        { error: `Failed to update shift status: ${updateShiftError.message}` },
        { status: 500 }
      )
    }

    // 9. Return success
    return NextResponse.json({
      message: 'Check-out time overridden successfully',
      check_out_time,
      check_out_type: 'admin_override',
      duration_minutes: durationMinutes,
    })
  } catch (error) {
    console.error('Override checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
