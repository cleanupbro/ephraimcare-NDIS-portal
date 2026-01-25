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
