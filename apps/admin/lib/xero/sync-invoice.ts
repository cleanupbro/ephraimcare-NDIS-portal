import { getXeroClient } from './client'
import { createClient } from '@supabase/supabase-js'
import { Invoice as XeroInvoice, LineItem, Contact, LineAmountTypes } from 'xero-node'

export interface SyncInvoiceResult {
  success: boolean
  xeroInvoiceId?: string
  error?: string
}

/**
 * Sync a finalized invoice to Xero
 * Creates contact if needed, then creates invoice
 */
export async function syncInvoiceToXero(invoiceId: string): Promise<SyncInvoiceResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch invoice with all details
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      participant:participants(
        id,
        first_name,
        last_name,
        email,
        ndis_number
      ),
      line_items:invoice_line_items(
        id,
        description,
        quantity,
        unit_price,
        total,
        support_item_number
      )
    `)
    .eq('id', invoiceId)
    .single()

  if (invoiceError || !invoice) {
    return { success: false, error: 'Invoice not found' }
  }

  // Get Xero client
  const { client: xero, tenantId, error: clientError } = await getXeroClient(invoice.organization_id)

  if (!xero || !tenantId) {
    // Xero not connected - mark as not applicable
    await supabase
      .from('invoices')
      .update({
        xero_sync_status: 'not_applicable',
        xero_sync_error: clientError || 'Xero not connected',
      } as any)
      .eq('id', invoiceId)

    return { success: false, error: clientError || 'Xero not connected' }
  }

  try {
    // Get or create Xero contact for participant
    const contactId = await getOrCreateXeroContact(
      xero,
      tenantId,
      supabase,
      invoice.organization_id,
      invoice.participant
    )

    // Map line items
    const lineItems: LineItem[] = (invoice.line_items || []).map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitAmount: item.unit_price,
      accountCode: '200', // Revenue account - TODO: make configurable
      taxType: 'EXEMPTOUTPUT', // NDIS is GST-free
      lineAmount: item.total,
      tracking: item.support_item_number ? [
        { name: 'NDIS Support Item', option: item.support_item_number }
      ] : undefined,
    }))

    // Create Xero invoice
    const xeroInvoice: XeroInvoice = {
      type: XeroInvoice.TypeEnum.ACCREC,
      contact: { contactID: contactId },
      lineItems,
      date: invoice.invoice_date,
      dueDate: invoice.due_date,
      reference: invoice.invoice_number,
      status: XeroInvoice.StatusEnum.AUTHORISED,
      lineAmountTypes: LineAmountTypes.Exclusive,
    }

    const result = await xero.accountingApi.createInvoices(
      tenantId,
      { invoices: [xeroInvoice] }
    )

    const xeroInvoiceId = result.body.invoices?.[0]?.invoiceID

    if (!xeroInvoiceId) {
      throw new Error('Xero did not return invoice ID')
    }

    // Update invoice with Xero reference
    await supabase
      .from('invoices')
      .update({
        xero_invoice_id: xeroInvoiceId,
        xero_sync_status: 'synced',
        xero_sync_error: null,
        xero_synced_at: new Date().toISOString(),
      } as any)
      .eq('id', invoiceId)

    console.log(`Invoice ${invoiceId} synced to Xero: ${xeroInvoiceId}`)
    return { success: true, xeroInvoiceId }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown Xero error'
    console.error('Xero sync failed:', error)

    // Update invoice with error
    await supabase
      .from('invoices')
      .update({
        xero_sync_status: 'failed',
        xero_sync_error: errorMessage,
      } as any)
      .eq('id', invoiceId)

    return { success: false, error: errorMessage }
  }
}

/**
 * Get existing Xero contact or create new one
 */
async function getOrCreateXeroContact(
  xero: any,
  tenantId: string,
  supabase: any,
  organizationId: string,
  participant: {
    id: string
    first_name: string
    last_name: string
    email: string | null
    ndis_number: string | null
  }
): Promise<string> {
  // Check cached mapping
  const { data: org } = await supabase
    .from('organizations')
    .select('xero_contact_mapping')
    .eq('id', organizationId)
    .single()

  const mapping = (org?.xero_contact_mapping || {}) as Record<string, string>

  if (mapping[participant.id]) {
    return mapping[participant.id]
  }

  // Search for existing contact by NDIS number or name
  const searchName = `${participant.first_name} ${participant.last_name}`
  let contactId: string | undefined

  try {
    const contacts = await xero.accountingApi.getContacts(
      tenantId,
      undefined,
      `Name=="${searchName}"`
    )

    if (contacts.body.contacts && contacts.body.contacts.length > 0) {
      contactId = contacts.body.contacts[0].contactID
    }
  } catch (e) {
    // Contact not found, will create
  }

  // Create new contact if not found
  if (!contactId) {
    const newContact: Contact = {
      name: searchName,
      firstName: participant.first_name,
      lastName: participant.last_name,
      emailAddress: participant.email || undefined,
      accountNumber: participant.ndis_number || undefined,
    }

    const result = await xero.accountingApi.createContacts(
      tenantId,
      { contacts: [newContact] }
    )

    contactId = result.body.contacts?.[0]?.contactID

    if (!contactId) {
      throw new Error('Failed to create Xero contact')
    }
  }

  // Cache mapping
  mapping[participant.id] = contactId
  await supabase
    .from('organizations')
    .update({ xero_contact_mapping: mapping } as any)
    .eq('id', organizationId)

  return contactId
}

/**
 * Retry failed Xero syncs for an organization
 */
export async function retryFailedXeroSyncs(organizationId: string): Promise<{
  retried: number
  succeeded: number
  failed: number
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: failedInvoices } = await supabase
    .from('invoices')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('xero_sync_status', 'failed')

  const results = { retried: 0, succeeded: 0, failed: 0 }

  for (const invoice of failedInvoices || []) {
    results.retried++
    const result = await syncInvoiceToXero(invoice.id)
    if (result.success) {
      results.succeeded++
    } else {
      results.failed++
    }
  }

  return results
}
