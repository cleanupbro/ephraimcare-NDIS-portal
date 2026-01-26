import type { CsvColumn } from './types'

// ─── CSV Generation ─────────────────────────────────────────────────────────

/**
 * Generate CSV string from any data array with column configuration.
 * Handles proper CSV escaping (commas, quotes, newlines).
 *
 * @param data - Array of objects to export
 * @param columns - Column definitions with headers and optional formatting
 * @returns CSV string (header row + data rows)
 *
 * @example
 * ```ts
 * const csv = generateCsv(users, [
 *   { header: 'Name', key: 'name' },
 *   { header: 'Email', key: 'email' },
 *   { header: 'Balance', key: 'balance', format: (v) => `$${v.toFixed(2)}` },
 * ])
 * ```
 */
export function generateCsv<T extends object>(
  data: T[],
  columns: CsvColumn<T>[]
): string {
  // Build header row
  const headers = columns.map((col) => escapeField(col.header)).join(',')

  // Build data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key]
        const formatted = col.format
          ? col.format(value as T[keyof T])
          : formatValue(value)
        return escapeField(formatted)
      })
      .join(',')
  )

  return [headers, ...rows].join('\n')
}

/**
 * Escape a single field value for CSV format.
 * Wraps in quotes if value contains comma, quote, or newline.
 */
function escapeField(value: string): string {
  // Check if field needs quoting
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    // Escape internal quotes by doubling them
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Convert any value to string representation.
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}

// ─── CSV Download ───────────────────────────────────────────────────────────

/**
 * Trigger browser download of CSV content.
 *
 * @param content - CSV string content
 * @param filename - Download filename (without .csv extension)
 *
 * @example
 * ```ts
 * const csv = generateCsv(data, columns)
 * downloadCsv(csv, 'budget-report-2026-01')
 * ```
 */
export function downloadCsv(content: string, filename: string): void {
  // Create blob with BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF'
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  // Create temporary download link
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'

  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up object URL
  URL.revokeObjectURL(url)
}
