import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendInvoiceFinalizedEmail } from '@/lib/notifications'
import { syncInvoiceToXero } from '@/lib/xero/sync-invoice'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params

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

    // 3. Fetch invoice with participant data for notification
    const { data: invoice, error: invoiceError } = await (supabase
      .from('invoices') as any)
      .select(`
        id,
        status,
        invoice_number,
        total,
        participants(
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // 4. Check if invoice is a draft
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft invoices can be finalized' },
        { status: 400 }
      )
    }

    // 5. Update invoice to submitted status with finalization metadata
    const { error: updateError } = await (supabase
      .from('invoices') as any)
      .update({
        status: 'submitted',
        finalized_at: new Date().toISOString(),
        finalized_by: user.id,
      })
      .eq('id', invoiceId)

    if (updateError) {
      // Could be trigger rejection from the finalization protection trigger
      console.error('Failed to finalize invoice:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to finalize invoice' },
        { status: 500 }
      )
    }

    // 6. Send notification email (fire-and-forget)
    const participant = invoice.participants
    if (participant?.email) {
      sendInvoiceFinalizedEmail({
        participantEmail: participant.email,
        participantName: `${participant.first_name} ${participant.last_name}`,
        emergencyContactEmail: null, // Not stored in participants table
        invoiceNumber: invoice.invoice_number,
        invoiceId: invoiceId,
        total: invoice.total,
      })
    }

    // 7. Trigger Xero sync (non-blocking - sync failure does not fail finalization)
    let xeroResult: { success: boolean; xeroInvoiceId?: string; error?: string } = {
      success: false,
      error: 'Not attempted'
    }

    try {
      xeroResult = await syncInvoiceToXero(invoiceId)
      console.log('Xero sync result:', xeroResult)
    } catch (xeroError) {
      console.error('Xero sync error (non-blocking):', xeroError)
      xeroResult = {
        success: false,
        error: xeroError instanceof Error ? xeroError.message : 'Sync failed'
      }
    }

    // 8. Return success
    return NextResponse.json({
      success: true,
      status: 'submitted',
      finalized_at: new Date().toISOString(),
      xeroSync: xeroResult,
    })
  } catch (error) {
    console.error('Finalize invoice error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
