import { pdf } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

/** Props passed to ReportPdfDocument component */
export interface ReportPdfData<T = unknown> {
  title: string
  dateRange: {
    from: Date
    to: Date
  }
  summaries: Array<{
    label: string
    value: string | number
  }>
  columns: Array<{
    header: string
    key: keyof T
    align?: 'left' | 'right' | 'center'
    format?: (value: unknown) => string
  }>
  data: T[]
}

// ─── PDF Generation ─────────────────────────────────────────────────────────

/**
 * Generate PDF blob from a React PDF document component.
 *
 * @param document - React PDF Document element
 * @returns Promise resolving to PDF Blob
 *
 * @example
 * ```ts
 * const blob = await generateReportPdf(
 *   <ReportPdfDocument {...props} />
 * )
 * ```
 */
export async function generateReportPdf(
  document: ReactElement
): Promise<Blob> {
  const instance = pdf(document)
  const blob = await instance.toBlob()
  return blob
}

// ─── PDF Download ───────────────────────────────────────────────────────────

/**
 * Generate and download PDF from a React PDF document component.
 * Combines generation and download in one step.
 *
 * @param document - React PDF Document element
 * @param filename - Download filename (without .pdf extension)
 *
 * @example
 * ```ts
 * await downloadPdf(
 *   <ReportPdfDocument {...props} />,
 *   'budget-report-2026-01'
 * )
 * ```
 */
export async function downloadPdf(
  document: ReactElement,
  filename: string
): Promise<void> {
  const blob = await generateReportPdf(document)
  const url = URL.createObjectURL(blob)

  // Create temporary download link
  const link = window.document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.pdf`)
  link.style.visibility = 'hidden'

  // Trigger download
  window.document.body.appendChild(link)
  link.click()
  window.document.body.removeChild(link)

  // Clean up object URL
  URL.revokeObjectURL(url)
}
