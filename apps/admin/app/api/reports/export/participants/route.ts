import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateParticipantsCsv,
  type ParticipantExportData,
} from '@/lib/reports/accounting-formats'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExportRequestBody {
  status?: 'active' | 'inactive' | 'all'
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
    const { status = 'all' } = body

    // 4. Build query for participants
    let query = supabase
      .from('participants')
      .select(`
        ndis_number,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        address_line_1,
        address_line_2,
        suburb,
        state,
        postcode,
        emergency_contact_name,
        emergency_contact_phone,
        is_active
      `)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })

    // Status filter
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }
    // 'all' = no filter

    const { data: participants, error: participantsError } = await query

    if (participantsError) {
      console.error('Failed to fetch participants:', participantsError)
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      )
    }

    // 5. Check if any participants found
    if (!participants || participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants found.' },
        { status: 400 }
      )
    }

    // 6. Generate CSV
    const typedParticipants = participants as ParticipantExportData[]
    const csv = generateParticipantsCsv(typedParticipants)

    // 7. Return CSV with UTF-8 BOM
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `Participant-List-${dateStr}.csv`
    const bom = '\uFEFF'

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Participant export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
