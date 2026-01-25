import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePaceCsv, type PaceCsvInvoice } from '@/lib/invoices/csv-export'

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
    const body = await request.json()
    const { invoice_ids, registration_number = '' } = body as {
      invoice_ids?: string[]
      registration_number?: string
    }

    // 4. Validate invoice_ids is non-empty array
    if (!invoice_ids || !Array.isArray(invoice_ids) || invoice_ids.length === 0) {
      return NextResponse.json(
        { error: 'No invoices selected' },
        { status: 400 }
      )
    }

    // 5. Fetch all selected invoices with their line items and participant data
    // Only include finalized invoices (submitted or paid)
    const { data: invoices, error: invoicesError } = await (supabase
      .from('invoices') as any)
      .select(`
        id,
        invoice_number,
        status,
        participants (ndis_number),
        invoice_line_items (
          service_date,
          ndis_item_number,
          billable_minutes,
          unit_price
        )
      `)
      .in('id', invoice_ids)
      .in('status', ['submitted', 'paid'])

    if (invoicesError) {
      console.error('Failed to fetch invoices:', invoicesError)
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      )
    }

    // 6. Check if any finalized invoices were found
    if (!invoices || invoices.length === 0) {
      return NextResponse.json(
        { error: 'No finalized invoices found. Only submitted or paid invoices can be exported.' },
        { status: 400 }
      )
    }

    // 7. Transform data to PaceCsvInvoice[] format
    const paceCsvInvoices: PaceCsvInvoice[] = invoices.map((invoice: {
      invoice_number: string
      participants: { ndis_number: string } | null
      invoice_line_items: Array<{
        service_date: string
        ndis_item_number: string
        billable_minutes: number
        unit_price: number
      }>
    }) => ({
      invoice_number: invoice.invoice_number,
      participant_ndis_number: invoice.participants?.ndis_number ?? '',
      line_items: invoice.invoice_line_items ?? [],
    }))

    // 8. Generate CSV
    const csv = generatePaceCsv(paceCsvInvoices, registration_number)

    // 9. Return CSV as downloadable file
    const filename = `NDIS-Bulk-Payment-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export CSV error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
