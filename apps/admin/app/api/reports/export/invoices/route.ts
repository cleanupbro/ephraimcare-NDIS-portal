import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateXeroInvoiceCsv,
  generateMyobInvoiceCsv,
  type InvoiceExportData,
} from '@/lib/reports/accounting-formats'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExportRequestBody {
  format: 'xero' | 'myob'
  from?: string // ISO date string
  to?: string // ISO date string
  status?: 'submitted' | 'paid' | 'all'
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

    // 3. Parse and validate request body
    const body = (await request.json()) as ExportRequestBody
    const { format, from, to, status = 'all' } = body

    if (!format || !['xero', 'myob'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be "xero" or "myob".' },
        { status: 400 }
      )
    }

    // 4. Build query for invoices with line items
    let query = (supabase
      .from('invoices') as any)
      .select(`
        invoice_number,
        invoice_date,
        due_date,
        participants (
          first_name,
          last_name,
          ndis_number
        ),
        invoice_line_items (
          description,
          quantity,
          unit_price,
          ndis_item_number,
          service_date
        )
      `)
      .order('invoice_date', { ascending: false })

    // Status filter - only finalized invoices by default
    if (status === 'submitted') {
      query = query.eq('status', 'submitted')
    } else if (status === 'paid') {
      query = query.eq('status', 'paid')
    } else {
      // 'all' means submitted or paid (finalized only)
      query = query.in('status', ['submitted', 'paid'])
    }

    // Date range filter
    if (from) {
      query = query.gte('invoice_date', from)
    }
    if (to) {
      query = query.lte('invoice_date', to)
    }

    const { data: invoices, error: invoicesError } = await query

    if (invoicesError) {
      console.error('Failed to fetch invoices:', invoicesError)
      return NextResponse.json(
        { error: 'Failed to fetch invoices' },
        { status: 500 }
      )
    }

    // 5. Check if any invoices found
    if (!invoices || invoices.length === 0) {
      return NextResponse.json(
        { error: 'No finalized invoices found in the selected date range.' },
        { status: 400 }
      )
    }

    // 6. Generate CSV based on format
    const typedInvoices = invoices as InvoiceExportData[]
    const csv =
      format === 'xero'
        ? generateXeroInvoiceCsv(typedInvoices)
        : generateMyobInvoiceCsv(typedInvoices)

    // 7. Return CSV with UTF-8 BOM for Excel compatibility
    const formatLabel = format.toUpperCase()
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `${formatLabel}-Invoice-Export-${dateStr}.csv`
    const bom = '\uFEFF'

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Invoice export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
