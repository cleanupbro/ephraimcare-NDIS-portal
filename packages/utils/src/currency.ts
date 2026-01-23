const AUD_FORMATTER = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatAUD(amount: number): string {
  return AUD_FORMATTER.format(amount)
}

export function parseAUD(formatted: string): number {
  return parseFloat(formatted.replace(/[^0-9.-]+/g, ''))
}

/** Convert cents integer to AUD dollars */
export function centsToAUD(cents: number): number {
  return cents / 100;
}

/** Convert AUD dollars to cents integer */
export function audToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Format cents as AUD display string */
export function formatCentsAsAUD(cents: number): string {
  return formatAUD(centsToAUD(cents));
}
