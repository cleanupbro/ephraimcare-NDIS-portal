import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateWorkerHoursCsv,
  type WorkerHoursExportData,
} from '@/lib/reports/accounting-formats'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExportRequestBody {
  from?: string // ISO date string
  to?: string // ISO date string
  workerId?: string
}

// ─── POST Handler ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
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

    // 3. Parse request body
    const body = (await request.json()) as ExportRequestBody
    const { from, to, workerId } = body

    // 4. Build query for completed shifts with worker and participant data
    let query = (supabase
      .from('shifts') as any)
      .select(`
        scheduled_start,
        actual_start,
        actual_end,
        support_type,
        workers!inner (
          employee_id,
          profiles!inner (
            first_name,
            last_name
          )
        ),
        participants!inner (
          first_name,
          last_name
        )
      `)
      .eq('status', 'completed')
      .order('scheduled_start', { ascending: true })

    // Date range filter
    if (from) {
      query = query.gte('scheduled_start', from)
    }
    if (to) {
      // Add 1 day to include shifts that start on the 'to' date
      const toDate = new Date(to)
      toDate.setDate(toDate.getDate() + 1)
      query = query.lt('scheduled_start', toDate.toISOString())
    }

    // Worker filter
    if (workerId) {
      query = query.eq('worker_id', workerId)
    }

    const { data: shifts, error: shiftsError } = await query

    if (shiftsError) {
      console.error('Failed to fetch shifts:', shiftsError)
      return NextResponse.json(
        { error: 'Failed to fetch shifts' },
        { status: 500 }
      )
    }

    // 5. Check if any shifts found
    if (!shifts || shifts.length === 0) {
      return NextResponse.json(
        { error: 'No completed shifts found in the selected date range.' },
        { status: 400 }
      )
    }

    // 6. Transform to export format
    const workerHoursData: WorkerHoursExportData[] = shifts.map((shift: {
      scheduled_start: string
      actual_start: string | null
      actual_end: string | null
      support_type: string | null
      workers: {
        employee_id: string | null
        profiles: { first_name: string; last_name: string }
      }
      participants: { first_name: string; last_name: string }
    }) => {
      // Calculate hours from actual times if available
      const startTime = shift.actual_start || shift.scheduled_start
      const endTime = shift.actual_end
      let hoursWorked = 0

      if (endTime) {
        const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime()
        hoursWorked = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100
      }

      return {
        employee_id: shift.workers.employee_id,
        first_name: shift.workers.profiles.first_name,
        last_name: shift.workers.profiles.last_name,
        shift_date: shift.scheduled_start.split('T')[0], // Extract date portion
        participant_name: `${shift.participants.first_name} ${shift.participants.last_name}`,
        hours_worked: hoursWorked,
        support_type: shift.support_type,
      }
    })

    // 7. Generate CSV
    const csv = generateWorkerHoursCsv(workerHoursData)

    // 8. Return CSV with UTF-8 BOM
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `Worker-Hours-${dateStr}.csv`
    const bom = '\uFEFF'

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Worker hours export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
