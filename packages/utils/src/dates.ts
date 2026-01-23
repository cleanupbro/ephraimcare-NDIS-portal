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
