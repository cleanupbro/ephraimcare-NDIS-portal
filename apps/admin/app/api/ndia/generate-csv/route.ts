import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  generateNdiaCsv,
  invoicesToPaceRows,
  calculateExportStats,
  type InvoiceForExport,
  type OrganizationDetails,
} from '@/lib/ndia/generate-claim-csv'
import { format } from 'date-fns'

/**
 * Generate NDIA PACE CSV for download
 * POST /api/ndia/generate-csv
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile } = await (supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single() as any)

    if (!profile?.organization_id || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { startDate, endDate, invoiceIds } = body

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Date range required' }, { status: 400 })
    }

    // Use service client for full access
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch organization details
    const { data: org, error: orgError } = await serviceClient
      .from('organizations')
      .select('id, name, abn, ndis_registration_number')
      .eq('id', profile.organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const organization: OrganizationDetails = {
      registrationNumber: (org as any).ndis_registration_number || '',
      abn: (org as any).abn || '',
      name: (org as any).name,
    }

    // Build invoice query
    let query = serviceClient
      .from('invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        participant:participants(
          ndis_number,
          first_name,
          last_name
        ),
        line_items:invoice_line_items(
          id,
          ndis_item_number,
          description,
          quantity,
          unit_price,
          line_total,
          service_date
        )
      `)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'finalized')
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate)

    // If specific invoice IDs provided, filter to those
    if (invoiceIds && invoiceIds.length > 0) {
      query = query.in('id', invoiceIds)
    }

    const { data: invoices, error: invoicesError } = await query

    if (invoicesError) {
      console.error('Failed to fetch invoices:', invoicesError)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({
        error: 'No finalized invoices found in the selected date range',
      }, { status: 404 })
    }

    // Cast to export format
    const invoicesForExport: InvoiceForExport[] = invoices.map((inv: any) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      invoice_date: inv.invoice_date,
      participant: inv.participant,
      line_items: inv.line_items || [],
    }))

    // Generate CSV
    const result = await generateNdiaCsv(invoicesForExport, organization)

    if (!result.success) {
      return NextResponse.json({
        error: 'CSV generation failed',
        validationErrors: result.errors,
      }, { status: 400 })
    }

    // Calculate stats
    const rows = invoicesToPaceRows(invoicesForExport, organization)
    const stats = calculateExportStats(rows)

    // Generate filename
    const filename = `ndia-claims-${format(new Date(startDate), 'yyyyMMdd')}-${format(new Date(endDate), 'yyyyMMdd')}.csv`

    // Return CSV with proper headers for download
    return new Response(result.csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Total-Claims': String(stats.totalClaims),
        'X-Total-Value': String(stats.totalValue.toFixed(2)),
        'X-Participant-Count': String(stats.participantCount),
      },
    })
  } catch (error) {
    console.error('NDIA CSV generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSV' },
      { status: 500 }
    )
  }
}

/**
 * Preview export stats without generating CSV
 * GET /api/ndia/generate-csv?startDate=xxx&endDate=xxx
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Date range required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await (supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single() as any)

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization' }, { status: 400 })
    }

    // Count matching invoices and line items
    const { data: invoices, error } = await (supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        participant:participants(ndis_number),
        line_items:invoice_line_items(id, ndis_item_number, line_total)
      `)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'finalized')
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate) as any)

    if (error) throw error

    const claimableItems = invoices?.flatMap((inv: any) =>
      (inv.line_items || []).filter((li: any) => li.ndis_item_number)
    ) || []

    const participantsWithNdis = invoices?.filter(
      (inv: any) => inv.participant?.ndis_number
    ).length || 0

    return NextResponse.json({
      invoiceCount: invoices?.length || 0,
      claimableLineItems: claimableItems.length,
      totalValue: claimableItems.reduce((sum: number, li: any) => sum + (li.line_total || 0), 0),
      participantsWithNdis,
      warnings: invoices?.filter((inv: any) => !inv.participant?.ndis_number)
        .map((inv: any) => `Invoice ${inv.invoice_number}: Missing NDIS number`) || [],
    })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json({ error: 'Failed to preview' }, { status: 500 })
  }
}
