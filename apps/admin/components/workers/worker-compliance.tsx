"use client"

import { Shield, ShieldCheck } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@ephraimcare/ui'
import {
  getComplianceStatus,
  COMPLIANCE_COLORS,
  type ComplianceStatus,
} from '@/lib/workers/constants'

interface WorkerComplianceProps {
  ndisCheckNumber: string | null
  ndisCheckExpiry: string | null
  wwccNumber: string | null
  wwccExpiry: string | null
}

const STATUS_LABELS: Record<ComplianceStatus, string> = {
  valid: 'Valid',
  expiring: 'Expiring Soon',
  expired: 'Expired',
  not_set: 'Not Set',
}

const STATUS_BADGE_VARIANT: Record<ComplianceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  valid: 'default',
  expiring: 'secondary',
  expired: 'destructive',
  not_set: 'outline',
}

function formatExpiryDate(dateStr: string | null): string {
  if (!dateStr) return 'Not provided'
  try {
    return format(parseISO(dateStr), 'd MMM yyyy')
  } catch {
    return 'Invalid date'
  }
}

export function WorkerCompliance({
  ndisCheckNumber,
  ndisCheckExpiry,
  wwccNumber,
  wwccExpiry,
}: WorkerComplianceProps) {
  const allNull = !ndisCheckNumber && !ndisCheckExpiry && !wwccNumber && !wwccExpiry

  if (allNull) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No compliance checks recorded. Add them from the Edit page.
          </p>
        </CardContent>
      </Card>
    )
  }

  const ndisStatus = getComplianceStatus(ndisCheckExpiry)
  const wwccStatus = getComplianceStatus(wwccExpiry)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Checks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* NDIS Worker Check */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">NDIS Worker Check</p>
              <StatusBadge status={ndisStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {ndisCheckNumber ? `#${ndisCheckNumber}` : 'Number not provided'}
            </p>
            <p className="text-xs text-muted-foreground">
              Expires: {formatExpiryDate(ndisCheckExpiry)}
            </p>
          </div>
        </div>

        {/* WWCC */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Working with Children Check</p>
              <StatusBadge status={wwccStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {wwccNumber ? `#${wwccNumber}` : 'Number not provided'}
            </p>
            <p className="text-xs text-muted-foreground">
              Expires: {formatExpiryDate(wwccExpiry)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: ComplianceStatus }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${COMPLIANCE_COLORS[status]}`}
      />
      <Badge variant={STATUS_BADGE_VARIANT[status]} className="text-xs">
        {STATUS_LABELS[status]}
      </Badge>
    </div>
  )
}
