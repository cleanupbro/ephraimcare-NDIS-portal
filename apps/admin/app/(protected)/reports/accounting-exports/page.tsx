'use client'

import { useState } from 'react'
import { startOfMonth, endOfMonth, format as formatDate } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@ephraimcare/ui'
import {
  Download,
  FileSpreadsheet,
  Users,
  Clock,
  Info,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { DateRangePicker } from '@/components/reports/DateRangePicker'
import { toast } from '@/lib/toast'
import type { DateRangeFilter } from '@/lib/reports/types'

// ─── Types ──────────────────────────────────────────────────────────────────

type ExportFormat = 'xero' | 'myob'
type InvoiceStatus = 'submitted' | 'paid' | 'all'
type ParticipantStatus = 'active' | 'inactive' | 'all'

// ─── Export Handlers ────────────────────────────────────────────────────────

async function exportInvoices(
  format: ExportFormat,
  dateRange: DateRangeFilter,
  status: InvoiceStatus
) {
  const response = await fetch('/api/reports/export/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      format,
      from: dateRange.from.toISOString().split('T')[0],
      to: dateRange.to.toISOString().split('T')[0],
      status,
    }),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Export failed')
  }

  // Trigger download
  const blob = await response.blob()
  const formatLabel = format.toUpperCase()
  const filename = `${formatLabel}-Invoice-Export-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`
  downloadBlob(blob, filename)
}

async function exportParticipants(status: ParticipantStatus) {
  const response = await fetch('/api/reports/export/participants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Export failed')
  }

  const blob = await response.blob()
  const filename = `Participant-List-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`
  downloadBlob(blob, filename)
}

async function exportWorkerHours(dateRange: DateRangeFilter) {
  const response = await fetch('/api/reports/export/worker-hours', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: dateRange.from.toISOString().split('T')[0],
      to: dateRange.to.toISOString().split('T')[0],
    }),
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Export failed')
  }

  const blob = await response.blob()
  const filename = `Worker-Hours-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`
  downloadBlob(blob, filename)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function AccountingExportsPage() {
  // Invoice export state
  const [invoiceDateRange, setInvoiceDateRange] = useState<DateRangeFilter>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>('all')
  const [isExportingXero, setIsExportingXero] = useState(false)
  const [isExportingMyob, setIsExportingMyob] = useState(false)

  // Participant export state
  const [participantStatus, setParticipantStatus] = useState<ParticipantStatus>('active')
  const [isExportingParticipants, setIsExportingParticipants] = useState(false)

  // Worker hours export state
  const [workerDateRange, setWorkerDateRange] = useState<DateRangeFilter>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [isExportingWorkerHours, setIsExportingWorkerHours] = useState(false)

  // Export handlers with loading state and toast
  async function handleXeroExport() {
    setIsExportingXero(true)
    try {
      await exportInvoices('xero', invoiceDateRange, invoiceStatus)
      toast({
        title: 'Export complete',
        description: 'Xero invoice CSV downloaded successfully.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setIsExportingXero(false)
    }
  }

  async function handleMyobExport() {
    setIsExportingMyob(true)
    try {
      await exportInvoices('myob', invoiceDateRange, invoiceStatus)
      toast({
        title: 'Export complete',
        description: 'MYOB invoice CSV downloaded successfully.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setIsExportingMyob(false)
    }
  }

  async function handleParticipantsExport() {
    setIsExportingParticipants(true)
    try {
      await exportParticipants(participantStatus)
      toast({
        title: 'Export complete',
        description: 'Participant list CSV downloaded successfully.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setIsExportingParticipants(false)
    }
  }

  async function handleWorkerHoursExport() {
    setIsExportingWorkerHours(true)
    try {
      await exportWorkerHours(workerDateRange)
      toast({
        title: 'Export complete',
        description: 'Worker hours CSV downloaded successfully.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setIsExportingWorkerHours(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold">Accounting Exports</h1>
          <p className="text-sm text-muted-foreground">
            Export data for Xero, MYOB, and payroll integration
          </p>
        </div>
      </div>

      {/* Invoice Exports Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Invoice Export</CardTitle>
              <CardDescription>
                Export invoices in Xero or MYOB format for accounting software import
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DateRangePicker
                dateRange={invoiceDateRange}
                onDateRangeChange={setInvoiceDateRange}
              />
            </div>
            <div className="w-[150px]">
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select
                value={invoiceStatus}
                onValueChange={(v) => setInvoiceStatus(v as InvoiceStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Finalized</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleXeroExport}
              disabled={isExportingXero || isExportingMyob}
            >
              {isExportingXero ? (
                <>Exporting...</>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export for Xero
                </>
              )}
            </Button>
            <Button
              onClick={handleMyobExport}
              disabled={isExportingXero || isExportingMyob}
              variant="outline"
            >
              {isExportingMyob ? (
                <>Exporting...</>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export for MYOB
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Import Instructions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Import Instructions</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium mb-1">Xero</p>
                <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                  <li>Go to Business &gt; Invoices</li>
                  <li>Click Import</li>
                  <li>Select the downloaded CSV file</li>
                  <li>Map columns (auto-detected)</li>
                  <li>Review and import</li>
                </ol>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium mb-1">MYOB</p>
                <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                  <li>Go to Sales &gt; Import Sales</li>
                  <li>Select &quot;Tab-delimited&quot; format</li>
                  <li>Browse and select the CSV file</li>
                  <li>Match fields in the wizard</li>
                  <li>Complete import</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participant Export Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Participant List Export</CardTitle>
              <CardDescription>
                Export participant contact information and details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="w-[180px]">
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select
                value={participantStatus}
                onValueChange={(v) => setParticipantStatus(v as ParticipantStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                  <SelectItem value="all">All Participants</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Button */}
          <Button onClick={handleParticipantsExport} disabled={isExportingParticipants}>
            {isExportingParticipants ? (
              <>Exporting...</>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Participants
              </>
            )}
          </Button>

          {/* Included Fields */}
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Included fields:</p>
            <p>
              NDIS Number, Name, Email, Phone, Date of Birth, Address, Emergency Contact, Status
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Worker Hours Export Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Clock className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle>Worker Hours Export</CardTitle>
              <CardDescription>
                Export completed shift hours for payroll processing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 min-w-[200px] max-w-[400px]">
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DateRangePicker
                dateRange={workerDateRange}
                onDateRangeChange={setWorkerDateRange}
              />
            </div>
          </div>

          {/* Export Button */}
          <Button onClick={handleWorkerHoursExport} disabled={isExportingWorkerHours}>
            {isExportingWorkerHours ? (
              <>Exporting...</>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Worker Hours
              </>
            )}
          </Button>

          {/* Included Fields */}
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Included fields:</p>
            <p>
              Employee ID, Worker Name, Shift Date, Participant, Hours Worked, Support Type
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Date Format Note */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Australian Date Format</AlertTitle>
        <AlertDescription>
          All exported dates use DD/MM/YYYY format for Australian accounting software
          compatibility. GST is set to &quot;Free&quot; by default as NDIS services are typically
          GST-exempt.
        </AlertDescription>
      </Alert>
    </div>
  )
}
