import { NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'

import { createClient } from '@/lib/supabase/server'
import { InvoicePDF } from '@/components/pdf/InvoicePDF'

// CRITICAL: Must use Node.js runtime for @react-pdf/renderer (not edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/invoices/[id]/pdf
 *
 * Generates and returns a PDF for the specified invoice.
 * Only accessible to authenticated participants.
 * RLS enforces that participant can only access their own invoices.
 *
 * Key differences from admin route:
 * - Checks for 'participant' role instead of 'admin/coordinator'
 * - Excludes draft invoices (participants can't see drafts)
 * - RLS handles data isolation (participant can only access their own invoices)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params

    // 1. Verify caller is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. Verify caller is a participant
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileData = profile as { role: string } | null

    if (!profileData || profileData.role !== 'participant') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // 3. Fetch invoice with line items and participant details
    // RLS policy ensures participant can only access their own invoices
    const { data: invoice, error: invoiceError } = await (supabase
      .from('invoices')
      .select(`
        *,
        invoice_line_items (*),
        participants (
          first_name,
          last_name,
          ndis_number
        )
      `)
      .eq('id', invoiceId)
      .neq('status', 'draft')
      .single() as any)

    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError)
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // 4. Transform the data to match InvoicePDF props
    const invoiceData = {
      ...invoice,
      line_items: invoice.invoice_line_items || [],
    }

    // 5. Generate PDF blob
    let pdfBlob: Blob
    try {
      // Call InvoicePDF as a function to get the Document element directly
      // This is required because pdf() expects a Document element, not a component wrapper
      const documentElement = InvoicePDF({ invoice: invoiceData })
      const pdfDocument = pdf(documentElement)
      pdfBlob = await pdfDocument.toBlob()
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError)
      return NextResponse.json(
        { error: 'Failed to generate PDF' },
        { status: 500 }
      )
    }

    // 6. Convert blob to ArrayBuffer for Response
    const arrayBuffer = await pdfBlob.arrayBuffer()

    // 7. Return PDF with proper headers
    const filename = `${invoice.invoice_number}.pdf`

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': arrayBuffer.byteLength.toString(),
        // Prevent caching to ensure fresh PDFs
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
