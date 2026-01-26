import * as XLSX from 'xlsx'
import type { CsvColumn } from './types'

// ─── Excel Generation ───────────────────────────────────────────────────────

/**
 * Generate Excel workbook from any data array with column configuration.
 * Uses SheetJS XLSX library with auto-sized columns.
 *
 * @param data - Array of objects to export
 * @param columns - Column definitions with headers and optional formatting
 * @param sheetName - Name for the worksheet (default: 'Report')
 * @returns XLSX Workbook object
 *
 * @example
 * ```ts
 * const wb = generateExcelWorkbook(users, [
 *   { header: 'Name', key: 'name' },
 *   { header: 'Email', key: 'email' },
 *   { header: 'Balance', key: 'balance', format: (v) => `$${v.toFixed(2)}` },
 * ])
 * ```
 */
export function generateExcelWorkbook<T extends object>(
  data: T[],
  columns: CsvColumn<T>[],
  sheetName = 'Report'
): XLSX.WorkBook {
  // Build rows array: headers + data
  const headers = columns.map((col) => col.header)

  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key]
      if (col.format) {
        return col.format(value as T[keyof T])
      }
      return formatValueForExcel(value)
    })
  )

  // Create worksheet from array of arrays
  const wsData = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Auto-size columns based on content
  const colWidths = columns.map((col, colIndex) => {
    // Start with header width
    let maxWidth = col.header.length

    // Check all data rows
    for (const row of rows) {
      const cellValue = String(row[colIndex] ?? '')
      if (cellValue.length > maxWidth) {
        maxWidth = cellValue.length
      }
    }

    // Add padding and cap at reasonable max
    return { wch: Math.min(maxWidth + 2, 50) }
  })

  ws['!cols'] = colWidths

  // Create workbook and add worksheet
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  return wb
}

/**
 * Convert any value to appropriate Excel representation.
 */
function formatValueForExcel(value: unknown): string | number | boolean {
  if (value === null || value === undefined) {
    return ''
  }
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}

// ─── Excel Export ───────────────────────────────────────────────────────────

/**
 * Generate and download Excel file from data.
 * Combines generation and download in one step.
 *
 * @param data - Array of objects to export
 * @param columns - Column definitions with headers and optional formatting
 * @param filename - Download filename (without .xlsx extension)
 * @param sheetName - Name for the worksheet (default: 'Report')
 *
 * @example
 * ```ts
 * exportToExcel(budgetData, budgetColumns, 'budget-report-2026-01')
 * ```
 */
export function exportToExcel<T extends object>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string,
  sheetName = 'Report'
): void {
  const wb = generateExcelWorkbook(data, columns, sheetName)

  // Write to binary array buffer
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  // Create blob and trigger download
  const blob = new Blob([wbOut], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)

  // Create temporary download link
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.xlsx`)
  link.style.visibility = 'hidden'

  // Trigger download
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up object URL
  URL.revokeObjectURL(url)
}
