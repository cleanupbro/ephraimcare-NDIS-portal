'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@ephraimcare/ui'
import { toast } from 'sonner'

interface ExportCsvButtonProps {
  /** Invoice IDs to export (finalized invoices only) */
  invoiceIds?: string[]
  /** Button variant - outline for inline use, default for primary action */
  variant?: 'default' | 'outline'
  /** Button size */
  size?: 'default' | 'sm'
}

/**
 * Export PACE CSV button component.
 * Posts selected invoice IDs to the export-csv API and triggers browser download.
 */
export function ExportCsvButton({
  invoiceIds = [],
  variant = 'outline',
  size = 'sm',
}: ExportCsvButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const hasInvoices = invoiceIds.length > 0

  const handleExport = async () => {
    if (!hasInvoices) {
      toast.error('No finalized invoices to export')
      return
    }

    setIsExporting(true)

    try {
      const response = await fetch('/api/invoices/export-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoice_ids: invoiceIds }),
      })

      if (!response.ok) {
        // Try to parse error message
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const error = await response.json()
          throw new Error(error.error || 'Export failed')
        }
        throw new Error(`Export failed (${response.status})`)
      }

      // Create blob from response and trigger download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/)
      const filename = filenameMatch?.[1] || 'NDIS-Bulk-Payment.csv'

      // Create temporary anchor and trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${invoiceIds.length} invoice${invoiceIds.length !== 1 ? 's' : ''} to CSV`)
    } catch (error) {
      console.error('CSV export error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to export CSV')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={!hasInvoices || isExporting}
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export PACE CSV
        </>
      )}
    </Button>
  )
}
