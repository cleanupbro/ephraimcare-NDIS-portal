import { differenceInMinutes, isSaturday, isSunday, format } from 'date-fns'

import type { DayType, SupportTypeRate } from './types'
import { GST_RATE } from './constants'

// ─── Billable Minutes ─────────────────────────────────────────────────────────

/**
 * Calculate billable minutes using the lesser-of rule (INVC-02).
 * Returns the lesser of scheduled duration vs actual duration.
 * No rounding applied (INVC-03: exact minutes).
 */
export function calculateBillableMinutes(
  scheduledStart: Date,
  scheduledEnd: Date,
  actualCheckIn: Date,
  actualCheckOut: Date
): number {
  const scheduledMinutes = differenceInMinutes(scheduledEnd, scheduledStart)
  const actualMinutes = differenceInMinutes(actualCheckOut, actualCheckIn)
  return Math.min(scheduledMinutes, actualMinutes)
}

// ─── Day Type Detection ───────────────────────────────────────────────────────

/**
 * Determine the day type for rate selection.
 * Checks public holidays FIRST (a public holiday on Saturday is still public_holiday rate).
 */
export function getDayType(date: Date, publicHolidayDates: string[]): DayType {
  const dateStr = format(date, 'yyyy-MM-dd')

  // Public holidays take priority over day-of-week
  if (publicHolidayDates.includes(dateStr)) {
    return 'public_holiday'
  }

  if (isSaturday(date)) return 'saturday'
  if (isSunday(date)) return 'sunday'

  return 'weekday'
}

// ─── Rate Selection ───────────────────────────────────────────────────────────

/**
 * Select the correct rate tier based on day type.
 */
export function getRate(rate: SupportTypeRate, dayType: DayType): number {
  switch (dayType) {
    case 'weekday':
      return rate.weekday_rate
    case 'saturday':
      return rate.saturday_rate
    case 'sunday':
      return rate.sunday_rate
    case 'public_holiday':
      return rate.public_holiday_rate
  }
}

// ─── Line Total Calculation ───────────────────────────────────────────────────

/**
 * Calculate the total for a single invoice line item.
 * Converts minutes to hours, multiplies by rate, rounds to 2 decimal places.
 */
export function calculateLineTotal(billableMinutes: number, hourlyRate: number): number {
  const hours = billableMinutes / 60
  return Math.round(hours * hourlyRate * 100) / 100
}

// ─── Invoice Totals ───────────────────────────────────────────────────────────

/**
 * Calculate invoice subtotal, GST (10%), and total from line totals.
 * All amounts rounded to 2 decimal places.
 */
export function calculateInvoiceTotals(lineTotals: number[]): {
  subtotal: number
  gst: number
  total: number
} {
  const subtotal = lineTotals.reduce((sum, amount) => sum + amount, 0)
  const gst = Math.round(subtotal * GST_RATE * 100) / 100
  const total = Math.round((subtotal + gst) * 100) / 100
  return { subtotal, gst, total }
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

/**
 * Format minutes as decimal hours (e.g., 90 minutes -> "1.50").
 */
export function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(2)
}

/**
 * Format a number as Australian currency (e.g., 150.5 -> "$150.50").
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
}
