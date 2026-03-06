import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'

export const TIMEZONE = 'Australia/Sydney'

export function toSydneyTime(date: Date | string): TZDate {
  return new TZDate(typeof date === 'string' ? new Date(date) : date, TIMEZONE)
}

export function formatSydneyDate(date: Date | string, formatStr: string): string {
  const tzDate = toSydneyTime(date)
  return format(tzDate, formatStr)
}

export function getCurrentSydneyTime(): TZDate {
  return new TZDate(new Date(), TIMEZONE)
}

export function getTimezoneAbbreviation(date: Date): string {
  const offset = new TZDate(date, TIMEZONE).getTimezoneOffset()
  return offset === -660 ? 'AEDT' : 'AEST'
}

/**
 * Build an ISO timestamp from a date string (YYYY-MM-DD) and time string (HH:MM)
 * interpreted in Australia/Sydney timezone. This prevents the common bug where
 * `new Date("2026-03-07T09:00:00")` creates a local-timezone date that shifts
 * when converted to UTC via `.toISOString()`.
 */
export function sydneyDateTimeToISO(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  const sydneyDate = new TZDate(year, month - 1, day, hour, minute, 0, 0, TIMEZONE)
  return sydneyDate.toISOString()
}
