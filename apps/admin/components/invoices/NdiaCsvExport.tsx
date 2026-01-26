'use client'

import { useState, useEffect } from 'react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ephraimcare/ui/components/card'
import { Button } from '@ephraimcare/ui/components/button'
import { Input } from '@ephraimcare/ui/components/input'
import { Label } from '@ephraimcare/ui/components/label'
import { Alert, AlertDescription, AlertTitle } from '@ephraimcare/ui/components/alert'
import { Loader2, Download, FileText, AlertTriangle, CheckCircle } from 'lucide-react'

import { toast } from '@/lib/toast'

interface ExportPreview {
  invoiceCount: number
  claimableLineItems: number
  totalValue: number
  participantsWithNdis: number
  warnings: string[]
}

interface NdiaCsvExportProps {
  organizationHasRegistration: boolean
}

export function NdiaCsvExport({ organizationHasRegistration }: NdiaCsvExportProps) {
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Load preview when dates change
  useEffect(() => {
    if (startDate && endDate) {
      loadPreview()
    }
  }, [startDate, endDate])

  const loadPreview = async () => {
    setIsLoadingPreview(true)
    try {
      const response = await fetch(
        `/api/ndia/generate-csv?startDate=${startDate}&endDate=${endDate}`
      )
      if (!response.ok) throw new Error('Failed to load preview')
      const data = await response.json()
      setPreview(data)
    } catch (error) {
      console.error('Preview error:', error)
      setPreview(null)
    }
    setIsLoadingPreview(false)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/ndia/generate-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.validationErrors?.join(', ') || 'Export failed')
      }

      // Get filename from header or generate default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] || `ndia-claims-${startDate}-${endDate}.csv`

      // Download file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const totalClaims = response.headers.get('X-Total-Claims')
      const totalValue = response.headers.get('X-Total-Value')

      toast({
        title: `Exported ${totalClaims} claims ($${totalValue ? parseFloat(totalValue).toLocaleString() : '0'})`,
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Export failed',
        variant: 'error',
      })
    }
    setIsExporting(false)
  }

  // Quick date presets
  const setLastMonth = () => {
    const lastMonth = subDays(startOfMonth(new Date()), 1)
    setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'))
  }

  const setThisMonth = () => {
    setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          NDIA Bulk Claim Export
        </CardTitle>
        <CardDescription>
          Generate PACE-compliant CSV for myplace portal upload
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Registration warning */}
        {!organizationHasRegistration && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Registration Number Required</AlertTitle>
            <AlertDescription>
              Your organization&apos;s NDIS registration number is not set.
              Please update it in Settings before exporting.
            </AlertDescription>
          </Alert>
        )}

        {/* Date range selection */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={setThisMonth}>
              This Month
            </Button>
            <Button variant="outline" size="sm" onClick={setLastMonth}>
              Last Month
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Preview stats */}
        {isLoadingPreview ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border p-3">
                <div className="text-2xl font-bold">{preview.invoiceCount}</div>
                <div className="text-muted-foreground">Finalized Invoices</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-2xl font-bold">{preview.claimableLineItems}</div>
                <div className="text-muted-foreground">Claimable Items</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-2xl font-bold">
                  ${preview.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-muted-foreground">Total Value</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-2xl font-bold">{preview.participantsWithNdis}</div>
                <div className="text-muted-foreground">Participants</div>
              </div>
            </div>

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm">
                    {preview.warnings.slice(0, 5).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {preview.warnings.length > 5 && (
                      <li>...and {preview.warnings.length - 5} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Export button */}
            <Button
              className="w-full"
              onClick={handleExport}
              disabled={isExporting || !organizationHasRegistration || preview.claimableLineItems === 0}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating CSV...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PACE CSV ({preview.claimableLineItems} claims)
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No data available for selected date range
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
          <p className="font-medium">How to submit:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Download the CSV file using the button above</li>
            <li>Log in to the myplace provider portal</li>
            <li>Navigate to Payment Requests &gt; Bulk Upload</li>
            <li>Upload the downloaded CSV file</li>
            <li>Review and submit the claims</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
