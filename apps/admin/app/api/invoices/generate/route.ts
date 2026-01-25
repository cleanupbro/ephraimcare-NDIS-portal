import { NextResponse } from 'next/server'
import { differenceInMinutes } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { generateInvoiceSchema } from '@/lib/invoices/schemas'
import {
  calculateBillableMinutes,
  getDayType,
  getRate,
  calculateLineTotal,
  calculateInvoiceTotals,
} from '@/lib/invoices/calculations'
import type { SupportTypeRate, DayType } from '@/lib/invoices/types'

export async function POST(request: Request) {
  try {
    // 1. Parse and validate body
    const body = await request.json()
    const parsed = generateInvoiceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { participant_id, period_start, period_end } = parsed.data

    // 2. Auth check: getUser() + verify admin/coordinator role
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

    // 3. Get user's organization_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    const userProfile = profile as { role: string; organization_id: string } | null

    if (!userProfile || !['admin', 'coordinator'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const orgId = userProfile.organization_id

    // 4. Fetch completed shifts in date range
    const { data: shifts, error: shiftsError } = await (supabase
      .from('shifts') as any)
      .select(
        'id, scheduled_start, scheduled_end, support_type, shift_check_ins(check_in_time, check_out_time, duration_minutes)'
      )
      .eq('participant_id', participant_id)
      .eq('status', 'completed')
      .gte('scheduled_start', period_start + 'T00:00:00')
      .lte('scheduled_start', period_end + 'T23:59:59')
      .order('scheduled_start', { ascending: true })

    if (shiftsError) {
      return NextResponse.json(
        { error: `Failed to fetch shifts: ${shiftsError.message}` },
        { status: 500 }
      )
    }

    // 5. If no shifts: return 400
    if (!shifts || shifts.length === 0) {
      return NextResponse.json(
        { error: 'No billable shifts found in the specified date range' },
        { status: 400 }
      )
    }

    // 6. Fetch active rates
    const { data: rates, error: ratesError } = await (supabase
      .from('support_type_rates') as any)
      .select('*')
      .eq('is_active', true)
      .eq('organization_id', orgId)

    if (ratesError) {
      return NextResponse.json(
        { error: `Failed to fetch rates: ${ratesError.message}` },
        { status: 500 }
      )
    }

    // 7. If no rates configured: return 400
    if (!rates || rates.length === 0) {
      return NextResponse.json(
        {
          error:
            'No support type rates configured. Please configure rates in Settings before generating invoices.',
        },
        { status: 400 }
      )
    }

    // 8. Fetch public holidays in range
    const { data: holidays } = await (supabase
      .from('public_holidays') as any)
      .select('holiday_date')
      .eq('organization_id', orgId)
      .gte('holiday_date', period_start)
      .lte('holiday_date', period_end)

    const holidayDates: string[] = (holidays ?? []).map(
      (h: { holiday_date: string }) => h.holiday_date
    )

    // 9. Generate invoice number via RPC
    const { data: invoiceNumber, error: rpcError } = await (supabase.rpc as any)(
      'next_invoice_number',
      { p_organization_id: orgId }
    )

    if (rpcError || !invoiceNumber) {
      return NextResponse.json(
        { error: `Failed to generate invoice number: ${rpcError?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    // 10. Build line items array by mapping over shifts
    const lineItems: Array<{
      shift_id: string
      ndis_item_number: string
      description: string
      service_date: string
      support_type: string
      day_type: DayType
      scheduled_minutes: number
      actual_minutes: number
      billable_minutes: number
      quantity: number
      unit_price: number
      line_total: number
    }> = []

    for (const shift of shifts) {
      const checkIn = shift.shift_check_ins?.[0] ?? null

      const scheduledStart = new Date(shift.scheduled_start)
      const scheduledEnd = new Date(shift.scheduled_end)

      // If check-in exists, use actual times; otherwise fall back to scheduled times
      let actualStart: Date
      let actualEnd: Date
      let actualMinutes: number

      if (checkIn && checkIn.check_in_time && checkIn.check_out_time) {
        actualStart = new Date(checkIn.check_in_time)
        actualEnd = new Date(checkIn.check_out_time)
        actualMinutes = differenceInMinutes(actualEnd, actualStart)
      } else {
        // Edge case: completed shift without check-in record (admin override)
        actualStart = scheduledStart
        actualEnd = scheduledEnd
        actualMinutes = differenceInMinutes(scheduledEnd, scheduledStart)
      }

      const scheduledMinutes = differenceInMinutes(scheduledEnd, scheduledStart)

      const billableMinutes = calculateBillableMinutes(
        scheduledStart,
        scheduledEnd,
        actualStart,
        actualEnd
      )

      const dayType = getDayType(scheduledStart, holidayDates)

      // Find matching rate by support_type
      const matchedRate = (rates as SupportTypeRate[]).find(
        (r) => r.support_type === shift.support_type
      )

      if (!matchedRate) {
        // Skip shifts without configured rates (or could use 0)
        console.warn(
          `No rate found for support type: ${shift.support_type}, skipping shift ${shift.id}`
        )
        continue
      }

      const unitPrice = getRate(matchedRate, dayType)
      const lineTotal = calculateLineTotal(billableMinutes, unitPrice)

      lineItems.push({
        shift_id: shift.id,
        ndis_item_number: matchedRate.ndis_item_number ?? '',
        description: `${shift.support_type} - ${dayType.replace('_', ' ')}`,
        service_date: shift.scheduled_start.split('T')[0],
        support_type: shift.support_type,
        day_type: dayType,
        scheduled_minutes: scheduledMinutes,
        actual_minutes: actualMinutes,
        billable_minutes: billableMinutes,
        quantity: billableMinutes / 60, // Hours as decimal
        unit_price: unitPrice,
        line_total: lineTotal,
      })
    }

    // Check if any line items were created after filtering
    if (lineItems.length === 0) {
      return NextResponse.json(
        {
          error:
            'No billable line items could be created. Please ensure rates are configured for the support types used in the shifts.',
        },
        { status: 400 }
      )
    }

    // 11. Calculate totals
    const totals = calculateInvoiceTotals(lineItems.map((li) => li.line_total))

    // 12. Insert invoice
    const { data: invoice, error: invoiceError } = await (supabase
      .from('invoices') as any)
      .insert({
        invoice_number: invoiceNumber,
        participant_id,
        invoice_date: new Date().toISOString().split('T')[0],
        period_start,
        period_end,
        subtotal: totals.subtotal,
        gst: totals.gst,
        total: totals.total,
        status: 'draft',
        organization_id: orgId,
        created_by: user.id,
      })
      .select()
      .single()

    if (invoiceError) {
      return NextResponse.json(
        { error: `Failed to create invoice: ${invoiceError.message}` },
        { status: 500 }
      )
    }

    // 13. Insert line items
    const { data: insertedLineItems, error: lineItemsError } = await (supabase
      .from('invoice_line_items') as any)
      .insert(
        lineItems.map((item) => ({
          invoice_id: invoice.id,
          shift_id: item.shift_id,
          ndis_item_number: item.ndis_item_number,
          description: item.description,
          service_date: item.service_date,
          support_type: item.support_type,
          day_type: item.day_type,
          scheduled_minutes: item.scheduled_minutes,
          actual_minutes: item.actual_minutes,
          billable_minutes: item.billable_minutes,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
        }))
      )
      .select()

    if (lineItemsError) {
      return NextResponse.json(
        { error: `Failed to create line items: ${lineItemsError.message}` },
        { status: 500 }
      )
    }

    // 14. Return 201 with invoice and line items
    return NextResponse.json(
      { invoice, line_items: insertedLineItems },
      { status: 201 }
    )
  } catch (error) {
    console.error('Invoice generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
